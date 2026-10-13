import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-shell';
import { Banner, LoadingState, ORANGE, Pill, Section, styles } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { errorMessage, vehicleDetailsApi, type VehicleDetailsResponse } from '@/services/api';

const VEHICLE_PATTERN = /^[A-Z0-9]{4,20}$/;

export default function VerifyVehicleScreen() {
  const { token } = useAuth();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [response, setResponse] = useState<VehicleDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    if (!token || loading) return;
    const normalized = vehicleNumber.replace(/\s+/g, '').toUpperCase();
    if (!normalized) {
      setInputError('Enter a vehicle number to verify.');
      return;
    }
    if (!VEHICLE_PATTERN.test(normalized)) {
      setInputError('Use letters and numbers only, like GJ06BV8768.');
      return;
    }

    setVehicleNumber(normalized);
    setInputError(null);
    setError(null);
    setResponse(null);
    setLoading(true);
    try {
      setResponse(await vehicleDetailsApi.show(token, normalized));
    } catch (issue) {
      setError(errorMessage(issue, 'Could not fetch vehicle details. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <View className="w-full max-w-[560px] self-center px-[18px] pt-3">
        <Text className="font-manrope-extrabold text-[23px] text-[#10243e]">Verify vehicle</Text>
        <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">Enter a vehicle number to fetch its VAHAN / RC details.</Text>

        <View className="mt-4 rounded-[14px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
          <Text className="font-manrope-bold mb-1.5 text-[10px] text-[#10243e]">Vehicle number</Text>
          <View className="flex-row gap-2">
            <View className={`h-[48px] min-w-0 flex-1 flex-row items-center rounded-[11px] border px-3 ${inputError ? 'border-[#ef3347]' : 'border-[#d8d5cf]'}`}>
              <MaterialCommunityIcons name="card-text-outline" size={19} color="#8290a1" />
              <TextInput
                value={vehicleNumber}
                onChangeText={(value) => {
                  setVehicleNumber(value.toUpperCase());
                  setInputError(null);
                }}
                placeholder="GJ06BV8768"
                placeholderTextColor="#8490a1"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
                editable={!loading}
                returnKeyType="search"
                onSubmitEditing={verify}
                className="font-manrope-extrabold ml-2 min-w-0 flex-1 py-0 text-[15px] tracking-[1px] text-[#10243e]"
              />
            </View>
            <Pressable
              onPress={verify}
              disabled={loading}
              accessibilityLabel="Fetch details"
              className={`h-[48px] flex-row items-center justify-center rounded-[11px] bg-[#ff7417] px-4 ${loading ? 'opacity-60' : ''}`}
              style={styles.orangeShadow}>
              {loading ? <ActivityIndicator color="white" /> : <Ionicons name="search" size={18} color="white" />}
              <Text className="font-manrope-extrabold ml-1.5 text-[12px] text-white">Fetch</Text>
            </Pressable>
          </View>
          {inputError ? <Text className="font-manrope-semibold mt-1.5 text-[10px] text-[#ef3347]">{inputError}</Text> : null}
        </View>

        <View className="mt-3 gap-3">
          <Banner tone="error" message={error} />
          {loading ? <LoadingState label="Fetching vehicle details..." /> : null}
          {response && !loading ? (
            <>
              <View className="flex-row items-center rounded-[14px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
                <View className="h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-[#d9f3ec]">
                  <MaterialCommunityIcons name="truck-check-outline" size={25} color="#0b876f" />
                </View>
                <View className="ml-2.5 min-w-0 flex-1">
                  <Text className="font-manrope-extrabold text-[16px] tracking-[0.5px] text-[#10243e]">{response.vehicle_number ?? vehicleNumber}</Text>
                  <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">
                    {response.fetched_at ? `Fetched at ${response.fetched_at}` : 'Vehicle details returned successfully.'}
                  </Text>
                </View>
                <Pill label="Verified" bg="#d9f3ec" color="#0b876f" />
              </View>
              {hasDisplayableDetails(response.details) ? (
                <Section icon="truck-outline" title="Vehicle details">
                  <DetailRenderer value={response.details} />
                </Section>
              ) : (
                <Banner tone="info" message="No vehicle detail fields were returned for this vehicle." />
              )}
            </>
          ) : null}
          {!response && !loading && !error ? (
            <View className="items-center rounded-[14px] border border-dashed border-[#d8dce3] px-5 py-8">
              <MaterialCommunityIcons name="shield-search" size={32} color={ORANGE} />
              <Text className="font-manrope-medium mt-2 text-center text-[11px] leading-[16px] text-[#617091]">
                Owner, registration, fitness, insurance and permit details appear here once fetched.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </AppScreen>
  );
}

function DetailRenderer({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <View className="gap-2">
        {value.filter(hasDisplayableDetails).map((item, index) => (
          <View key={index} className="rounded-[11px] border border-[#ebe8e1] p-2.5">
            <Text className="font-manrope-bold mb-1.5 text-[9px] uppercase tracking-[0.8px] text-[#8290a1]">Record {index + 1}</Text>
            <DetailRenderer value={item} />
          </View>
        ))}
      </View>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(([, item]) => hasDisplayableDetails(item));
    if (entries.length === 0) return <Text className="font-manrope-medium text-[11px] text-[#617091]">No fields available.</Text>;
    return (
      <View>
        {entries.map(([key, item]) =>
          isRecord(item) || Array.isArray(item) ? (
            <View key={key} className="border-t border-[#f0eee9] py-2.5">
              <Text className="font-manrope-bold mb-1.5 text-[9px] uppercase tracking-[0.8px] text-[#8290a1]">{formatLabel(key)}</Text>
              <DetailRenderer value={item} />
            </View>
          ) : (
            <View key={key} className="flex-row items-start justify-between gap-3 border-t border-[#f0eee9] py-2.5">
              <Text className="font-manrope-medium w-[42%] text-[11px] text-[#65728a]">{formatLabel(key)}</Text>
              <Text selectable className="font-manrope-bold min-w-0 flex-1 text-right text-[11px] text-[#10243e]">{formatValue(item)}</Text>
            </View>
          ),
        )}
      </View>
    );
  }

  return <Text className="font-manrope-bold text-[11px] text-[#10243e]">{formatValue(value)}</Text>;
}

function hasDisplayableDetails(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.some(hasDisplayableDetails);
  if (isRecord(value)) return Object.values(value).some(hasDisplayableDetails);
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  return '-';
}
