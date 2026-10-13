import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { Banner, ChipButton, Field, LoadingState, ORANGE, PrimaryButton, SecondaryButton, Section, styles } from '@/components/ui';
import { useCompany } from '@/context/auth';
import { formatDateTime, PREFIX_PATTERN } from '@/lib/format';
import { bookingNumberSeriesApi, errorMessage, fieldErrorsFrom, type BookingNumberSeries } from '@/services/api';

const DEFAULT_DIGITS = 6;

function formatBookingNumber(prefix: string, nextNumber: string, digits: number) {
  const number = nextNumber.replace(/\D/g, '');
  return `${prefix || '__'}-${(number || '1').padStart(digits, '0')}`;
}

export default function BookingPrefixScreen() {
  const { token, companyId, canConfigure } = useCompany();
  const [series, setSeries] = useState<BookingNumberSeries | null>(null);
  const [prefix, setPrefix] = useState('');
  const [nextNumber, setNextNumber] = useState('1');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ prefix?: string; next_number?: string }>({});

  useEffect(() => {
    if (!token || !companyId) return;
    bookingNumberSeriesApi
      .get(token, companyId)
      .then((result) => {
        setSeries(result);
        setEditing(!result.configured && canConfigure);
        setPrefix(result.prefix ?? '');
        setNextNumber(String(result.next_number ?? 1));
      })
      .catch((issue) => setError(errorMessage(issue, 'Could not load booking prefix settings.')))
      .finally(() => setLoading(false));
  }, [canConfigure, companyId, token]);

  const digits = series?.digits ?? DEFAULT_DIGITS;

  function validate() {
    const errors: { prefix?: string; next_number?: string } = {};
    if (!prefix) errors.prefix = 'Prefix is required.';
    else if (!PREFIX_PATTERN.test(prefix)) errors.prefix = 'Use exactly 2 letters or numbers, like BK.';
    const number = Number(nextNumber);
    if (!nextNumber) errors.next_number = 'Starting number is required.';
    else if (!Number.isInteger(number) || number < 1) errors.next_number = 'Enter a whole number of 1 or more.';
    else if (number > 999999999) errors.next_number = 'Enter a number up to 999999999.';
    return errors;
  }

  async function save() {
    if (!token || !companyId) return;
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await bookingNumberSeriesApi.update(token, companyId, { prefix, next_number: Number(nextNumber) });
      setSeries(result);
      setPrefix(result.prefix ?? '');
      setNextNumber(String(result.next_number ?? 1));
      setEditing(false);
      setMessage('Booking prefix saved. New bookings will use it.');
    } catch (issue) {
      const serverErrors = fieldErrorsFrom(issue);
      setFieldErrors({ prefix: serverErrors.prefix, next_number: serverErrors.next_number });
      setError(serverErrors.prefix || serverErrors.next_number ? null : errorMessage(issue, 'Could not save booking prefix. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setPrefix(series?.prefix ?? '');
    setNextNumber(String(series?.next_number ?? 1));
    setFieldErrors({});
    setError(null);
    setEditing(false);
  }

  return (
    <SubScreen title="Booking prefix">
      <Text className="font-manrope-medium mb-4 text-[11px] leading-[16px] text-[#617091]">
        Choose a 2-character prefix once. Every new booking gets the next number automatically.
      </Text>
      {loading ? (
        <LoadingState label="Loading settings..." />
      ) : (
        <View className="gap-3">
          <Banner tone="error" message={error} />
          <Banner tone="success" message={message} />

          <View className="items-center rounded-[18px] border border-[#ebe8e1] bg-white px-4 py-5" style={styles.cardShadow}>
            <Text className="font-manrope-bold text-[9px] uppercase tracking-[1.2px] text-[#8290a1]">
              {editing ? 'Preview' : series?.configured ? 'Next booking number' : 'Not set up yet'}
            </Text>
            <Text className="font-manrope-extrabold mt-2 text-[26px] tracking-[1px] text-[#10243e]">
              {editing ? formatBookingNumber(prefix, nextNumber, digits) : series?.next_booking_number ?? '—'}
            </Text>
            {series?.updated_at && !editing ? (
              <Text className="font-manrope-medium mt-1 text-[10px] text-[#8290a1]">Last updated {formatDateTime(series.updated_at)}</Text>
            ) : null}
          </View>

          {editing ? (
            <Section icon="pound" title="Prefix settings">
              <View className="flex-row gap-3">
                <Field
                  label="Prefix"
                  required
                  value={prefix}
                  onChangeText={(value) => {
                    setPrefix(value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 2));
                    setFieldErrors((current) => ({ ...current, prefix: undefined }));
                  }}
                  placeholder="BK"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={2}
                  error={fieldErrors.prefix}
                  helper="2 letters or numbers"
                />
                <Field
                  label="Next number"
                  required
                  value={nextNumber}
                  onChangeText={(value) => {
                    setNextNumber(value.replace(/\D/g, '').slice(0, 9));
                    setFieldErrors((current) => ({ ...current, next_number: undefined }));
                  }}
                  keyboardType="number-pad"
                  placeholder="1"
                  error={fieldErrors.next_number}
                  helper="Used for the next booking"
                />
              </View>
              <View className="mt-4 flex-row gap-3">
                {series?.configured ? <SecondaryButton label="Cancel" onPress={cancel} /> : null}
                <PrimaryButton label="Save prefix" icon="checkmark" loading={saving} onPress={save} />
              </View>
            </Section>
          ) : series?.configured ? (
            <Section icon="pound" title="Current settings">
              <View className="flex-row gap-3">
                <SummaryTile label="Prefix" value={series.prefix ?? '-'} />
                <SummaryTile label="Next number" value={String(series.next_number ?? '-')} />
              </View>
              {canConfigure ? (
                <View className="mt-3 items-start">
                  <ChipButton label="Change prefix" icon="create-outline" tone="orange" onPress={() => setEditing(true)} />
                </View>
              ) : null}
            </Section>
          ) : null}

          {!canConfigure ? (
            <View className="flex-row items-center rounded-[12px] border border-[#e0ddd8] bg-white p-3">
              <MaterialCommunityIcons name="shield-lock-outline" size={20} color={ORANGE} />
              <Text className="font-manrope-medium ml-2.5 min-w-0 flex-1 text-[11px] leading-[16px] text-[#26364b]">
                Only the company owner or an admin can change the booking prefix.
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </SubScreen>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[10px] bg-[#faf9f6] p-3">
      <Text className="font-manrope-bold text-[9px] uppercase tracking-[0.6px] text-[#728095]">{label}</Text>
      <Text className="font-manrope-extrabold mt-1 text-[16px] text-[#10243e]">{value}</Text>
    </View>
  );
}
