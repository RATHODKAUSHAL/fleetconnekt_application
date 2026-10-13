import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import {
  CustomerFields,
  customerPayload,
  emptyCustomer,
  emptyVendor,
  validateCustomer,
  validateVendor,
  VendorFields,
  vendorPayload,
  type CustomerErrors,
  type CustomerForm,
  type VendorErrors,
  type VendorForm,
} from '@/components/party-forms';
import { SearchSheet, type SearchItem } from '@/components/search-sheet';
import {
  Banner,
  BottomSheet,
  DateField,
  Field,
  FormFooter,
  LoadingState,
  PressableField,
  PrimaryButton,
  Section,
  SecondaryButton,
  SelectField,
} from '@/components/ui';
import { useCompany } from '@/context/auth';
import { bookingStatusLabels, cityLabel, MONEY_PATTERN } from '@/lib/format';
import {
  bookingApi,
  bookingNumberSeriesApi,
  cityApi,
  customerApi,
  errorMessage,
  fieldErrorsFrom,
  vendorApi,
  type Booking,
  type BookingNumberSeries,
  type BookingPayload,
  type BookingStatus,
  type CityOption,
  type Customer,
  type Vendor,
} from '@/services/api';
import { searchGoogleCities } from '@/services/places';

type FormState = {
  booking_number: string;
  origin_city: CityOption | null;
  destination_city: CityOption | null;
  pickup_address: string;
  delivery_address: string;
  driver_number: string;
  vehicle_number: string;
  customer_freight: string;
  pickup_date: string;
  expected_delivery_date: string;
  status: BookingStatus;
  customer: Customer | null;
  vendor: Vendor | null;
  customer_reference: string;
  remarks: string;
  number_of_trucks: string;
};

type Errors = Partial<Record<string, string>>;

const statusOptions = (Object.keys(bookingStatusLabels) as BookingStatus[]).map((value) => ({
  value,
  label: bookingStatusLabels[value],
}));

function formFromBooking(booking?: Booking | null): FormState {
  return {
    booking_number: booking?.booking_number ?? '',
    origin_city: booking?.origin_city ?? null,
    destination_city: booking?.destination_city ?? null,
    pickup_address: booking?.pickup_address ?? '',
    delivery_address: booking?.delivery_address ?? '',
    driver_number: booking?.driver_number ?? '',
    vehicle_number: booking?.vehicle_number ?? '',
    customer_freight: booking?.customer_freight == null ? '' : String(booking.customer_freight),
    pickup_date: booking?.pickup_date ?? '',
    expected_delivery_date: booking?.expected_delivery_date ?? '',
    status: booking?.status ?? 'pending',
    customer: booking?.customer ?? null,
    vendor: booking?.vendor ?? null,
    customer_reference: booking?.customer_reference ?? '',
    remarks: booking?.remarks ?? '',
    number_of_trucks: '1',
  };
}

type CityResult = { kind: 'local'; city: CityOption } | { kind: 'google'; placeId: string; name: string; stateName: string };

export default function BookingFormScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid?: string }>();
  const { token, companyId } = useCompany();
  const editing = Boolean(uid);
  const [form, setForm] = useState<FormState>(() => formFromBooking());
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [series, setSeries] = useState<BookingNumberSeries | null>(null);
  const [picker, setPicker] = useState<'customer' | 'vendor' | 'origin' | 'destination' | null>(null);
  const [creating, setCreating] = useState<'customer' | 'vendor' | null>(null);
  const [createName, setCreateName] = useState('');

  // New bookings take their number from the company's series; the backend assigns it on save.
  const usesSeries = !editing && Boolean(series?.configured);

  useEffect(() => {
    if (!token || !companyId) return;
    const tasks: Promise<unknown>[] = [];
    if (uid) {
      tasks.push(
        bookingApi
          .get(token, companyId, uid)
          .then((booking) => setForm(formFromBooking(booking)))
          .catch((issue) => setError(errorMessage(issue, 'Could not load booking.'))),
      );
    } else {
      tasks.push(
        bookingNumberSeriesApi
          .get(token, companyId)
          .then(setSeries)
          .catch(() => setSeries(null)),
      );
    }
    Promise.all(tasks).finally(() => setLoading(false));
  }, [companyId, token, uid]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, [`${key}_id`]: undefined }));
  };

  function validate(): Errors {
    const next: Errors = {};
    const number = form.booking_number.trim();
    if (!usesSeries) {
      if (!number) next.booking_number = 'Booking number is required. Or set up a booking prefix to number bookings automatically.';
      else if (number.length > (editing ? 30 : 27)) next.booking_number = `Booking number must be ${editing ? 30 : 27} characters or fewer.`;
    }
    if (!form.origin_city) next.origin_city = 'Select the pickup city.';
    if (!form.destination_city) next.destination_city = 'Select the drop city.';
    else if (form.origin_city && form.origin_city.id === form.destination_city.id) next.destination_city = 'Drop city must be different from the pickup city.';
    if (!editing) {
      const trucks = Number(form.number_of_trucks);
      if (!Number.isInteger(trucks) || trucks < 1 || trucks > 10) next.number_of_trucks = 'Enter a number of trucks between 1 and 10.';
    }
    if (form.customer_freight.trim() && !MONEY_PATTERN.test(form.customer_freight.trim())) next.customer_freight = 'Enter a valid amount, like 25000 or 25000.50.';
    if (form.pickup_date && form.expected_delivery_date && form.expected_delivery_date < form.pickup_date) {
      next.expected_delivery_date = 'Expected delivery cannot be before the pickup date.';
    }
    if (form.vehicle_number.trim().length > 20) next.vehicle_number = 'Vehicle number must be 20 characters or fewer.';
    if (form.driver_number.trim().length > 30) next.driver_number = 'Driver number must be 30 characters or fewer.';
    if (form.customer_reference.trim().length > 100) next.customer_reference = 'Customer reference must be 100 characters or fewer.';
    return next;
  }

  async function save() {
    if (!token || !companyId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Please fix the highlighted fields and try again.');
      return;
    }

    const payload: BookingPayload = {
      ...(usesSeries ? {} : { booking_number: form.booking_number.trim() }),
      origin_city_id: form.origin_city!.id,
      destination_city_id: form.destination_city!.id,
      pickup_address: form.pickup_address.trim() || null,
      delivery_address: form.delivery_address.trim() || null,
      driver_number: form.driver_number.trim() || null,
      vehicle_number: form.vehicle_number.replace(/\s+/g, '').toUpperCase() || null,
      customer_freight: form.customer_freight.trim() || null,
      pickup_date: form.pickup_date || null,
      expected_delivery_date: form.expected_delivery_date || null,
      status: form.status,
      customer_id: form.customer?.id ?? null,
      vendor_id: form.vendor?.id ?? null,
      customer_reference: form.customer_reference.trim() || null,
      remarks: form.remarks.trim() || null,
      ...(editing ? {} : { number_of_trucks: Number(form.number_of_trucks) || 1 }),
    };

    setSaving(true);
    setError(null);
    try {
      if (uid) await bookingApi.update(token, companyId, uid, payload);
      else await bookingApi.create(token, companyId, payload);
      router.back();
    } catch (issue) {
      const serverErrors = fieldErrorsFrom(issue);
      setErrors({
        ...serverErrors,
        origin_city: serverErrors.origin_city_id,
        destination_city: serverErrors.destination_city_id,
        customer: serverErrors.customer_id,
        vendor: serverErrors.vendor_id,
      });
      setError(errorMessage(issue, 'Could not save booking. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  const searchCustomers = async (query: string): Promise<SearchItem<Customer>[]> => {
    if (!token || !companyId) return [];
    const items = await customerApi.list(token, companyId, query);
    return items.slice(0, 20).map((customer) => ({
      key: customer.uid,
      title: customer.name,
      subtitle: [customer.company_name, customer.phone].filter(Boolean).join(' · '),
      value: customer,
    }));
  };

  const searchVendors = async (query: string): Promise<SearchItem<Vendor>[]> => {
    if (!token || !companyId) return [];
    const items = await vendorApi.list(token, companyId, query);
    // Only active vendors can be assigned to bookings.
    return items
      .filter((vendor) => vendor.is_active)
      .slice(0, 20)
      .map((vendor) => ({
        key: vendor.uid,
        title: vendor.name,
        subtitle: [vendor.company_name, vendor.mobile].filter(Boolean).join(' · '),
        value: vendor,
      }));
  };

  const searchCities = async (query: string): Promise<SearchItem<CityResult>[]> => {
    if (!token) return [];
    const local = await cityApi.search(token, query);
    if (local.length) {
      return local.map((city) => ({ key: `local-${city.id}`, title: cityLabel(city), subtitle: 'Saved city', value: { kind: 'local', city } }));
    }
    const google = await searchGoogleCities(query);
    return google.map((city) => ({
      key: `google-${city.placeId}`,
      title: city.label,
      subtitle: 'Google Places',
      value: { kind: 'google', placeId: city.placeId, name: city.name, stateName: city.stateName },
    }));
  };

  async function resolveCity(result: CityResult): Promise<CityOption> {
    if (result.kind === 'local') return result.city;
    if (!token) throw new Error('Not signed in');
    try {
      return await cityApi.create(token, {
        state_name: result.stateName || 'India',
        name: result.name,
        google_place_id: result.placeId,
        latitude: null,
        longitude: null,
        source: 'google_places',
        is_active: true,
      });
    } catch {
      // The city may already have been saved by someone else; fall back to a local match.
      const [match] = await cityApi.search(token, result.name);
      if (!match) throw new Error('Could not save city');
      return match;
    }
  }

  // iOS cannot show a second modal while one is open, so close the search sheet first.
  const openCreate = (kind: 'customer' | 'vendor', query: string) => {
    setPicker(null);
    setCreateName(query);
    setTimeout(() => setCreating(kind), 350);
  };

  return (
    <SubScreen
      title={editing ? 'Edit booking' : 'New booking'}
      footer={
        <FormFooter>
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
          <PrimaryButton label={editing ? 'Update booking' : 'Create booking'} icon="checkmark" loading={saving} disabled={loading} onPress={save} />
        </FormFooter>
      }>
      {loading ? (
        <LoadingState label="Loading booking..." />
      ) : (
        <View className="gap-3">
          <Banner tone="error" message={error} />

          <Section icon="package-variant-closed" title="Booking details">
            {usesSeries ? (
              <Field
                label="Booking number"
                value={series?.next_booking_number ?? ''}
                editable={false}
                helper="Assigned automatically from your booking prefix."
              />
            ) : (
              <Field
                label="Booking number"
                required
                value={form.booking_number}
                onChangeText={(value) => update('booking_number', value)}
                placeholder="BK-000123"
                autoCapitalize="characters"
                error={errors.booking_number}
                helper={editing ? undefined : 'Tip: set up a booking prefix in Settings to number bookings automatically.'}
              />
            )}
            <View className="mt-3 flex-row gap-3">
              <PartyPicker label="Customer" value={form.customer ? [form.customer.name, form.customer.company_name].filter(Boolean).join(' - ') : ''} placeholder="Search customer" error={errors.customer} onPress={() => setPicker('customer')} onClear={form.customer ? () => update('customer', null) : undefined} />
            </View>
            <View className="mt-3 flex-row gap-3">
              <PartyPicker label="Vendor" value={form.vendor ? [form.vendor.name, form.vendor.company_name].filter(Boolean).join(' - ') : ''} placeholder="Search vendor" error={errors.vendor} onPress={() => setPicker('vendor')} onClear={form.vendor ? () => update('vendor', null) : undefined} />
            </View>
            <View className="mt-3 flex-row gap-3">
              <SelectField label="Status" required value={form.status} options={statusOptions} onChange={(value) => update('status', value)} error={errors.status} />
              {!editing ? (
                <Field label="Number of trucks" value={form.number_of_trucks} onChangeText={(value) => update('number_of_trucks', value.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" error={errors.number_of_trucks} />
              ) : null}
            </View>
            {!editing && Number(form.number_of_trucks) > 1 ? (
              <Text className="font-manrope-medium mt-1.5 text-[10px] text-[#8290a1]">
                One booking is created per truck, numbered with a -01, -02 ... suffix.
              </Text>
            ) : null}
            <View className="mt-3 flex-row gap-3">
              <Field label="Customer freight" prefix="Rs" value={form.customer_freight} onChangeText={(value) => update('customer_freight', value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0" error={errors.customer_freight} />
              <Field label="Customer reference" value={form.customer_reference} onChangeText={(value) => update('customer_reference', value)} placeholder="PO / ref no." error={errors.customer_reference} maxLength={100} />
            </View>
          </Section>

          <Section icon="map-marker-path" title="Route and schedule">
            <View className="flex-row gap-3">
              <PressableField label="Pickup city" required value={cityLabel(form.origin_city)} placeholder="Search city" icon="search" error={errors.origin_city} onPress={() => setPicker('origin')} />
            </View>
            <View className="mt-3 flex-row gap-3">
              <PressableField label="Drop city" required value={cityLabel(form.destination_city)} placeholder="Search city" icon="search" error={errors.destination_city} onPress={() => setPicker('destination')} />
            </View>
            <View className="mt-3">
              <Field label="Pickup address" value={form.pickup_address} onChangeText={(value) => update('pickup_address', value)} placeholder="Enter pickup address" multiline />
            </View>
            <View className="mt-3">
              <Field label="Delivery address" value={form.delivery_address} onChangeText={(value) => update('delivery_address', value)} placeholder="Enter delivery address" multiline />
            </View>
            <View className="mt-3 flex-row gap-3">
              <DateField label="Pickup date" value={form.pickup_date} onChange={(value) => update('pickup_date', value)} error={errors.pickup_date} />
              <DateField label="Expected delivery" value={form.expected_delivery_date} onChange={(value) => update('expected_delivery_date', value)} error={errors.expected_delivery_date} />
            </View>
          </Section>

          <Section icon="truck-outline" title="Vehicle and driver">
            <View className="flex-row gap-3">
              <Field label="Vehicle number" value={form.vehicle_number} onChangeText={(value) => update('vehicle_number', value.toUpperCase())} placeholder="GJ06BV8768" autoCapitalize="characters" autoCorrect={false} error={errors.vehicle_number} maxLength={20} />
              <Field label="Driver number" value={form.driver_number} onChangeText={(value) => update('driver_number', value)} placeholder="9876543210" keyboardType="phone-pad" error={errors.driver_number} maxLength={30} />
            </View>
          </Section>

          <Section icon="note-text-outline" title="Remarks">
            <Field label="Remarks" value={form.remarks} onChangeText={(value) => update('remarks', value)} placeholder="Any notes for this booking" multiline />
          </Section>
        </View>
      )}

      <SearchSheet<Customer>
        visible={picker === 'customer'}
        title="Select customer"
        placeholder="Search customer, company, phone"
        icon="account-outline"
        search={searchCustomers}
        onSelect={(customer) => update('customer', customer)}
        onClose={() => setPicker(null)}
        createLabel="Create new customer"
        onCreate={(query) => openCreate('customer', query)}
      />
      <SearchSheet<Vendor>
        visible={picker === 'vendor'}
        title="Select vendor"
        placeholder="Type 3+ characters"
        icon="truck-outline"
        minChars={3}
        search={searchVendors}
        onSelect={(vendor) => update('vendor', vendor)}
        onClose={() => setPicker(null)}
        createLabel="Create new vendor"
        onCreate={(query) => openCreate('vendor', query)}
      />
      <SearchSheet<CityResult>
        visible={picker === 'origin' || picker === 'destination'}
        title={picker === 'origin' ? 'Pickup city' : 'Drop city'}
        placeholder="Type at least 3 characters"
        icon="city-variant-outline"
        minChars={3}
        search={searchCities}
        onSelect={async (result) => {
          const target = picker === 'origin' ? 'origin_city' : 'destination_city';
          try {
            update(target, await resolveCity(result));
          } catch {
            setErrors((current) => ({ ...current, [target]: 'Could not save this city. Please try again.' }));
          }
        }}
        onClose={() => setPicker(null)}
      />

      <QuickCreateCustomer
        visible={creating === 'customer'}
        initialName={createName}
        onClose={() => setCreating(null)}
        onCreated={(customer) => {
          update('customer', customer);
          setCreating(null);
        }}
      />
      <QuickCreateVendor
        visible={creating === 'vendor'}
        initialName={createName}
        onClose={() => setCreating(null)}
        onCreated={(vendor) => {
          update('vendor', vendor);
          setCreating(null);
        }}
      />
    </SubScreen>
  );
}

function PartyPicker({
  label,
  value,
  placeholder,
  error,
  onPress,
  onClear,
}: {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-end gap-2">
      <PressableField label={label} value={value} placeholder={placeholder} icon="search" error={error} onPress={onPress} />
      {onClear ? (
        <Pressable onPress={onClear} accessibilityLabel={`Remove ${label.toLowerCase()}`} className={`h-[42px] w-[42px] items-center justify-center rounded-[9px] border border-[#d8d5cf] bg-white ${error ? 'mb-[18px]' : ''}`}>
          <Ionicons name="close" size={18} color="#617091" />
        </Pressable>
      ) : null}
    </View>
  );
}

function QuickCreateCustomer({
  visible,
  initialName,
  onClose,
  onCreated,
}: {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) {
  const { token, companyId } = useCompany();
  const [form, setForm] = useState<CustomerForm>(emptyCustomer);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({ ...emptyCustomer, name: initialName });
      setErrors({});
      setError(null);
    }
  }, [initialName, visible]);

  async function save() {
    if (!token || !companyId) return;
    const nextErrors = validateCustomer(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setError(null);
    try {
      onCreated(await customerApi.create(token, companyId, customerPayload(form)));
    } catch (issue) {
      setErrors(fieldErrorsFrom(issue));
      setError(errorMessage(issue, 'Could not create customer. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} title="Create customer" onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-3">
          <Banner tone="error" message={error} />
          <CustomerFields
            form={form}
            errors={errors}
            onChange={(key, value) => {
              setForm((current) => ({ ...current, [key]: value }));
              setErrors((current) => ({ ...current, [key]: undefined }));
            }}
          />
        </View>
      </ScrollView>
      <View className="flex-row gap-3 pt-2">
        <SecondaryButton label="Cancel" onPress={onClose} />
        <PrimaryButton label="Create & select" loading={saving} onPress={save} />
      </View>
    </BottomSheet>
  );
}

function QuickCreateVendor({
  visible,
  initialName,
  onClose,
  onCreated,
}: {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
}) {
  const { token, companyId } = useCompany();
  const [form, setForm] = useState<VendorForm>(emptyVendor);
  const [errors, setErrors] = useState<VendorErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm({ ...emptyVendor, name: initialName });
      setErrors({});
      setError(null);
    }
  }, [initialName, visible]);

  async function save() {
    if (!token || !companyId) return;
    const nextErrors = validateVendor(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setError(null);
    try {
      onCreated(await vendorApi.create(token, companyId, vendorPayload(form)));
    } catch (issue) {
      setErrors(fieldErrorsFrom(issue));
      setError(errorMessage(issue, 'Could not create vendor. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} title="Create vendor" onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-3">
          <Banner tone="error" message={error} />
          <VendorFields
            form={form}
            errors={errors}
            onChange={(key, value) => {
              setForm((current) => ({ ...current, [key]: value }));
              setErrors((current) => ({ ...current, [key]: undefined }));
            }}
          />
        </View>
      </ScrollView>
      <View className="flex-row gap-3 pt-2">
        <SecondaryButton label="Cancel" onPress={onClose} />
        <PrimaryButton label="Create & select" loading={saving} onPress={save} />
      </View>
    </BottomSheet>
  );
}

