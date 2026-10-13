import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Banner, BottomSheet, ChipButton, LoadingState, ORANGE } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { errorMessage, vehicleLocationApi, type VehicleLocationResponse, type VehicleLocationTxn } from '@/services/api';

function extractTxns(data: VehicleLocationResponse | null): VehicleLocationTxn[] {
  const txn = data?.response?.[0]?.response?.vehicle?.vehltxnList?.txn;
  if (!txn) return [];
  return Array.isArray(txn) ? txn : [txn];
}

export function openInMaps(latitude: string | number, longitude: string | number, label?: string | null) {
  const query = `${latitude},${longitude}`;
  void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label ? `${query} (${label})` : query)}`);
}

/** Latest FASTag toll crossings for a vehicle (the website's "Verify vehicle" map, as a list). */
export function VehicleLocationSheet({ vehicleNumber, onClose }: { vehicleNumber: string | null; onClose: () => void }) {
  const { token } = useAuth();
  const [data, setData] = useState<VehicleLocationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !vehicleNumber) return;
    setLoading(true);
    setError(null);
    try {
      setData(await vehicleLocationApi.show(token, vehicleNumber));
    } catch (issue) {
      setData(null);
      setError(errorMessage(issue, 'Could not fetch vehicle location.'));
    } finally {
      setLoading(false);
    }
  }, [token, vehicleNumber]);

  useEffect(() => {
    if (vehicleNumber) void load();
    else setData(null);
  }, [load, vehicleNumber]);

  // Newest crossing first.
  const txns = extractTxns(data).slice().reverse();

  return (
    <BottomSheet visible={Boolean(vehicleNumber)} title={`Vehicle location · ${vehicleNumber ?? ''}`} onClose={onClose}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-manrope-semibold text-[11px] text-[#617091]">
          {loading ? 'Fetching FASTag crossings...' : `${txns.length} location ${txns.length === 1 ? 'point' : 'points'}`}
        </Text>
        <ChipButton label="Refresh" icon="refresh" onPress={load} loading={loading} />
      </View>
      {loading && !data ? (
        <LoadingState label="Fetching vehicle location..." />
      ) : error ? (
        <Banner tone="error" message={error} />
      ) : txns.length === 0 ? (
        <View className="items-center rounded-[14px] border border-[#ebe8e1] bg-white px-4 py-8">
          <MaterialCommunityIcons name="map-marker-off-outline" size={30} color="#8290a1" />
          <Text className="font-manrope-extrabold mt-2 text-[14px] text-[#10243e]">No location points found</Text>
          <Text className="font-manrope-medium mt-1 text-center text-[11px] text-[#617091]">
            The tracking service did not return toll location data for this vehicle.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-2 pb-2">
            {txns.map((txn, index) => {
              const [latitude, longitude] = (txn.tollPlazaGeocode ?? '').split(',').map((part) => part.trim());
              return (
                <View key={`${txn.seqNo ?? index}-${txn.readerReadTime}`} className="flex-row items-center rounded-[12px] border border-[#e3e7ed] bg-white p-3">
                  <View className={`h-9 w-9 items-center justify-center rounded-full ${index === 0 ? 'bg-[#fff0e5]' : 'bg-[#f4f6fa]'}`}>
                    <MaterialCommunityIcons name={index === 0 ? 'truck-fast-outline' : 'boom-gate-outline'} size={18} color={index === 0 ? ORANGE : '#53688a'} />
                  </View>
                  <View className="ml-2.5 min-w-0 flex-1">
                    <Text numberOfLines={2} className="font-manrope-bold text-[12px] text-[#10243e]">
                      {txn.tollPlazaName || 'Toll plaza'}
                    </Text>
                    <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">
                      {txn.readerReadTime || 'Time unavailable'}
                      {txn.laneDirection ? ` · Direction ${txn.laneDirection}` : ''}
                    </Text>
                  </View>
                  {latitude && longitude ? (
                    <Pressable
                      onPress={() => openInMaps(latitude, longitude, txn.tollPlazaName)}
                      accessibilityLabel="Open in maps"
                      className="h-9 w-9 items-center justify-center rounded-full bg-[#eaf2ff]">
                      <Ionicons name="navigate-outline" size={17} color="#3578e5" />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </BottomSheet>
  );
}
