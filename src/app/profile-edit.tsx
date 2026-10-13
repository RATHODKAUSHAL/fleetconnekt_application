import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { SearchSheet, type SearchItem } from '@/components/search-sheet';
import { Banner, Field, FieldLabel, FieldMessage, FormFooter, ORANGE, PressableField, PrimaryButton, Section, SecondaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { EMAIL_PATTERN, INDIAN_MOBILE_PATTERN, normalizeIndianMobile, URL_PATTERN } from '@/lib/format';
import { authApi, errorMessage, fieldErrorsFrom, publicApi, type Location, type Service, type ServiceType, type User } from '@/services/api';

type FormState = {
  name: string;
  email: string;
  mobile: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  website: string;
  stateId: number | null;
  stateName: string;
  cityId: number | null;
  cityName: string;
  serviceIds: number[];
  serviceTypeIds: number[];
};

function formFromUser(user: User | null): FormState {
  const company = user?.companies?.[0];
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    mobile: user?.mobile ?? '',
    companyName: company?.name ?? '',
    companyPhone: company?.phone ?? '',
    companyEmail: company?.email ?? '',
    website: company?.website ?? '',
    stateId: company?.state_id ?? null,
    stateName: company?.state?.name ?? '',
    cityId: company?.city_id ?? null,
    cityName: company?.city?.name ?? '',
    serviceIds: company?.services?.map((service) => service.id) ?? [],
    serviceTypeIds: company?.service_types?.map((type) => type.id) ?? [],
  };
}

// Server error keys → form keys, so Laravel messages land under the right field.
const serverKeys: Record<string, keyof FormState> = {
  name: 'name',
  email: 'email',
  mobile: 'mobile',
  'company.name': 'companyName',
  'company.phone': 'companyPhone',
  'company.email': 'companyEmail',
  'company.website': 'website',
  'company.state_id': 'stateName',
  'company.city_id': 'cityName',
  service_ids: 'serviceIds',
  service_types: 'serviceTypeIds',
};

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  const email = form.email.trim();
  const mobile = form.mobile.trim();
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (mobile && !INDIAN_MOBILE_PATTERN.test(normalizeIndianMobile(mobile))) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.';
  }
  if (!form.companyName.trim()) errors.companyName = 'Company name is required.';
  else if (form.companyName.trim().length > 150) errors.companyName = 'Company name must be 150 characters or fewer.';
  if (form.companyPhone.trim().length > 30) errors.companyPhone = 'Company phone must be 30 characters or fewer.';
  if (form.companyEmail.trim() && !EMAIL_PATTERN.test(form.companyEmail.trim())) {
    errors.companyEmail = 'Enter a valid company email address, like fleet@example.com.';
  }
  if (form.website.trim() && !URL_PATTERN.test(form.website.trim())) {
    errors.website = 'Enter a full website address starting with http:// or https://';
  }
  if (form.stateName.trim() && !form.stateId) errors.stateName = 'Pick a state from the search results.';
  if (form.cityName.trim() && !form.cityId) errors.cityName = 'Pick a city from the search results.';
  return errors;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';
  const { token, user, setUser, signOut } = useAuth();
  const [form, setForm] = useState<FormState>(() => formFromUser(user));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [picker, setPicker] = useState<'state' | 'city' | null>(null);

  useEffect(() => {
    Promise.all([publicApi.services(), publicApi.serviceTypes()])
      .then(([serviceList, typeList]) => {
        setServices(serviceList);
        setServiceTypes(typeList);
      })
      .catch((issue) => setError(errorMessage(issue, 'Could not load services.')))
      .finally(() => setCatalogLoading(false));
  }, []);

  const availableTypes = useMemo(
    () => serviceTypes.filter((type) => form.serviceIds.includes(type.service_id)),
    [form.serviceIds, serviceTypes],
  );

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function toggleService(serviceId: number) {
    setForm((current) => {
      const serviceIds = current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId];
      const allowed = serviceTypes.filter((type) => serviceIds.includes(type.service_id)).map((type) => type.id);
      return { ...current, serviceIds, serviceTypeIds: current.serviceTypeIds.filter((id) => allowed.includes(id)) };
    });
  }

  function toggleServiceType(typeId: number) {
    setForm((current) => ({
      ...current,
      serviceTypeIds: current.serviceTypeIds.includes(typeId)
        ? current.serviceTypeIds.filter((id) => id !== typeId)
        : [...current.serviceTypeIds, typeId],
    }));
  }

  async function save() {
    if (!token) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Please fix the highlighted fields and try again.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile(token, {
        name: form.name.trim() || null,
        email: form.email.trim(),
        mobile: normalizeIndianMobile(form.mobile.trim()) || null,
        company: {
          name: form.companyName.trim(),
          state_id: form.stateId,
          city_id: form.cityId,
          locality_id: null,
          phone: form.companyPhone.trim() || null,
          email: form.companyEmail.trim() || null,
          website: form.website.trim() || null,
        },
        service_ids: form.serviceIds,
        service_types: form.serviceTypeIds,
      });
      setUser(updated);
      if (isOnboarding) router.replace('/home');
      else router.back();
    } catch (issue) {
      const serverErrors = fieldErrorsFrom(issue);
      setErrors(
        Object.fromEntries(
          Object.entries(serverErrors)
            .filter(([key]) => serverKeys[key] || key.startsWith('service'))
            .map(([key, message]) => [serverKeys[key] ?? (key.startsWith('service_types') ? 'serviceTypeIds' : 'serviceIds'), message]),
        ),
      );
      setError(errorMessage(issue, 'Could not update profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  const searchStates = async (query: string): Promise<SearchItem<Location>[]> =>
    (await publicApi.searchStates(query)).map((state) => ({ key: String(state.id), title: state.name, value: state }));

  const searchCities = async (query: string): Promise<SearchItem<Location>[]> =>
    form.stateId
      ? (await publicApi.searchCities(form.stateId, query)).map((city) => ({ key: String(city.id), title: city.name, subtitle: form.stateName, value: city }))
      : [];

  async function leaveOnboarding() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SubScreen
      title={isOnboarding ? 'Complete registration' : 'Update profile'}
      allowWithoutCompany
      hideBack={isOnboarding}
      right={
        isOnboarding ? (
          <Pressable onPress={leaveOnboarding} hitSlop={8}>
            <Text className="font-manrope-bold text-[12px] text-[#cf5c38]">Logout</Text>
          </Pressable>
        ) : undefined
      }
      footer={
        <FormFooter>
          {isOnboarding ? null : <SecondaryButton label="Cancel" onPress={() => router.back()} />}
          <PrimaryButton label={isOnboarding ? 'Save and continue' : 'Save profile'} icon="checkmark" loading={saving} onPress={save} />
        </FormFooter>
      }>
      <View className="gap-3">
        {isOnboarding ? (
          <Banner tone="info" message="Add your company details to start managing bookings, customers, vendors and LRs." />
        ) : null}
        <Banner tone="error" message={error} />

        <Section icon="account-outline" title="User details">
          <Field label="Name" value={form.name} onChangeText={(value) => update('name', value)} placeholder="Your full name" error={errors.name} maxLength={255} />
          <View className="mt-3">
            <Field label="Email" required value={form.email} onChangeText={(value) => update('email', value)} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} maxLength={255} />
          </View>
          <View className="mt-3">
            <Field label="Mobile" value={form.mobile} onChangeText={(value) => update('mobile', value)} placeholder="9876543210" keyboardType="phone-pad" maxLength={16} error={errors.mobile} />
          </View>
        </Section>

        <Section icon="office-building-outline" title="Company details">
          <Field label="Company name" required value={form.companyName} onChangeText={(value) => update('companyName', value)} placeholder="Fleet Logistics" error={errors.companyName} maxLength={150} />
          <View className="mt-3 flex-row gap-3">
            <Field label="Company phone" value={form.companyPhone} onChangeText={(value) => update('companyPhone', value)} placeholder="9876543210" keyboardType="phone-pad" error={errors.companyPhone} maxLength={30} />
            <Field label="Company email" value={form.companyEmail} onChangeText={(value) => update('companyEmail', value)} placeholder="fleet@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.companyEmail} />
          </View>
          <View className="mt-3">
            <Field label="Website" value={form.website} onChangeText={(value) => update('website', value)} placeholder="https://example.com" keyboardType="url" autoCapitalize="none" autoCorrect={false} error={errors.website} />
          </View>
          <View className="mt-3 flex-row gap-3">
            <PressableField label="State" value={form.stateName} placeholder="Search state" icon="search" onPress={() => setPicker('state')} error={errors.stateName} />
            <PressableField
              label="City"
              value={form.cityName}
              placeholder={form.stateId ? 'Search city' : 'Select state first'}
              icon="search"
              disabled={!form.stateId}
              onPress={() => setPicker('city')}
              error={errors.cityName}
            />
          </View>
        </Section>

        <Section icon="truck-cargo-container" title="Services">
          {catalogLoading ? (
            <ActivityIndicator color={ORANGE} />
          ) : (
            <>
              <FieldLabel label="Services you offer" />
              <ChipGroup
                options={services.map((service) => ({ id: service.id, label: service.name }))}
                selected={form.serviceIds}
                onToggle={toggleService}
                emptyText="No active services found."
              />
              <FieldMessage error={errors.serviceIds} />
              <View className="mt-3">
                <FieldLabel label="Service types" />
                <ChipGroup
                  options={availableTypes.map((type) => ({ id: type.id, label: type.name }))}
                  selected={form.serviceTypeIds}
                  onToggle={toggleServiceType}
                  emptyText={form.serviceIds.length ? 'No active service types found.' : 'Select a service first.'}
                />
                <FieldMessage error={errors.serviceTypeIds} />
              </View>
            </>
          )}
        </Section>
      </View>

      <SearchSheet<Location>
        visible={picker === 'state'}
        title="Select state"
        placeholder="Type at least 3 characters"
        icon="map-outline"
        minChars={3}
        search={searchStates}
        onSelect={(state) => {
          setForm((current) => ({ ...current, stateId: state.id, stateName: state.name, cityId: null, cityName: '' }));
          setErrors((current) => ({ ...current, stateName: undefined, cityName: undefined }));
        }}
        onClose={() => setPicker(null)}
      />
      <SearchSheet<Location>
        visible={picker === 'city'}
        title="Select city"
        placeholder="Type at least 3 characters"
        icon="city-variant-outline"
        minChars={3}
        search={searchCities}
        onSelect={(city) => {
          setForm((current) => ({ ...current, cityId: city.id, cityName: city.name }));
          setErrors((current) => ({ ...current, cityName: undefined }));
        }}
        onClose={() => setPicker(null)}
      />
    </SubScreen>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  emptyText,
}: {
  options: { id: number; label: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  emptyText: string;
}) {
  if (!options.length) return <Text className="font-manrope-medium text-[11px] text-[#8290a1]">{emptyText}</Text>;
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.id);
        return (
          <Pressable
            key={option.id}
            onPress={() => onToggle(option.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            className={`h-9 flex-row items-center rounded-[10px] border px-3 ${active ? 'border-[#ffdac0] bg-[#fff0e5]' : 'border-[#e5e9ef] bg-white'}`}>
            <Ionicons name={active ? 'checkbox' : 'square-outline'} size={15} color={active ? ORANGE : '#8290a1'} />
            <Text className={`font-manrope-bold ml-1.5 text-[11px] ${active ? 'text-[#f27022]' : 'text-[#26364b]'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
