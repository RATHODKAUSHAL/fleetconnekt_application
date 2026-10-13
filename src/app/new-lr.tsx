import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen, SubScreen } from '@/components/app-shell';
import { ListHeader } from '@/components/list';
import {
  Banner,
  BottomSheet,
  ChipButton,
  DateField,
  EmptyState,
  Field,
  FilterChips,
  FormFooter,
  LoadingState,
  NAVY,
  ORANGE,
  PrimaryButton,
  SecondaryButton,
  type MaterialIconName,
} from '@/components/ui';
import { useAuth } from '@/context/auth';
import { formatDate, formatMoney, money, todayIso } from '@/lib/format';
import { errorMessage, fieldErrorsFrom, lrApi, type LorryReceipt, type LorryReceiptCopy, type LorryReceiptPayload } from '@/services/api';
import { printLr, shareLr } from '@/services/lr-print';

type Step = 1 | 2 | 3 | 4;
type StatusFilter = 'All' | LorryReceipt['status'];

const GST_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
const PIN_PATTERN = /^\d{6}$/;
const CONTACT_PATTERN = /^\+?[\d\s-]{7,15}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

const steps: { step: Step; label: string }[] = [
  { step: 1, label: 'Parties\ndetails' },
  { step: 2, label: 'Fleet\ndetails' },
  { step: 3, label: 'Material\ndetails' },
  { step: 4, label: 'Generate\nLR' },
];

const copies: LorryReceiptCopy[] = ['Consignor copy', 'Consignee copy', 'Driver copy', 'Office copy'];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Generated', label: 'Generated' },
  { value: 'Printed', label: 'Printed' },
];

const emptyForm = {
  lrNumber: '',
  lrDate: '',
  consignorName: '',
  consignorGst: '',
  consignorContact: '',
  consignorAddress: '',
  consignorCity: '',
  consignorState: '',
  consignorPin: '',
  consigneeName: '',
  consigneeGst: '',
  consigneeContact: '',
  consigneeAddress: '',
  consigneeCity: '',
  consigneeState: '',
  consigneePin: '',
  truckNumber: '',
  vehicleType: '',
  from: '',
  to: '',
  driverName: '',
  driverMobile: '',
  driverLicense: '',
  ownerName: '',
  ownerMobile: '',
  ownerPan: '',
  ownerAddress: '',
  materialName: '',
  materialWeight: '',
  rate: '',
  freightAmount: '',
  charges: '',
  totalAmount: '',
  advance: '',
  balance: '',
};

type LrForm = typeof emptyForm;
type FormKey = keyof LrForm;
type Errors = Partial<Record<FormKey, string>>;

// Laravel field names → form keys, so server errors land under the right input.
const apiKeys: Record<string, FormKey> = {
  lr_number: 'lrNumber',
  lr_date: 'lrDate',
  consignor_name: 'consignorName',
  consignor_gst: 'consignorGst',
  consignor_contact: 'consignorContact',
  consignor_address: 'consignorAddress',
  consignor_city: 'consignorCity',
  consignor_state: 'consignorState',
  consignor_pin: 'consignorPin',
  consignee_name: 'consigneeName',
  consignee_gst: 'consigneeGst',
  consignee_contact: 'consigneeContact',
  consignee_address: 'consigneeAddress',
  consignee_city: 'consigneeCity',
  consignee_state: 'consigneeState',
  consignee_pin: 'consigneePin',
  truck_number: 'truckNumber',
  vehicle_type: 'vehicleType',
  from: 'from',
  to: 'to',
  driver_name: 'driverName',
  driver_mobile: 'driverMobile',
  driver_license: 'driverLicense',
  owner_name: 'ownerName',
  owner_mobile: 'ownerMobile',
  owner_pan: 'ownerPan',
  owner_address: 'ownerAddress',
  material_name: 'materialName',
  material_weight: 'materialWeight',
  rate: 'rate',
  freight_amount: 'freightAmount',
  charges: 'charges',
  total_amount: 'totalAmount',
  advance: 'advance',
  balance: 'balance',
};

const stepFields: Record<Exclude<Step, 4>, FormKey[]> = {
  1: ['lrNumber', 'lrDate', 'consignorName', 'consignorGst', 'consignorContact', 'consignorAddress', 'consignorCity', 'consignorState', 'consignorPin', 'consigneeName', 'consigneeGst', 'consigneeContact', 'consigneeAddress', 'consigneeCity', 'consigneeState', 'consigneePin'],
  2: ['truckNumber', 'vehicleType', 'from', 'to', 'driverName', 'driverMobile', 'driverLicense', 'ownerName', 'ownerMobile', 'ownerPan', 'ownerAddress'],
  3: ['materialName', 'materialWeight', 'rate', 'freightAmount', 'charges', 'totalAmount', 'advance', 'balance'],
};

function newLrNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `LR-${stamp}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

function lrToForm(lr: LorryReceipt): LrForm {
  const text = (value: string | number | null | undefined) => (value === null || value === undefined ? '' : String(value));
  const amount = (value: string | number | null | undefined) => (Number(value) ? String(Number(value)) : '');
  return {
    lrNumber: lr.lr_number,
    lrDate: lr.lr_date?.slice(0, 10) ?? '',
    consignorName: text(lr.consignor_name),
    consignorGst: text(lr.consignor_gst),
    consignorContact: text(lr.consignor_contact),
    consignorAddress: text(lr.consignor_address),
    consignorCity: text(lr.consignor_city),
    consignorState: text(lr.consignor_state),
    consignorPin: text(lr.consignor_pin),
    consigneeName: text(lr.consignee_name),
    consigneeGst: text(lr.consignee_gst),
    consigneeContact: text(lr.consignee_contact),
    consigneeAddress: text(lr.consignee_address),
    consigneeCity: text(lr.consignee_city),
    consigneeState: text(lr.consignee_state),
    consigneePin: text(lr.consignee_pin),
    truckNumber: text(lr.truck_number),
    vehicleType: text(lr.vehicle_type),
    from: text(lr.from),
    to: text(lr.to),
    driverName: text(lr.driver_name),
    driverMobile: text(lr.driver_mobile),
    driverLicense: text(lr.driver_license),
    ownerName: text(lr.owner_name),
    ownerMobile: text(lr.owner_mobile),
    ownerPan: text(lr.owner_pan),
    ownerAddress: text(lr.owner_address),
    materialName: text(lr.material_name),
    materialWeight: text(lr.material_weight),
    rate: amount(lr.rate),
    freightAmount: amount(lr.freight_amount),
    charges: amount(lr.charges),
    totalAmount: amount(lr.total_amount),
    advance: amount(lr.advance),
    balance: amount(lr.balance),
  };
}

function getTotals(form: LrForm) {
  const total = money(form.totalAmount) || money(form.freightAmount) + money(form.charges);
  const balance = money(form.balance) || Math.max(total - money(form.advance), 0);
  return { total, balance };
}

function formToPayload(form: LrForm, copyType: LorryReceiptCopy, status: LorryReceipt['status']): LorryReceiptPayload {
  const totals = getTotals(form);
  const value = (key: FormKey) => form[key].trim() || null;
  return {
    lr_number: form.lrNumber.trim(),
    lr_date: value('lrDate'),
    consignor_name: value('consignorName'),
    consignor_gst: value('consignorGst'),
    consignor_contact: value('consignorContact'),
    consignor_address: value('consignorAddress'),
    consignor_city: value('consignorCity'),
    consignor_state: value('consignorState'),
    consignor_pin: value('consignorPin'),
    consignee_name: value('consigneeName'),
    consignee_gst: value('consigneeGst'),
    consignee_contact: value('consigneeContact'),
    consignee_address: value('consigneeAddress'),
    consignee_city: value('consigneeCity'),
    consignee_state: value('consigneeState'),
    consignee_pin: value('consigneePin'),
    truck_number: form.truckNumber.replace(/\s+/g, ' ').trim().toUpperCase() || null,
    vehicle_type: value('vehicleType'),
    from: value('from'),
    to: value('to'),
    driver_name: value('driverName'),
    driver_mobile: value('driverMobile'),
    driver_license: value('driverLicense'),
    owner_name: value('ownerName'),
    owner_mobile: value('ownerMobile'),
    owner_pan: value('ownerPan'),
    owner_address: value('ownerAddress'),
    material_name: value('materialName'),
    material_weight: value('materialWeight'),
    rate: money(form.rate),
    freight_amount: money(form.freightAmount),
    charges: money(form.charges),
    total_amount: totals.total,
    advance: money(form.advance),
    balance: totals.balance,
    copy_type: copyType,
    // Same public receipt URL the website stores.
    share_url: `https://fleetconnekt.com/lr/${encodeURIComponent(form.lrNumber.trim())}`,
    status,
  };
}

function validateStep(step: Step, form: LrForm): Errors {
  const errors: Errors = {};
  const check = (key: FormKey, pattern: RegExp, message: string, transform = (value: string) => value) => {
    const value = transform(form[key].trim());
    if (value && !pattern.test(value)) errors[key] = message;
  };

  if (step === 1) {
    if (!form.lrNumber.trim()) errors.lrNumber = 'LR number is required.';
    else if (form.lrNumber.trim().length > 100) errors.lrNumber = 'LR number must be 100 characters or fewer.';
    for (const party of ['consignor', 'consignee'] as const) {
      check(`${party}Gst`, GST_PATTERN, 'Enter a valid 15-character GSTIN.', (value) => value.toUpperCase());
      check(`${party}Contact`, CONTACT_PATTERN, 'Enter a valid contact number.');
      check(`${party}Pin`, PIN_PATTERN, 'Pin code must be 6 digits.');
    }
  }
  if (step === 2) {
    check('driverMobile', CONTACT_PATTERN, 'Enter a valid mobile number.');
    check('ownerMobile', CONTACT_PATTERN, 'Enter a valid mobile number.');
    check('ownerPan', PAN_PATTERN, 'Enter a valid PAN, like ABCDE1234F.', (value) => value.toUpperCase());
  }
  if (step === 3) {
    for (const key of ['rate', 'freightAmount', 'charges', 'totalAmount', 'advance', 'balance'] as const) {
      check(key, AMOUNT_PATTERN, 'Enter a valid amount with up to 2 decimals.');
    }
  }
  return errors;
}

export default function NewLrScreen() {
  const { token } = useAuth();
  const [lrs, setLrs] = useState<LorryReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<LorryReceipt | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setListError(null);
      setLrs(await lrApi.list(token));
    } catch (issue) {
      setListError(errorMessage(issue, 'Could not load LRs.'));
    }
  }, [token]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const openForm = (lr: LorryReceipt | null) => {
    setEditing(lr);
    setMode('form');
  };

  const onSaved = (saved: LorryReceipt) => {
    setLrs((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    setMode('list');
    setEditing(null);
  };

  if (mode === 'form') {
    return <LrFormScreen lr={editing} onClose={() => setMode('list')} onSaved={onSaved} />;
  }

  return (
    <LrListScreen
      lrs={lrs}
      loading={loading}
      error={listError}
      onRefresh={load}
      onGenerate={() => openForm(null)}
      onEdit={(lr) => openForm(lr)}
      onDeleted={(id) => setLrs((current) => current.filter((item) => item.id !== id))}
    />
  );
}

function LrListScreen({
  lrs,
  loading,
  error,
  onRefresh,
  onGenerate,
  onEdit,
  onDeleted,
}: {
  lrs: LorryReceipt[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onGenerate: () => void;
  onEdit: (lr: LorryReceipt) => void;
  onDeleted: (id: number) => void;
}) {
  const { token } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<LorryReceipt | null>(null);
  const searchRef = useRef<TextInput>(null);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return lrs.filter((item) => {
      const matchesFilter = filter === 'All' || item.status === filter;
      const searchable = [item.lr_number, item.from, item.to, item.material_name, item.truck_number, item.consignor_name, item.consignee_name]
        .join(' ')
        .toLowerCase();
      return matchesFilter && (!search || searchable.includes(search));
    });
  }, [filter, lrs, query]);

  const refresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  function confirmDelete(lr: LorryReceipt) {
    Alert.alert('Delete LR?', `This will remove ${lr.lr_number}. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await lrApi.delete(token, lr.id);
            setSelected(null);
            onDeleted(lr.id);
          } catch (issue) {
            Alert.alert('Could not delete LR', errorMessage(issue));
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}>
      <View className="w-full max-w-[560px] self-center px-[18px] pt-3">
        <ListHeader title="My LRs" subtitle="Manage and view all your generated Lorry Receipts" actionLabel="Generate LR" onAction={onGenerate} />

        <View className="mt-4 flex-row items-center gap-2.5">
          <View className="min-w-0 flex-1">
            <FilterChips options={statusFilters} value={filter} onChange={setFilter} />
          </View>
          <Pressable
            onPress={() => searchRef.current?.focus()}
            accessibilityLabel="Search LRs"
            className="h-9 w-9 items-center justify-center rounded-[10px] border border-[#e5e9ef] bg-white">
            <Ionicons name="search" size={19} color={NAVY} />
          </Pressable>
        </View>

        <View className="mt-2.5 h-[38px] flex-row items-center rounded-[11px] border border-[#ebe8e2] bg-white px-3">
          <Ionicons name="search-outline" size={16} color="#8a95a5" />
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search LR number, route, material..."
            placeholderTextColor="#8a95a5"
            autoCorrect={false}
            className="font-manrope-medium ml-2 flex-1 py-0 text-[10px] text-[#17253a]"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#9aa4b2" />
            </Pressable>
          ) : null}
        </View>

        <View className="mt-3 gap-2.5">
          <Banner tone="error" message={error} />
          {loading ? (
            <LoadingState label="Loading LRs..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="file-document-outline"
              title={lrs.length ? 'No matching LRs' : 'No LRs yet'}
              description={lrs.length ? 'Try another search or filter.' : 'Generate your first digital lorry receipt.'}
              actionLabel={lrs.length ? undefined : 'Generate LR'}
              onAction={onGenerate}
            />
          ) : (
            filtered.map((item) => <LrCard key={item.id} item={item} onPress={() => setSelected(item)} />)
          )}
        </View>
      </View>

      <BottomSheet visible={Boolean(selected)} title={selected?.lr_number ?? 'LR'} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <ReceiptPreview lr={selected} />
            </ScrollView>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <ChipButton label="Edit" icon="create-outline" onPress={() => { const lr = selected; setSelected(null); onEdit(lr); }} />
              <ChipButton label="Share" icon="share-social-outline" onPress={() => void shareLr(selected)} />
              <ChipButton label="Print / PDF" icon="print-outline" tone="orange" onPress={() => void printLr(selected)} />
              <ChipButton label="Delete" icon="trash-outline" tone="danger" onPress={() => confirmDelete(selected)} />
            </View>
          </>
        ) : null}
      </BottomSheet>
    </AppScreen>
  );
}

function LrCard({ item, onPress }: { item: LorryReceipt; onPress: () => void }) {
  const tone =
    item.status === 'Printed'
      ? { bg: '#e7f0ff', color: '#2f6fd6', iconBg: '#e7f0ff', icon: 'printer-check' as MaterialIconName }
      : { bg: '#d9f3ec', color: '#0b876f', iconBg: '#ddf8ee', icon: 'file-document-check-outline' as MaterialIconName };

  return (
    <Pressable onPress={onPress} className="rounded-[13px] border border-[#e3e7ed] bg-white p-3 active:opacity-90" style={localStyles.cardShadow}>
      <View className="flex-row items-start">
        <View className="h-[46px] w-[46px] items-center justify-center rounded-[12px]" style={{ backgroundColor: tone.iconBg }}>
          <MaterialCommunityIcons name={tone.icon} size={25} color={tone.color} />
        </View>
        <View className="ml-2.5 min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row items-center">
              <Text className="font-manrope-extrabold shrink text-[13px] text-[#10243e]" numberOfLines={1}>{item.lr_number}</Text>
              <View className="ml-1.5 rounded-full px-2 py-0.5" style={{ backgroundColor: tone.bg }}>
                <Text className="font-manrope-bold text-[8px]" style={{ color: tone.color }}>{item.status}</Text>
              </View>
            </View>
            <Text className="font-manrope-semibold text-[9px] text-[#637194]">{formatDate(item.lr_date || item.created_at)}</Text>
            <Ionicons name="ellipsis-vertical" size={17} color="#496181" />
          </View>
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="location-outline" size={17} color={ORANGE} />
            <Text numberOfLines={1} className="font-manrope-bold ml-1 shrink text-[11px] text-[#10243e]">{item.from || '-'}</Text>
            <Ionicons name="arrow-forward" size={13} color="#617091" style={{ marginHorizontal: 5 }} />
            <Text numberOfLines={1} className="font-manrope-bold shrink text-[11px] text-[#10243e]">{item.to || '-'}</Text>
          </View>
        </View>
      </View>
      <View className="mt-3 flex-row items-center">
        <LrMeta icon="cube-outline" label={item.material_name || '-'} />
        <Divider />
        <LrMeta icon="truck-outline" label={item.truck_number || '-'} />
        <Divider />
        <LrMeta icon="weight-kilogram" label={item.material_weight || '-'} />
        <View className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-[#f4f6fa]">
          <Ionicons name="chevron-forward" size={16} color={NAVY} />
        </View>
      </View>
    </Pressable>
  );
}

function LrMeta({ icon, label }: { icon: MaterialIconName; label: string }) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center">
      <MaterialCommunityIcons name={icon} size={15} color="#53688a" />
      <Text className="font-manrope-semibold ml-1.5 min-w-0 flex-1 text-[9px] text-[#637194]" numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View className="mx-1.5 h-4 w-px bg-[#dce1e8]" />;
}

function LrFormScreen({ lr, onClose, onSaved }: { lr: LorryReceipt | null; onClose: () => void; onSaved: (lr: LorryReceipt) => void }) {
  const { token } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<LrForm>(() => (lr ? lrToForm(lr) : { ...emptyForm, lrNumber: newLrNumber(), lrDate: todayIso() }));
  const [copyType, setCopyType] = useState<LorryReceiptCopy>(lr?.copy_type ?? 'Consignor copy');
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'save' | 'print' | null>(null);

  // Android back returns to the LR list instead of leaving the screen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  const onChange = (key: FormKey, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      // Keep total and balance in step with freight, charges and advance, like the website.
      if (key === 'freightAmount' || key === 'charges' || key === 'advance') {
        const total = money(next.freightAmount) + money(next.charges);
        next.totalAmount = total ? String(total) : '';
        const balance = Math.max(total - money(next.advance), 0);
        next.balance = balance ? String(balance) : '';
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function goNext() {
    const stepErrors = validateStep(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      setError('Please fix the highlighted fields to continue.');
      return;
    }
    setError(null);
    setStep((current) => (current < 4 ? ((current + 1) as Step) : current));
  }

  async function save(andPrint: boolean) {
    if (!token) return;
    // Re-check every step; jump to the first one with a problem.
    for (const candidate of [1, 2, 3] as const) {
      const stepErrors = validateStep(candidate, form);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        setStep(candidate);
        setError('Please fix the highlighted fields and try again.');
        return;
      }
    }

    setSaving(andPrint ? 'print' : 'save');
    setError(null);
    try {
      const payload = formToPayload(form, copyType, andPrint ? 'Printed' : lr?.status ?? 'Generated');
      const saved = lr ? await lrApi.update(token, lr.id, payload) : await lrApi.create(token, payload);
      if (andPrint) await printLr(saved);
      onSaved(saved);
    } catch (issue) {
      const serverErrors = fieldErrorsFrom(issue);
      const mapped: Errors = {};
      for (const [key, message] of Object.entries(serverErrors)) if (apiKeys[key]) mapped[apiKeys[key]] = message;
      setErrors(mapped);
      const firstStep = ([1, 2, 3] as const).find((candidate) => stepFields[candidate].some((key) => mapped[key]));
      if (firstStep) setStep(firstStep);
      setError(errorMessage(issue, 'Could not save LR. Please try again.'));
    } finally {
      setSaving(null);
    }
  }

  const footer =
    step === 4 ? (
      <FormFooter>
        <SecondaryButton label={lr ? 'Update LR' : 'Save LR'} icon="document-text-outline" disabled={Boolean(saving)} onPress={() => save(false)} />
        <PrimaryButton label="Save & print LR" icon="print-outline" tone="navy" loading={saving === 'print'} disabled={Boolean(saving)} onPress={() => save(true)} />
      </FormFooter>
    ) : (
      <FormFooter>
        <SecondaryButton label="Previous" icon="arrow-back" disabled={step === 1} onPress={() => { setError(null); setStep((current) => (current > 1 ? ((current - 1) as Step) : current)); }} />
        <PrimaryButton label="Next step" icon="arrow-forward" onPress={goNext} />
      </FormFooter>
    );

  return (
    <SubScreen title={lr ? 'Edit Digital LR' : 'Generate Digital LR'} onBack={onClose} subheader={<Stepper currentStep={step} />} footer={footer}>
      <View className="gap-3">
        <Banner tone="error" message={error} />
        {step === 1 ? <PartiesStep form={form} errors={errors} onChange={onChange} /> : null}
        {step === 2 ? <FleetStep form={form} errors={errors} onChange={onChange} /> : null}
        {step === 3 ? <MaterialStep form={form} errors={errors} onChange={onChange} /> : null}
        {step === 4 ? (
          <>
            <CollapsiblePanel title="Select carbon copy sheet">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.copyRow}>
                {copies.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCopyType(item)}
                    className={`h-9 items-center justify-center rounded-[9px] border px-3.5 ${copyType === item ? 'border-[#ff8a22] bg-[#fff7ef]' : 'border-[#dce1e8] bg-white'}`}>
                    <Text className={`font-manrope-bold text-[10px] ${copyType === item ? 'text-[#f27022]' : 'text-[#10243e]'}`}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </CollapsiblePanel>
            <CollapsiblePanel title="Goods carriage receipt">
              <ReceiptPreview lr={{ ...formToPayload(form, copyType, 'Generated'), id: 0, user_id: null, created_at: '', updated_at: '' }} />
            </CollapsiblePanel>
          </>
        ) : null}
      </View>
    </SubScreen>
  );
}

function Stepper({ currentStep }: { currentStep: Step }) {
  return (
    <View className="mb-3 mt-1.5 flex-row items-start px-2">
      {steps.map((item, index) => {
        const complete = item.step < currentStep;
        const active = item.step === currentStep;
        return (
          <View key={item.step} className="min-w-0 flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View className={`h-px flex-1 ${index === 0 ? 'bg-transparent' : item.step <= currentStep ? 'bg-[#ff8a22]' : 'bg-[#cfd5dd]'}`} />
              <View className={`h-8 w-8 items-center justify-center rounded-full ${complete || active ? 'bg-[#ff7a0f]' : 'bg-[#e8ebf0]'}`}>
                {complete ? (
                  <Ionicons name="checkmark" size={18} color="white" />
                ) : (
                  <Text className={`font-manrope-extrabold text-[12px] ${active ? 'text-white' : 'text-[#516072]'}`}>{item.step}</Text>
                )}
              </View>
              <View className={`h-px flex-1 ${index === steps.length - 1 ? 'bg-transparent' : item.step < currentStep ? 'bg-[#ff8a22]' : 'bg-[#cfd5dd]'}`} />
            </View>
            <Text className={`font-manrope-bold mt-1.5 text-center text-[10px] leading-[12px] ${active || complete ? 'text-[#10243e]' : 'text-[#617091]'}`}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

type StepProps = { form: LrForm; errors: Errors; onChange: (key: FormKey, value: string) => void };

function PartiesStep({ form, errors, onChange }: StepProps) {
  return (
    <>
      <Section icon="calendar-outline" title="LR number and date">
        <View className="flex-row gap-3">
          <Field label="LR number" required value={form.lrNumber} onChangeText={(value) => onChange('lrNumber', value)} autoCapitalize="characters" error={errors.lrNumber} maxLength={100} />
          <DateField label="LR date" value={form.lrDate} onChange={(value) => onChange('lrDate', value)} error={errors.lrDate} />
        </View>
      </Section>
      <PartySection title="Consignor details" prefix="consignor" form={form} errors={errors} onChange={onChange} />
      <PartySection title="Consignee details" prefix="consignee" form={form} errors={errors} onChange={onChange} />
    </>
  );
}

function PartySection({ title, prefix, form, errors, onChange }: StepProps & { title: string; prefix: 'consignor' | 'consignee' }) {
  const key = (suffix: 'Name' | 'Gst' | 'Contact' | 'Address' | 'City' | 'State' | 'Pin') => `${prefix}${suffix}` as FormKey;
  return (
    <Section icon="office-building-outline" title={title}>
      <Field label="Name" value={form[key('Name')]} onChangeText={(value) => onChange(key('Name'), value)} placeholder="Enter name" error={errors[key('Name')]} />
      <View className="mt-3 flex-row gap-3">
        <Field label="GST number" value={form[key('Gst')]} onChangeText={(value) => onChange(key('Gst'), value.toUpperCase())} placeholder="29AABCU9603R1ZJ" autoCapitalize="characters" maxLength={15} error={errors[key('Gst')]} />
        <Field label="Contact number" value={form[key('Contact')]} onChangeText={(value) => onChange(key('Contact'), value)} placeholder="9876543210" keyboardType="phone-pad" maxLength={15} error={errors[key('Contact')]} />
      </View>
      <View className="mt-3">
        <Field label="Address" value={form[key('Address')]} onChangeText={(value) => onChange(key('Address'), value)} placeholder="Enter complete address" multiline error={errors[key('Address')]} />
      </View>
      <View className="mt-3 flex-row gap-3">
        <Field label="City" value={form[key('City')]} onChangeText={(value) => onChange(key('City'), value)} placeholder="City" error={errors[key('City')]} maxLength={120} />
        <Field label="State" value={form[key('State')]} onChangeText={(value) => onChange(key('State'), value)} placeholder="State" error={errors[key('State')]} maxLength={120} />
        <Field label="Pin code" value={form[key('Pin')]} onChangeText={(value) => onChange(key('Pin'), value.replace(/\D/g, ''))} placeholder="380061" keyboardType="number-pad" maxLength={6} error={errors[key('Pin')]} />
      </View>
    </Section>
  );
}

function FleetStep({ form, errors, onChange }: StepProps) {
  return (
    <>
      <Section icon="truck-outline" title="Fleet details">
        <View className="flex-row gap-3">
          <Field label="Truck number" value={form.truckNumber} onChangeText={(value) => onChange('truckNumber', value.toUpperCase())} placeholder="MH 12 AB 4567" autoCapitalize="characters" error={errors.truckNumber} maxLength={100} />
          <Field label="Vehicle type" value={form.vehicleType} onChangeText={(value) => onChange('vehicleType', value)} placeholder="Container, Trailer..." error={errors.vehicleType} maxLength={120} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="From" value={form.from} onChangeText={(value) => onChange('from', value)} placeholder="Origin city" error={errors.from} maxLength={150} />
          <Field label="To" value={form.to} onChangeText={(value) => onChange('to', value)} placeholder="Destination city" error={errors.to} maxLength={150} />
        </View>
      </Section>

      <Section icon="account-outline" title="Truck driver details (optional)">
        <View className="flex-row gap-3">
          <Field label="Driver name" value={form.driverName} onChangeText={(value) => onChange('driverName', value)} placeholder="Enter driver name" error={errors.driverName} />
          <Field label="Mobile number" value={form.driverMobile} onChangeText={(value) => onChange('driverMobile', value)} placeholder="9876543210" keyboardType="phone-pad" maxLength={15} error={errors.driverMobile} />
        </View>
        <View className="mt-3">
          <Field label="License number" value={form.driverLicense} onChangeText={(value) => onChange('driverLicense', value.toUpperCase())} placeholder="Enter license no." autoCapitalize="characters" error={errors.driverLicense} maxLength={120} />
        </View>
        <View className="mt-3 flex-row rounded-[10px] border border-[#ffbc7f] bg-[#fffaf4] p-2.5">
          <Ionicons name="information-circle-outline" size={22} color={ORANGE} />
          <Text className="font-manrope-medium ml-2.5 min-w-0 flex-1 text-[11px] leading-[16px] text-[#26364b]">
            If driver does not own the vehicle, fill vehicle owner or supplier details below.
          </Text>
        </View>
      </Section>

      <Section icon="office-building-outline" title="Vehicle owner / supplier details">
        <View className="flex-row gap-3">
          <Field label="Owner / supplier name" value={form.ownerName} onChangeText={(value) => onChange('ownerName', value)} placeholder="Enter name" error={errors.ownerName} />
          <Field label="Owner mobile" value={form.ownerMobile} onChangeText={(value) => onChange('ownerMobile', value)} placeholder="9876543210" keyboardType="phone-pad" maxLength={15} error={errors.ownerMobile} />
        </View>
        <View className="mt-3">
          <Field label="PAN number" value={form.ownerPan} onChangeText={(value) => onChange('ownerPan', value.toUpperCase())} placeholder="ABCDE1234F" autoCapitalize="characters" maxLength={10} error={errors.ownerPan} />
        </View>
        <View className="mt-3">
          <Field label="Address" value={form.ownerAddress} onChangeText={(value) => onChange('ownerAddress', value)} placeholder="Enter complete address" multiline error={errors.ownerAddress} />
        </View>
      </Section>
    </>
  );
}

function MaterialStep({ form, errors, onChange }: StepProps) {
  const totals = getTotals(form);
  const amountProps = (key: FormKey) => ({
    value: form[key],
    onChangeText: (value: string) => onChange(key, value.replace(/[^0-9.]/g, '')),
    keyboardType: 'decimal-pad' as const,
    prefix: 'Rs',
    placeholder: '0',
    error: errors[key],
  });

  return (
    <>
      <Section icon="cube-outline" title="Material details">
        <Field label="Material name" value={form.materialName} onChangeText={(value) => onChange('materialName', value)} placeholder="Cement (OPC)" error={errors.materialName} />
        <View className="mt-3">
          <Field label="Material weight" value={form.materialWeight} onChangeText={(value) => onChange('materialWeight', value)} placeholder="1000 kg" error={errors.materialWeight} maxLength={120} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="Rate (per kg)" {...amountProps('rate')} />
          <Field label="Freight amount" {...amountProps('freightAmount')} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="Charges" {...amountProps('charges')} />
          <Field label="Total amount" {...amountProps('totalAmount')} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="Advance" {...amountProps('advance')} />
          <Field label="Balance" {...amountProps('balance')} />
        </View>
      </Section>

      <Section icon="currency-inr" title="Amount summary">
        <SummaryRow label="Freight amount" value={formatMoney(money(form.freightAmount), 2)} />
        <SummaryRow label="Charges" value={formatMoney(money(form.charges), 2)} />
        <SummaryRow label="Advance" value={formatMoney(money(form.advance), 2)} />
        <View className="my-3 h-px bg-[#e6e2dc]" />
        <SummaryRow label="Total amount" value={formatMoney(totals.total, 2)} strong />
        <SummaryRow label="Balance" value={formatMoney(totals.balance, 2)} strong />
      </Section>
    </>
  );
}

function ReceiptPreview({ lr }: { lr: LorryReceipt }) {
  const address = (parts: (string | null)[]) => parts.filter(Boolean).join(', ') || '-';
  return (
    <View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-manrope-extrabold text-[18px] text-[#10243e]">FLEETCONNEKT LR</Text>
          <Text className="font-manrope-medium text-[10px] text-[#65728a]">Digital lorry receipt for road freight movement</Text>
        </View>
        <View className="items-end">
          <View className="mb-2 rounded-[8px] border border-[#ffc07f] px-3 py-2">
            <Text className="font-manrope-extrabold text-[10px] uppercase text-[#f27022]">{lr.copy_type}</Text>
          </View>
          <Text className="font-manrope-bold text-[11px] text-[#10243e]">LR: {lr.lr_number || '-'}</Text>
          <Text className="font-manrope-bold text-[11px] text-[#10243e]">Date: {formatDate(lr.lr_date)}</Text>
        </View>
      </View>

      <View className="my-4 h-px bg-[#6e7890]" />

      <View className="flex-row">
        <ReceiptParty title="Consignor" name={lr.consignor_name} address={address([lr.consignor_address, lr.consignor_city, lr.consignor_state, lr.consignor_pin])} gst={lr.consignor_gst} contact={lr.consignor_contact} />
        <View className="mx-3 w-px bg-[#e0ddd8]" />
        <ReceiptParty title="Consignee" name={lr.consignee_name} address={address([lr.consignee_address, lr.consignee_city, lr.consignee_state, lr.consignee_pin])} gst={lr.consignee_gst} contact={lr.consignee_contact} />
      </View>

      <View className="my-4 h-px bg-[#ece8e2]" />

      <View className="flex-row flex-wrap gap-2">
        <ReceiptTile icon="map-marker-outline" label="From" value={lr.from || '-'} />
        <ReceiptTile icon="map-marker-outline" label="To" value={lr.to || '-'} />
        <ReceiptTile icon="truck-outline" label="Truck" value={lr.truck_number || '-'} />
        <ReceiptTile icon="truck-cargo-container" label="Vehicle type" value={lr.vehicle_type || '-'} />
        <ReceiptTile icon="cube-outline" label="Material" value={lr.material_name || '-'} />
        <ReceiptTile icon="weight-kilogram" label="Weight" value={lr.material_weight || '-'} />
        <ReceiptTile icon="currency-inr" label="Rate" value={Number(lr.rate) ? formatMoney(lr.rate, 2) : '-'} />
        <ReceiptTile icon="account-outline" label="Driver" value={lr.driver_name || '-'} />
        <ReceiptTile icon="card-account-details-outline" label="License" value={lr.driver_license || '-'} />
        <ReceiptTile icon="office-building-outline" label="Vehicle owner / supplier" value={`${lr.owner_name || '-'}\nPAN: ${lr.owner_pan || '-'}`} wide />
        <View className="min-w-[160px] flex-1 rounded-[10px] border-l border-[#e0ddd8] p-3">
          <Text className="font-manrope-extrabold text-[10px] uppercase text-[#728095]">Freight ledger</Text>
          <SummaryRow label="Freight amount" value={formatMoney(lr.freight_amount, 2)} compact />
          <SummaryRow label="Charges" value={formatMoney(lr.charges, 2)} compact />
          <SummaryRow label="Advance" value={formatMoney(lr.advance, 2)} compact />
          <View className="my-2 h-px bg-[#cfd5dd]" />
          <SummaryRow label="Total amount" value={formatMoney(lr.total_amount, 2)} strong compact />
          <SummaryRow label="Balance" value={formatMoney(lr.balance, 2)} strong compact />
        </View>
      </View>

      <View className="my-4 h-px bg-[#e0ddd8]" />

      <View className="flex-row justify-between gap-3">
        <Signature label="Driver signature" />
        <Signature label="Consignor stamp" />
        <Signature label="Office signatory" />
      </View>
    </View>
  );
}

function Section({ icon, title, children }: { icon: MaterialIconName; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <View className="rounded-[12px] border border-[#e0ddd8] bg-white p-3" style={localStyles.cardShadow}>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        className={`flex-row items-center ${open ? 'mb-2.5' : ''}`}>
        <MaterialCommunityIcons name={icon} size={21} color={ORANGE} />
        <Text className="font-manrope-extrabold ml-2.5 min-w-0 flex-1 text-[14px] text-[#10243e]">{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#617091" />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function CollapsiblePanel({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <View className="rounded-[12px] border border-[#e4e2dd] bg-white p-3" style={localStyles.cardShadow}>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} ${title}`}
        className={`flex-row items-center ${open ? 'mb-2' : ''}`}>
        <Text className="font-manrope-extrabold min-w-0 flex-1 text-[11px] uppercase text-[#728095]">{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#617091" />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function SummaryRow({ label, value, strong, compact }: { label: string; value: string; strong?: boolean; compact?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between ${compact ? 'mt-2' : 'mt-3'}`}>
      <Text className={`${strong ? 'font-manrope-extrabold text-[#10243e]' : 'font-manrope-medium text-[#65728a]'} ${compact ? 'text-[10px]' : 'text-[13px]'}`}>{label}</Text>
      <Text className={`font-manrope-extrabold text-[#10243e] ${compact ? 'text-[11px]' : 'text-[14px]'}`}>{value}</Text>
    </View>
  );
}

function ReceiptParty({ title, name, address, gst, contact }: { title: string; name: string | null; address: string; gst: string | null; contact: string | null }) {
  return (
    <View className="min-w-0 flex-1">
      <View className="flex-row items-center">
        <MaterialCommunityIcons name="office-building-outline" size={20} color={ORANGE} />
        <Text className="font-manrope-extrabold ml-2 text-[11px] uppercase text-[#728095]">{title}</Text>
      </View>
      <Text className="font-manrope-extrabold mt-3 text-[12px] text-[#10243e]">{name || '-'}</Text>
      <Text className="font-manrope-medium mt-1 text-[11px] leading-[17px] text-[#26364b]">{address}</Text>
      <Text className="font-manrope-medium mt-1 text-[11px] text-[#26364b]">GST: {gst || '-'}</Text>
      <Text className="font-manrope-medium mt-1 text-[11px] text-[#26364b]">Contact: {contact || '-'}</Text>
    </View>
  );
}

function ReceiptTile({ icon, label, value, wide }: { icon: MaterialIconName; label: string; value: string; wide?: boolean }) {
  return (
    <View className={`rounded-[10px] bg-[#faf9f6] p-3 ${wide ? 'min-w-[170px] flex-1' : 'w-[31%]'}`}>
      <View className="mb-2 flex-row items-center">
        <MaterialCommunityIcons name={icon} size={15} color={ORANGE} />
        <Text numberOfLines={1} className="font-manrope-extrabold ml-1.5 shrink text-[9px] uppercase text-[#728095]">{label}</Text>
      </View>
      <Text className="font-manrope-bold text-[11px] leading-[17px] text-[#10243e]">{value}</Text>
    </View>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <View className="min-w-0 flex-1 items-center pt-4">
      <View className="mb-3 h-px w-full bg-[#8c94a3]" />
      <Text className="font-manrope-extrabold text-center text-[9px] uppercase text-[#728095]">{label}</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  copyRow: {
    gap: 10,
    paddingTop: 12,
  },
});
