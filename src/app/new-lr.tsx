import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { AppKeyboardAwareScrollView } from '@/components/keyboard-controller';

const ORANGE = '#ff7417';
const NAVY = '#10243e';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type IonIconName = ComponentProps<typeof Ionicons>['name'];
type ScreenMode = 'list' | 'form';
type Step = 1 | 2 | 3 | 4;
type LrStatus = 'Generated' | 'Draft' | 'Cancelled';

const lrRecords: {
  id: string;
  status: LrStatus;
  date: string;
  from: string;
  to: string;
  material: string;
  truck: string;
  weight: string;
}[] = [
  { id: 'LR-2026-4302', status: 'Generated', date: '12 Aug 2026', from: 'Ahmedabad', to: 'Mumbai', material: 'Cement (OPC)', truck: 'MH 12 AB 4567', weight: '1000 kg' },
  { id: 'LR-2026-4301', status: 'Draft', date: '11 Aug 2026', from: 'Surat', to: 'Delhi', material: 'Steel Rods', truck: 'GJ 01 XX 9876', weight: '2000 kg' },
  { id: 'LR-2026-4298', status: 'Generated', date: '10 Aug 2026', from: 'Bengaluru', to: 'Chennai', material: 'Industrial Goods', truck: 'KA 05 MN 1122', weight: '1500 kg' },
  { id: 'LR-2026-4295', status: 'Cancelled', date: '08 Aug 2026', from: 'Ahmedabad', to: 'Jaipur', material: 'Machinery Parts', truck: 'GJ 27 AB 6543', weight: '800 kg' },
  { id: 'LR-2026-4290', status: 'Generated', date: '05 Aug 2026', from: 'Pune', to: 'Nagpur', material: 'Electronics', truck: 'MH 14 CD 7788', weight: '1200 kg' },
  { id: 'LR-2026-4287', status: 'Generated', date: '02 Aug 2026', from: 'Delhi', to: 'Lucknow', material: 'Consumer Goods', truck: 'DL 01 XY 3344', weight: '900 kg' },
];

const steps: { step: Step; label: string }[] = [
  { step: 1, label: 'Parties\ndetails' },
  { step: 2, label: 'Fleet\ndetails' },
  { step: 3, label: 'Material\ndetails' },
  { step: 4, label: 'Generate\nLR' },
];

const initialForm = {
  lrNumber: 'LR-2026-4302',
  lrDate: '08/12/2026',
  consignorName: 'Consignor',
  consignorGst: '29AABCU9603R1ZJ',
  consignorContact: '9737100838',
  consignorAddress: '28/Shaktinagar society, near shivanand flat Ghatlodia, Ahmedabad',
  consignorCity: 'Ahmedabad',
  consignorState: 'Gujarat',
  consignorPin: '380061',
  consigneeName: 'Consignee',
  consigneeGst: '29AABCU9603R1ZJ',
  consigneeContact: '09737100838',
  consigeAddress: 'jagatpur',
  consigneeCity: 'ahmedabad',
  consigneeState: 'gujarat',
  consigneePin: '380061',
  truckNumber: 'MH 12 AB 4567',
  vehicleType: 'Container',
  from: 'Ahmedabad',
  to: 'Mumbai',
  driverName: '',
  driverMobile: '9876543210',
  licenseNumber: '',
  ownerName: '',
  ownerMobile: '9876543210',
  panNumber: 'ABCDE1234F',
  ownerType: '',
  ownerAddress: '',
  ownerCity: '',
  ownerState: '',
  ownerPin: '',
  materialName: 'Cement (OPC)',
  materialWeight: '1000 kg',
  rate: '6.50',
  freightAmount: '6,500',
  charges: '500',
  advance: '2,000',
  totalAmount: '7,000',
  balance: '5,000',
};

export default function NewLrScreen() {
  const [mode, setMode] = useState<ScreenMode>('list');
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(initialForm);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startForm = () => {
    setMode('form');
    setStep(1);
  };

  const closeForm = () => {
    setMode('list');
    setStep(1);
  };

  return mode === 'list' ? (
    <LrListScreen onGenerate={startForm} />
  ) : (
    <LrFormScreen
      step={step}
      form={form}
      onChange={updateField}
      onBack={closeForm}
      onPrevious={() => setStep((current) => (current > 1 ? ((current - 1) as Step) : current))}
      onNext={() => setStep((current) => (current < 4 ? ((current + 1) as Step) : current))}
    />
  );
}

function LrListScreen({ onGenerate }: { onGenerate: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<'All' | LrStatus>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return lrRecords.filter((item) => {
      const matchesFilter = filter === 'All' || item.status === filter;
      const matchesSearch = !search || [item.id, item.from, item.to, item.material, item.truck].join(' ').toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [filter, query]);

  return (
    <View className="flex-1 bg-[#f8f8f5]">
      <SafeAreaView edges={['top']} className="flex-1">
        <AppKeyboardAwareScrollView
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 98 + insets.bottom }}>
          <View className="w-full max-w-[560px] self-center px-[18px] pt-2">
            <View className="flex-row items-center justify-between">
              <Pressable onPress={() => router.replace('/home')} accessibilityLabel="Go home" className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#fff0e5]">
                  <MaterialCommunityIcons name="truck-fast-outline" size={20} color={ORANGE} />
                </View>
                <Text className="font-manrope-extrabold text-[18px] text-[#142238]">
                  Fleet<Text className="font-manrope-extrabold text-[#f27022]">Connect</Text>
                </Text>
              </Pressable>
              <View className="flex-row items-center gap-2.5">
                <Pressable className="relative h-9 w-9 items-center justify-center rounded-full bg-white" style={styles.softShadow}>
                  <Ionicons name="notifications-outline" size={21} color={NAVY} />
                  <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ef4444]" />
                </Pressable>
                <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#dfaa79]">
                  <MaterialCommunityIcons name="account" size={23} color="#51331f" />
                </View>
              </View>
            </View>

            <View className="mt-7 flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-manrope-extrabold text-[23px] text-[#10243e]">My LRs</Text>
                <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">Manage and view all your generated Lorry Receipts</Text>
              </View>
              <Pressable onPress={onGenerate} className="h-10 flex-row items-center justify-center rounded-[12px] bg-[#ff7417] px-3.5" style={styles.orangeShadow}>
                <Ionicons name="add" size={21} color="white" />
                <Text className="font-manrope-extrabold ml-1.5 text-xs text-white">Generate LR</Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row items-center gap-2.5">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="min-w-0 flex-1" contentContainerStyle={styles.filterRow}>
                {(['All', 'Draft', 'Generated', 'Cancelled'] as const).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setFilter(item)}
                    className={`h-9 min-w-[74px] items-center justify-center rounded-[10px] border px-3 ${filter === item ? 'border-[#ffdac0] bg-[#fff0e5]' : 'border-[#ece9e4] bg-white'}`}>
                    <Text className={`font-manrope-bold text-[10px] ${filter === item ? 'text-[#f27022]' : 'text-[#10243e]'}`}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View className="h-9 w-9 items-center justify-center rounded-[10px] border border-[#e5e9ef] bg-white">
                <Ionicons name="search" size={19} color={NAVY} />
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-[10px] border border-[#e5e9ef] bg-white">
                <Ionicons name="filter" size={18} color={NAVY} />
              </View>
            </View>

            <View className="mt-2.5 h-[38px] flex-row items-center rounded-[11px] border border-[#ebe8e2] bg-white px-3">
              <Ionicons name="search-outline" size={16} color="#8a95a5" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search LR number, route, material..."
                placeholderTextColor="#8a95a5"
                autoCorrect={false}
                className="font-manrope-medium ml-2 flex-1 text-[10px] text-[#17253a]"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color="#9aa4b2" />
                </Pressable>
              ) : null}
            </View>

            <View className="mt-3 gap-2.5">
              {filtered.map((item) => (
                <LrCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        </AppKeyboardAwareScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

function LrCard({ item }: { item: (typeof lrRecords)[number] }) {
  const statusTone = item.status === 'Generated'
    ? { bg: '#d9f3ec', color: '#0b876f', iconBg: '#ddf8ee', icon: 'file-document-check-outline' as MaterialIconName }
    : item.status === 'Draft'
      ? { bg: '#fff0df', color: '#ff7417', iconBg: '#fff1df', icon: 'file-document-edit-outline' as MaterialIconName }
      : { bg: '#ffe4e7', color: '#ef3347', iconBg: '#ffe7ea', icon: 'file-document-alert-outline' as MaterialIconName };

  return (
    <Pressable className="rounded-[13px] border border-[#e3e7ed] bg-white p-3 active:opacity-90" style={styles.cardShadow}>
      <View className="flex-row items-start">
        <View className="h-[46px] w-[46px] items-center justify-center rounded-[12px]" style={{ backgroundColor: statusTone.iconBg }}>
          <MaterialCommunityIcons name={statusTone.icon} size={25} color={statusTone.color} />
        </View>
        <View className="ml-2.5 min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row items-center">
              <Text className="font-manrope-extrabold text-[13px] text-[#10243e]" numberOfLines={1}>{item.id}</Text>
              <View className="ml-1.5 rounded-full px-2 py-0.5" style={{ backgroundColor: statusTone.bg }}>
                <Text className="font-manrope-bold text-[8px]" style={{ color: statusTone.color }}>{item.status}</Text>
              </View>
            </View>
            <Text className="font-manrope-semibold text-[9px] text-[#637194]">{item.date}</Text>
            <Ionicons name="ellipsis-vertical" size={17} color="#496181" />
          </View>
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="location-outline" size={17} color={ORANGE} />
            <Text className="font-manrope-bold ml-1 text-[11px] text-[#10243e]">{item.from}</Text>
            <Ionicons name="arrow-forward" size={13} color="#617091" style={{ marginHorizontal: 5 }} />
            <Text className="font-manrope-bold text-[11px] text-[#10243e]">{item.to}</Text>
          </View>
        </View>
      </View>
      <View className="mt-3 flex-row items-center">
        <LrMeta icon="cube-outline" label={item.material} />
        <Divider />
        <LrMeta icon="truck-outline" label={item.truck} />
        <Divider />
        <LrMeta icon="weight-kilogram" label={item.weight} />
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

function LrFormScreen({
  step,
  form,
  onChange,
  onBack,
  onPrevious,
  onNext,
}: {
  step: Step;
  form: typeof initialForm;
  onChange: (field: keyof typeof initialForm, value: string) => void;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#f8f8f5]">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="w-full max-w-[560px] flex-1 self-center">
          <View className="px-[18px] pt-2">
            <View className="h-12 flex-row items-center">
              <Pressable onPress={onBack} accessibilityLabel="Back to LR list" className="h-10 w-10 items-center justify-center rounded-full">
                <Ionicons name="arrow-back" size={25} color={NAVY} />
              </Pressable>
              <Text className="font-manrope-extrabold ml-4 text-[19px] text-[#10243e]">Generate Digital LR</Text>
            </View>
            <Stepper currentStep={step} />
          </View>

          <AppKeyboardAwareScrollView
            bottomOffset={20}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 106 + insets.bottom, paddingHorizontal: 18 }}>
            {step === 1 ? <PartiesStep form={form} onChange={onChange} /> : null}
            {step === 2 ? <FleetStep form={form} onChange={onChange} /> : null}
            {step === 3 ? <MaterialStep form={form} onChange={onChange} /> : null}
            {step === 4 ? <GenerateStep form={form} /> : null}
          </AppKeyboardAwareScrollView>
        </View>
      </SafeAreaView>
      <FormFooter
        step={step}
        insetsBottom={insets.bottom}
        onPrevious={onPrevious}
        onNext={onNext}
        onSave={onBack}
      />
    </View>
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

function PartiesStep({ form, onChange }: StepProps) {
  return (
    <View className="gap-3">
      <Section icon="calendar-outline" title="LR number and date">
        <View className="flex-row gap-3">
          <Field label="LR generate number" value={form.lrNumber} onChangeText={(value) => onChange('lrNumber', value)} />
          <Field label="LR date" value={form.lrDate} onChangeText={(value) => onChange('lrDate', value)} rightIcon="calendar-outline" />
        </View>
      </Section>

      <PartySection
        title="Consignor details"
        name={form.consignorName}
        gst={form.consignorGst}
        contact={form.consignorContact}
        address={form.consignorAddress}
        city={form.consignorCity}
        state={form.consignorState}
        pin={form.consignorPin}
        onChange={onChange}
        fields={{
          name: 'consignorName',
          gst: 'consignorGst',
          contact: 'consignorContact',
          address: 'consignorAddress',
          city: 'consignorCity',
          state: 'consignorState',
          pin: 'consignorPin',
        }}
      />

      <PartySection
        title="Consignee details"
        name={form.consigneeName}
        gst={form.consigneeGst}
        contact={form.consigneeContact}
        address={form.consigeAddress}
        city={form.consigneeCity}
        state={form.consigneeState}
        pin={form.consigneePin}
        onChange={onChange}
        fields={{
          name: 'consigneeName',
          gst: 'consigneeGst',
          contact: 'consigneeContact',
          address: 'consigeAddress',
          city: 'consigneeCity',
          state: 'consigneeState',
          pin: 'consigneePin',
        }}
      />
    </View>
  );
}

type StepProps = {
  form: typeof initialForm;
  onChange: (field: keyof typeof initialForm, value: string) => void;
};

function PartySection({
  title,
  name,
  gst,
  contact,
  address,
  city,
  state,
  pin,
  onChange,
  fields,
}: {
  title: string;
  name: string;
  gst: string;
  contact: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  onChange: StepProps['onChange'];
  fields: Record<'name' | 'gst' | 'contact' | 'address' | 'city' | 'state' | 'pin', keyof typeof initialForm>;
}) {
  return (
    <Section icon="office-building-outline" title={title}>
      <Field label="Name" value={name} onChangeText={(value) => onChange(fields.name, value)} />
      <View className="mt-3 flex-row gap-3">
        <Field label="GST number" value={gst} onChangeText={(value) => onChange(fields.gst, value)} />
        <Field label="Contact number" value={contact} onChangeText={(value) => onChange(fields.contact, value)} keyboardType="phone-pad" />
      </View>
      <Field label="Address" value={address} onChangeText={(value) => onChange(fields.address, value)} multiline />
      <View className="mt-3 flex-row gap-3">
        <Field label="City" value={city} onChangeText={(value) => onChange(fields.city, value)} />
        <Field label="State" value={state} onChangeText={(value) => onChange(fields.state, value)} rightIcon="chevron-down" />
        <Field label="Pin code" value={pin} onChangeText={(value) => onChange(fields.pin, value)} keyboardType="number-pad" />
      </View>
    </Section>
  );
}

function FleetStep({ form, onChange }: StepProps) {
  return (
    <View className="gap-3">
      <Section icon="truck-outline" title="Fleet details">
        <View className="flex-row gap-3">
          <Field label="Truck number" value={form.truckNumber} onChangeText={(value) => onChange('truckNumber', value)} />
          <Field label="Vehicle type" value={form.vehicleType} onChangeText={(value) => onChange('vehicleType', value)} rightIcon="chevron-down" />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="From" value={form.from} onChangeText={(value) => onChange('from', value)} />
          <Field label="To" value={form.to} onChangeText={(value) => onChange('to', value)} />
        </View>
      </Section>

      <Section icon="account-outline" title="Truck driver details (optional)">
        <View className="flex-row gap-3">
          <Field label="Driver name" value={form.driverName} onChangeText={(value) => onChange('driverName', value)} placeholder="Enter driver name" />
          <Field label="Mobile number" value={form.driverMobile} onChangeText={(value) => onChange('driverMobile', value)} keyboardType="phone-pad" />
          <Field label="License number" value={form.licenseNumber} onChangeText={(value) => onChange('licenseNumber', value)} placeholder="Enter license no." />
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
          <Field label="Vehicle owner / supplier name" value={form.ownerName} onChangeText={(value) => onChange('ownerName', value)} placeholder="Enter name" />
          <Field label="Vehicle owner mobile" value={form.ownerMobile} onChangeText={(value) => onChange('ownerMobile', value)} keyboardType="phone-pad" />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="PAN number" value={form.panNumber} onChangeText={(value) => onChange('panNumber', value)} />
          <Field label="Type" value={form.ownerType} onChangeText={(value) => onChange('ownerType', value)} placeholder="Select type" rightIcon="chevron-down" />
        </View>
        <Field label="Address" value={form.ownerAddress} onChangeText={(value) => onChange('ownerAddress', value)} placeholder="Enter complete address" multiline />
        <View className="mt-3 flex-row gap-3">
          <Field label="City" value={form.ownerCity} onChangeText={(value) => onChange('ownerCity', value)} placeholder="Enter city" />
          <Field label="State" value={form.ownerState} onChangeText={(value) => onChange('ownerState', value)} placeholder="Select state" rightIcon="chevron-down" />
          <Field label="Pin code" value={form.ownerPin} onChangeText={(value) => onChange('ownerPin', value)} placeholder="Enter pin code" keyboardType="number-pad" />
        </View>
      </Section>
    </View>
  );
}

function MaterialStep({ form, onChange }: StepProps) {
  return (
    <View className="gap-3">
      <Section icon="cube-outline" title="Material details">
        <Field label="Material name" value={form.materialName} onChangeText={(value) => onChange('materialName', value)} />
        <Field label="Material weight" value={form.materialWeight} onChangeText={(value) => onChange('materialWeight', value)} />
        <View className="mt-3 flex-row gap-3">
          <Field label="Rate (per kg)" value={form.rate} onChangeText={(value) => onChange('rate', value)} prefix="Rs" keyboardType="decimal-pad" />
          <Field label="Freight amount" value={form.freightAmount} onChangeText={(value) => onChange('freightAmount', value)} prefix="Rs" keyboardType="number-pad" />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="Charges" value={form.charges} onChangeText={(value) => onChange('charges', value)} prefix="Rs" keyboardType="number-pad" />
          <Field label="Total amount" value={form.totalAmount} onChangeText={(value) => onChange('totalAmount', value)} prefix="Rs" keyboardType="number-pad" />
        </View>
        <View className="mt-3 flex-row gap-3">
          <Field label="Advance" value={form.advance} onChangeText={(value) => onChange('advance', value)} prefix="Rs" keyboardType="number-pad" />
          <Field label="Balance (Rs)" value={form.balance} onChangeText={(value) => onChange('balance', value)} prefix="Rs" keyboardType="number-pad" />
        </View>
      </Section>

      <Section icon="currency-inr" title="Amount summary">
        <SummaryRow label="Freight amount" value={`Rs ${form.freightAmount}`} />
        <SummaryRow label="Charges" value={`Rs ${form.charges}`} />
        <SummaryRow label="Advance" value={`Rs ${form.advance}`} />
        <View className="my-3 h-px bg-[#e6e2dc]" />
        <SummaryRow label="Total amount" value={`Rs ${form.totalAmount}`} strong />
        <SummaryRow label="Balance" value={`Rs ${form.balance}`} strong />
      </Section>
    </View>
  );
}

function GenerateStep({ form }: { form: typeof initialForm }) {
  const [copy, setCopy] = useState('Consignor copy');
  const copies = ['Consignor copy', 'Consignee copy', 'Driver copy', 'Office copy'];

  return (
    <View className="gap-3">
      <CollapsiblePanel title="Select carbon copy sheet">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.copyRow}>
          {copies.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCopy(item)}
              className={`h-9 items-center justify-center rounded-[9px] border px-3.5 ${copy === item ? 'border-[#ff8a22] bg-[#fff7ef]' : 'border-[#dce1e8] bg-white'}`}>
              <Text className={`font-manrope-bold text-[10px] ${copy === item ? 'text-[#f27022]' : 'text-[#10243e]'}`}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </CollapsiblePanel>

      <CollapsiblePanel title="Goods carriage receipt">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-manrope-extrabold text-[20px] text-[#10243e]">FLEETCONNEKT LR</Text>
            <Text className="font-manrope-medium text-[10px] text-[#65728a]">Digital lorry receipt for road freight movement</Text>
          </View>
          <View className="items-end">
            <View className="mb-2 rounded-[8px] border border-[#ffc07f] px-3 py-2">
              <Text className="font-manrope-extrabold text-[10px] uppercase text-[#f27022]">{copy}</Text>
            </View>
            <Text className="font-manrope-bold text-[11px] text-[#10243e]">LR number: {form.lrNumber}</Text>
            <Text className="font-manrope-bold text-[11px] text-[#10243e]">Date: 2026-08-12</Text>
          </View>
        </View>

        <View className="my-4 h-px bg-[#6e7890]" />

        <View className="flex-row">
          <ReceiptParty title="Consignor" name={form.consignorName} address={`${form.consignorAddress}, ${form.consignorCity}, ${form.consignorState} ${form.consignorPin}`} gst={form.consignorGst} contact={form.consignorContact} />
          <View className="mx-3 w-px bg-[#e0ddd8]" />
          <ReceiptParty title="Consignee" name={form.consigneeName} address={`${form.consigeAddress}, ${form.consigneeCity}, ${form.consigneeState} ${form.consigneePin}`} gst={form.consigneeGst} contact={form.consigneeContact} />
        </View>

        <View className="my-4 h-px bg-[#ece8e2]" />

        <View className="flex-row flex-wrap gap-2">
          <ReceiptTile icon="map-marker-outline" label="From" value={form.from} />
          <ReceiptTile icon="map-marker-outline" label="To" value={form.to} />
          <ReceiptTile icon="truck-outline" label="Truck" value={form.truckNumber} />
          <ReceiptTile icon="truck-cargo-container" label="Vehicle type" value={form.vehicleType} />
          <ReceiptTile icon="cube-outline" label="Material" value={form.materialName || '-'} />
          <ReceiptTile icon="weight-kilogram" label="Weight" value={form.materialWeight || '-'} />
          <ReceiptTile icon="currency-inr" label="Rate" value={form.rate ? `Rs ${form.rate}` : '-'} />
          <ReceiptTile icon="account-outline" label="Driver" value={form.driverName || '-'} />
          <ReceiptTile icon="phone-outline" label="License" value={form.licenseNumber || '-'} wide />
          <ReceiptTile icon="office-building-outline" label="Vehicle owner / supplier" value={`${form.ownerName || '-'}\nPAN: ${form.panNumber || '-'}`} wide />
          <View className="min-w-[160px] flex-1 rounded-[10px] border-l border-[#e0ddd8] p-3">
            <Text className="font-manrope-extrabold text-[10px] uppercase text-[#728095]">Freight ledger</Text>
            <SummaryRow label="Freight amount" value={`Rs ${form.freightAmount}`} compact />
            <SummaryRow label="Charges" value={`Rs ${form.charges}`} compact />
            <SummaryRow label="Advance" value={`Rs ${form.advance}`} compact />
            <View className="my-2 h-px bg-[#cfd5dd]" />
            <SummaryRow label="Total amount" value={`Rs ${form.totalAmount}`} strong compact />
            <SummaryRow label="Balance" value={`Rs ${form.balance}`} strong compact />
          </View>
        </View>

        <View className="my-4 h-px bg-[#e0ddd8]" />

        <View className="flex-row justify-between gap-3">
          <Signature label="Driver signature" />
          <Signature label="Consignor stamp" />
          <Signature label="Office signatory" />
        </View>
      </CollapsiblePanel>
    </View>
  );
}

function Section({ icon, title, children }: { icon: MaterialIconName; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <View className="rounded-[12px] border border-[#e0ddd8] bg-white p-3" style={styles.cardShadow}>
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
    <View className="rounded-[12px] border border-[#e4e2dd] bg-white p-3" style={styles.cardShadow}>
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  rightIcon,
  prefix,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rightIcon?: IonIconName;
  prefix?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
}) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="font-manrope-bold mb-1 text-[10px] text-[#10243e]">{label}</Text>
      <View className={`flex-row items-center rounded-[9px] border border-[#d8d5cf] bg-white px-3 ${multiline ? 'min-h-[56px] items-start py-2' : 'h-[42px]'}`}>
        {prefix ? <Text className="font-manrope-extrabold mr-2.5 text-[12px] text-[#10243e]">{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8490a1"
          multiline={multiline}
          keyboardType={keyboardType}
          className={`font-manrope-medium min-w-0 flex-1 text-[12px] text-[#10243e] ${multiline ? 'min-h-[38px] py-0 textAlignVertical-top' : 'py-0'}`}
        />
        {rightIcon ? <Ionicons name={rightIcon} size={19} color="#10243e" /> : null}
      </View>
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

function FormFooter({
  step,
  insetsBottom,
  onPrevious,
  onNext,
  onSave,
}: {
  step: Step;
  insetsBottom: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
}) {
  if (step === 4) {
    return (
      <View className="absolute bottom-0 left-0 right-0 border-t border-[#e5e2dc] bg-white px-[18px] pt-3" style={{ paddingBottom: Math.max(insetsBottom, 12) }}>
        <View className="w-full max-w-[560px] flex-row gap-3 self-center">
          <Pressable onPress={onSave} className="h-14 flex-1 flex-row items-center justify-center rounded-[13px] border border-[#d8dce3] bg-white">
            <MaterialCommunityIcons name="file-document-outline" size={22} color={NAVY} />
            <Text className="font-manrope-extrabold ml-2 text-[14px] text-[#10243e]">Save LR</Text>
          </Pressable>
          <Pressable onPress={onSave} className="h-14 flex-1 flex-row items-center justify-center rounded-[13px] bg-[#061934]">
            <MaterialCommunityIcons name="printer-outline" size={22} color="white" />
            <Text className="font-manrope-extrabold ml-2 text-[14px] text-white">Save & print LR</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 border-t border-[#e5e2dc] bg-white px-[18px] pt-3" style={{ paddingBottom: Math.max(insetsBottom, 12) }}>
      <View className="w-full max-w-[560px] flex-row gap-3 self-center">
        <Pressable
          disabled={step === 1}
          onPress={onPrevious}
          className={`h-14 flex-1 flex-row items-center justify-center rounded-[13px] border border-[#d8dce3] ${step === 1 ? 'bg-white opacity-45' : 'bg-white'}`}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
          <Text className="font-manrope-extrabold ml-3 text-[14px] text-[#10243e]">Previous</Text>
        </Pressable>
        <Pressable onPress={onNext} className="h-14 flex-1 flex-row items-center justify-center rounded-[13px] bg-[#ff7a0f]" style={styles.orangeShadow}>
          <Text className="font-manrope-extrabold mr-3 text-[14px] text-white">Next step</Text>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

function ReceiptParty({ title, name, address, gst, contact }: { title: string; name: string; address: string; gst: string; contact: string }) {
  return (
    <View className="min-w-0 flex-1">
      <View className="flex-row items-center">
        <MaterialCommunityIcons name="office-building-outline" size={22} color={ORANGE} />
        <Text className="font-manrope-extrabold ml-2 text-[11px] uppercase text-[#728095]">{title}</Text>
      </View>
      <Text className="font-manrope-extrabold mt-3 text-[12px] text-[#10243e]">{name}</Text>
      <Text className="font-manrope-medium mt-1 text-[11px] leading-[17px] text-[#26364b]">{address}</Text>
      <Text className="font-manrope-medium mt-1 text-[11px] text-[#26364b]">GST: {gst}</Text>
      <Text className="font-manrope-medium mt-1 text-[11px] text-[#26364b]">Contact: {contact}</Text>
    </View>
  );
}

function ReceiptTile({ icon, label, value, wide }: { icon: MaterialIconName; label: string; value: string; wide?: boolean }) {
  return (
    <View className={`rounded-[10px] bg-[#faf9f6] p-3 ${wide ? 'min-w-[170px] flex-1' : 'w-[31%]'}`}>
      <View className="mb-2 flex-row items-center">
        <MaterialCommunityIcons name={icon} size={15} color={ORANGE} />
        <Text className="font-manrope-extrabold ml-1.5 text-[9px] uppercase text-[#728095]">{label}</Text>
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

const styles = StyleSheet.create({
  softShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  orangeShadow: {
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  filterRow: {
    gap: 8,
    paddingRight: 2,
  },
  copyRow: {
    gap: 10,
    paddingTop: 12,
  },
});
