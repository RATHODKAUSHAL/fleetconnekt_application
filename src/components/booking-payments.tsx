import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  Banner,
  BottomSheet,
  ChipButton,
  DateField,
  Field,
  LoadingState,
  ORANGE,
  Pill,
  PrimaryButton,
  Section,
  SecondaryButton,
  SelectField,
  styles,
} from '@/components/ui';
import { useCompany } from '@/context/auth';
import {
  formatDate,
  formatMoney,
  MONEY_PATTERN,
  paymentMethodLabels,
  paymentStatusLabels,
  paymentStatusTone,
  paymentTypeLabels,
  todayIso,
} from '@/lib/format';
import {
  bookingApi,
  errorMessage,
  fieldErrorsFrom,
  type BookingPayment,
  type BookingPaymentSummary,
  type PaymentMethod,
  type PaymentType,
} from '@/services/api';

const referenceRequiredMethods: PaymentMethod[] = ['bank_transfer', 'cheque'];

const typeOptions = (Object.keys(paymentTypeLabels) as PaymentType[]).map((value) => ({ value, label: paymentTypeLabels[value] }));
const methodOptions = (Object.keys(paymentMethodLabels) as PaymentMethod[]).map((value) => ({ value, label: paymentMethodLabels[value] }));

export function BookingPayments({
  bookingUid,
  onSummaryChange,
}: {
  bookingUid: string;
  onSummaryChange?: (summary: BookingPaymentSummary) => void;
}) {
  const { token, companyId, role, canManage, canConfigure } = useCompany();
  const [summary, setSummary] = useState<BookingPaymentSummary | null>(null);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<BookingPayment | null>(null);

  // The API enforces roles; these only hide actions the user cannot perform.
  const canRecord = canManage;
  const canVoid = canConfigure || !role;

  const load = useCallback(async () => {
    if (!token || !companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.payments(token, companyId, bookingUid);
      setSummary(data.summary);
      setPayments(data.payments);
      onSummaryChange?.(data.summary);
    } catch (issue) {
      setError(errorMessage(issue, 'Could not load payments.'));
    } finally {
      setLoading(false);
    }
  }, [bookingUid, companyId, onSummaryChange, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function applyMutation(payment: BookingPayment, nextSummary: BookingPaymentSummary, message: string) {
    setSummary(nextSummary);
    onSummaryChange?.(nextSummary);
    setPayments((current) => {
      const exists = current.some((item) => item.uid === payment.uid);
      const next = exists ? current.map((item) => (item.uid === payment.uid ? payment : item)) : [payment, ...current];
      return next.sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? ''));
    });
    setNotice(message);
  }

  const balance = summary?.balance_due == null ? null : Number(summary.balance_due);

  return (
    <View className="gap-3">
      <Section
        icon="credit-card-outline"
        title="Payments"
        action={summary ? <Pill label={paymentStatusLabels[summary.payment_status]} bg={paymentStatusTone[summary.payment_status].bg} color={paymentStatusTone[summary.payment_status].color} /> : undefined}>
        <Text className="font-manrope-medium text-[10px] leading-[15px] text-[#617091]">
          Payments received from the customer for this booking. TDS counts towards settlement.
        </Text>
        <View className="mt-3 gap-2.5">
          <Banner tone="success" message={notice} />
          {loading && !summary ? (
            <LoadingState label="Loading payments..." />
          ) : error && !summary ? (
            <>
              <Banner tone="error" message={error} />
              <ChipButton label="Try again" icon="refresh" onPress={load} />
            </>
          ) : summary ? (
            <View className="flex-row flex-wrap justify-between gap-y-2">
              <Stat label="Customer freight" value={summary.customer_freight === null ? 'Not set' : formatMoney(summary.customer_freight, 2)} />
              <Stat label="Received" value={formatMoney(summary.amount_paid, 2)} />
              <Stat label="TDS deducted" value={formatMoney(summary.tds_deducted, 2)} />
              <Stat
                label={balance !== null && balance < 0 ? 'Customer credit' : 'Balance due'}
                value={balance === null ? '-' : formatMoney(Math.abs(balance), 2)}
                accent={balance !== null && balance > 0 ? ORANGE : '#0b876f'}
              />
            </View>
          ) : null}
        </View>
        <View className="mt-3 flex-row gap-2">
          <ChipButton label="Refresh" icon="refresh" onPress={load} loading={loading && Boolean(summary)} />
          {canRecord && summary ? <ChipButton label="Record payment" icon="add" tone="orange" onPress={() => setRecordOpen(true)} /> : null}
        </View>
      </Section>

      {summary ? (
        <Section icon="history" title="Payment history">
          <Text className="font-manrope-medium -mt-1 mb-2 text-[10px] text-[#617091]">
            {payments.length} {payments.length === 1 ? 'entry' : 'entries'} · Voided payments stay here for the audit trail.
          </Text>
          {error ? <Banner tone="error" message={error} /> : null}
          {payments.length === 0 ? (
            <View className="items-center py-6">
              <MaterialCommunityIcons name="credit-card-off-outline" size={28} color="#8290a1" />
              <Text className="font-manrope-extrabold mt-2 text-[13px] text-[#10243e]">No payments yet</Text>
              <Text className="font-manrope-medium mt-1 text-[10px] text-[#617091]">Record the first payment once the customer pays.</Text>
            </View>
          ) : (
            <View className="gap-2">
              {payments.map((payment) => (
                <View key={payment.uid} className={`rounded-[11px] border border-[#ebe8e1] p-3 ${payment.is_voided ? 'bg-[#faf9f6]' : 'bg-white'}`}>
                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className={`font-manrope-extrabold text-[16px] ${payment.is_voided ? 'text-[#a7afb9] line-through' : 'text-[#10243e]'}`}>
                        {formatMoney(payment.amount, 2)}
                      </Text>
                      <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">{formatDate(payment.paid_at)}</Text>
                    </View>
                    {payment.is_voided ? <Pill label="Voided" bg="#ffe4e7" color="#ef3347" /> : <Pill label="Recorded" bg="#d9f3ec" color="#0b876f" />}
                  </View>
                  <View className="mt-2.5 flex-row flex-wrap gap-y-1.5">
                    <MiniItem label="Type" value={paymentTypeLabels[payment.payment_type] ?? payment.payment_type} />
                    <MiniItem label="Method" value={paymentMethodLabels[payment.method] ?? payment.method} />
                    <MiniItem label="Reference" value={payment.reference_number || '-'} />
                    <MiniItem label="TDS" value={formatMoney(payment.tds_amount, 2)} />
                  </View>
                  {payment.notes ? <Text className="font-manrope-medium mt-2 text-[10px] text-[#26364b]">{payment.notes}</Text> : null}
                  {payment.is_voided && payment.void_reason ? (
                    <Text className="font-manrope-semibold mt-2 text-[10px] text-[#b4232f]">Void reason: {payment.void_reason}</Text>
                  ) : null}
                  {canVoid && !payment.is_voided ? (
                    <View className="mt-2.5 items-end">
                      <ChipButton label="Void payment" icon="ban-outline" tone="danger" onPress={() => setVoidTarget(payment)} />
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Section>
      ) : null}

      <RecordPaymentSheet
        visible={recordOpen}
        bookingUid={bookingUid}
        balanceDue={summary?.balance_due ?? null}
        onClose={() => setRecordOpen(false)}
        onRecorded={(payment, nextSummary) => {
          setRecordOpen(false);
          applyMutation(payment, nextSummary, 'Payment recorded.');
        }}
      />
      <VoidPaymentSheet
        payment={voidTarget}
        bookingUid={bookingUid}
        onClose={() => setVoidTarget(null)}
        onVoided={(payment, nextSummary) => {
          setVoidTarget(null);
          applyMutation(payment, nextSummary, 'Payment voided.');
        }}
      />
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View className="w-[48.5%] rounded-[11px] bg-[#faf9f6] p-3">
      <Text className="font-manrope-bold text-[9px] uppercase tracking-[0.6px] text-[#728095]">{label}</Text>
      <Text numberOfLines={1} className="font-manrope-extrabold mt-1 text-[15px] text-[#10243e]">{value}</Text>
      {accent ? <View className="mt-1.5 h-[3px] w-7 rounded-full" style={{ backgroundColor: accent }} /> : null}
    </View>
  );
}

function MiniItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 pr-2">
      <Text className="font-manrope-medium text-[9px] text-[#8290a1]">{label}</Text>
      <Text numberOfLines={1} className="font-manrope-bold text-[11px] text-[#26364b]">{value}</Text>
    </View>
  );
}

type PaymentForm = {
  amount: string;
  tds_amount: string;
  payment_type: PaymentType;
  method: PaymentMethod;
  reference_number: string;
  paid_at: string;
  notes: string;
};

function emptyPaymentForm(): PaymentForm {
  return { amount: '', tds_amount: '', payment_type: 'advance', method: 'upi', reference_number: '', paid_at: todayIso(), notes: '' };
}

function RecordPaymentSheet({
  visible,
  bookingUid,
  balanceDue,
  onClose,
  onRecorded,
}: {
  visible: boolean;
  bookingUid: string;
  balanceDue: string | null;
  onClose: () => void;
  onRecorded: (payment: BookingPayment, summary: BookingPaymentSummary) => void;
}) {
  const { token, companyId } = useCompany();
  const [form, setForm] = useState<PaymentForm>(emptyPaymentForm);
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentForm, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const referenceRequired = referenceRequiredMethods.includes(form.method);
  const outstanding = balanceDue === null ? null : Number(balanceDue);

  useEffect(() => {
    if (visible) {
      setForm(emptyPaymentForm());
      setErrors({});
      setError(null);
    }
  }, [visible]);

  const update = <Key extends keyof PaymentForm>(key: Key, value: PaymentForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function validate() {
    const next: Partial<Record<keyof PaymentForm, string>> = {};
    const amount = Number(form.amount || 0);
    const tds = Number(form.tds_amount || 0);
    if (form.amount.trim() === '') next.amount = 'Amount is required. Enter 0 if only TDS was deducted.';
    else if (!MONEY_PATTERN.test(form.amount.trim())) next.amount = 'Enter a valid amount with up to 2 decimals.';
    if (form.tds_amount.trim() && !MONEY_PATTERN.test(form.tds_amount.trim())) next.tds_amount = 'Enter a valid TDS amount with up to 2 decimals.';
    if (!next.amount && !next.tds_amount && amount + tds <= 0) next.amount = 'Enter the amount received or the TDS deducted.';
    if (referenceRequired && !form.reference_number.trim()) next.reference_number = 'Reference number is required for bank transfer and cheque.';
    if (!form.paid_at) next.paid_at = 'Payment date is required.';
    else if (form.paid_at > todayIso()) next.paid_at = 'Payment date cannot be in the future.';
    if (form.notes.length > 1000) next.notes = 'Notes must be 1000 characters or fewer.';
    return next;
  }

  async function save() {
    if (!token || !companyId) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setSaving(true);
    setError(null);
    try {
      const result = await bookingApi.recordPayment(token, companyId, bookingUid, {
        amount: form.amount.trim(),
        tds_amount: form.tds_amount.trim() || null,
        payment_type: form.payment_type,
        method: form.method,
        reference_number: form.reference_number.trim() || null,
        paid_at: form.paid_at,
        notes: form.notes.trim() || null,
      });
      onRecorded(result.payment, result.summary);
    } catch (issue) {
      setErrors(fieldErrorsFrom(issue));
      setError(errorMessage(issue, 'Could not record payment. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} title="Record payment" onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-3">
          <Banner tone="error" message={error} />
          {outstanding !== null && outstanding > 0 ? (
            <View className="flex-row items-center justify-between rounded-[11px] border border-[#ffbc7f] bg-[#fffaf4] p-3">
              <Text className="font-manrope-semibold text-[11px] text-[#26364b]">Outstanding {formatMoney(outstanding, 2)}</Text>
              <ChipButton label="Use full amount" tone="orange" onPress={() => update('amount', outstanding.toFixed(2))} />
            </View>
          ) : null}
          <View className="rounded-[12px] border border-[#e0ddd8] bg-white p-3" style={styles.cardShadow}>
            <View className="flex-row gap-3">
              <Field label="Amount received" required prefix="Rs" value={form.amount} onChangeText={(value) => update('amount', value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" error={errors.amount} />
              <Field label="TDS deducted" prefix="Rs" value={form.tds_amount} onChangeText={(value) => update('tds_amount', value.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" error={errors.tds_amount} />
            </View>
            <View className="mt-3 flex-row gap-3">
              <SelectField label="Payment type" required value={form.payment_type} options={typeOptions} onChange={(value) => update('payment_type', value)} error={errors.payment_type} />
              <SelectField label="Payment method" required value={form.method} options={methodOptions} onChange={(value) => update('method', value)} error={errors.method} />
            </View>
            <View className="mt-3 flex-row gap-3">
              <Field label="Reference number" required={referenceRequired} value={form.reference_number} onChangeText={(value) => update('reference_number', value)} placeholder="UTR / cheque no." error={errors.reference_number} maxLength={100} />
              <DateField label="Paid on" required value={form.paid_at} onChange={(value) => update('paid_at', value)} maxDate={todayIso()} clearable={false} error={errors.paid_at} />
            </View>
            <View className="mt-3">
              <Field label="Notes" value={form.notes} onChangeText={(value) => update('notes', value)} placeholder="Optional notes" multiline maxLength={1000} error={errors.notes} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="flex-row gap-3 pt-2">
        <SecondaryButton label="Cancel" onPress={onClose} />
        <PrimaryButton label="Record payment" loading={saving} onPress={save} />
      </View>
    </BottomSheet>
  );
}

function VoidPaymentSheet({
  payment,
  bookingUid,
  onClose,
  onVoided,
}: {
  payment: BookingPayment | null;
  bookingUid: string;
  onClose: () => void;
  onVoided: (payment: BookingPayment, summary: BookingPaymentSummary) => void;
}) {
  const { token, companyId } = useCompany();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setReason('');
      setReasonError(undefined);
      setError(null);
    }
  }, [payment]);

  async function confirm() {
    if (!token || !companyId || !payment) return;
    if (!reason.trim()) {
      setReasonError('Enter why this payment is being voided.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await bookingApi.voidPayment(token, companyId, bookingUid, payment.uid, reason.trim());
      onVoided(result.payment, result.summary);
    } catch (issue) {
      setReasonError(fieldErrorsFrom(issue).reason);
      setError(errorMessage(issue, 'Could not void payment. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={Boolean(payment)} title="Void payment" onClose={onClose}>
      <View className="gap-3 pb-3">
        <Banner tone="warning" message={payment ? `Voiding ${formatMoney(payment.amount, 2)} paid on ${formatDate(payment.paid_at)}. It stays in the history for the audit trail.` : null} />
        <Banner tone="error" message={error} />
        <Field label="Reason" required value={reason} onChangeText={(value) => { setReason(value); setReasonError(undefined); }} placeholder="e.g. Cheque bounced" maxLength={255} error={reasonError} />
      </View>
      <View className="flex-row gap-3">
        <SecondaryButton label="Cancel" onPress={onClose} />
        <PrimaryButton label="Void payment" tone="danger" loading={saving} onPress={confirm} />
      </View>
    </BottomSheet>
  );
}
