import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, Share, Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { BookingPayments } from '@/components/booking-payments';
import { Banner, ChipButton, FilterChips, InfoRow, LoadingState, NAVY, ORANGE, Pill, Section, styles } from '@/components/ui';
import { openInMaps } from '@/components/vehicle-location-sheet';
import { useCompany } from '@/context/auth';
import {
  bookingStatusLabels,
  bookingStatusTone,
  cityLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
} from '@/lib/format';
import {
  bookingApi,
  errorMessage,
  type Booking,
  type BookingLocationsResponse,
  type BookingPaymentSummary,
} from '@/services/api';

type Tab = 'overview' | 'tracking' | 'payments';

const tabs: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'payments', label: 'Payments' },
];

export default function BookingDetailScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { token, companyId, canManage } = useCompany();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [locations, setLocations] = useState<BookingLocationsResponse | null>(null);
  const [summary, setSummary] = useState<BookingPaymentSummary | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token || !companyId || !uid) return;
    try {
      setError(null);
      const [loadedBooking] = await Promise.all([
        bookingApi.get(token, companyId, uid),
        bookingApi
          .locations(token, companyId, uid)
          .then(setLocations)
          .catch(() => setLocations(null)),
        bookingApi
          .payments(token, companyId, uid)
          .then((data) => setSummary(data.summary))
          .catch(() => undefined),
      ]);
      setBooking(loadedBooking);
    } catch (issue) {
      setError(errorMessage(issue, 'Could not load booking.'));
    }
  }, [companyId, token, uid]);

  // Loads on open and again after returning from the edit form.
  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  function confirmDelete() {
    if (!booking) return;
    Alert.alert('Delete booking?', `This will remove ${booking.booking_number}. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token || !companyId) return;
          setDeleting(true);
          try {
            await bookingApi.delete(token, companyId, booking.uid);
            router.back();
          } catch (issue) {
            Alert.alert('Could not delete booking', errorMessage(issue));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  const tone = booking ? bookingStatusTone[booking.status] ?? bookingStatusTone.pending : null;

  return (
    <SubScreen
      title={booking?.booking_number ?? 'Booking'}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}
      right={
        booking && canManage ? (
          <Pressable
            onPress={() => router.push({ pathname: '/booking-form', params: { uid: booking.uid } })}
            accessibilityLabel="Edit booking"
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
            style={styles.softShadow}>
            <Ionicons name="create-outline" size={20} color={NAVY} />
          </Pressable>
        ) : undefined
      }>
      {loading ? (
        <LoadingState label="Loading booking..." />
      ) : error || !booking || !tone ? (
        <Banner tone="error" message={error ?? 'Booking not found.'} />
      ) : (
        <View className="gap-3">
          <View className="rounded-[13px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
            <View className="flex-row items-start">
              <View className="h-[46px] w-[46px] items-center justify-center rounded-[12px]" style={{ backgroundColor: tone.bg }}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={25} color={tone.color} />
              </View>
              <View className="ml-2.5 min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text numberOfLines={1} className="font-manrope-extrabold shrink text-[15px] text-[#10243e]">{booking.booking_number}</Text>
                  <Pill label={bookingStatusLabels[booking.status] ?? booking.status} bg={tone.bg} color={tone.color} />
                </View>
                <View className="mt-1.5 flex-row items-center">
                  <Ionicons name="location-outline" size={16} color={ORANGE} />
                  <Text numberOfLines={1} className="font-manrope-bold ml-1 shrink text-[12px] text-[#10243e]">{booking.origin_city?.name ?? '-'}</Text>
                  <Ionicons name="arrow-forward" size={13} color="#617091" style={{ marginHorizontal: 5 }} />
                  <Text numberOfLines={1} className="font-manrope-bold shrink text-[12px] text-[#10243e]">{booking.destination_city?.name ?? '-'}</Text>
                </View>
                <Text className="font-manrope-medium mt-1 text-[10px] text-[#617091]">
                  Customer: {booking.customer?.name ?? 'Not assigned'} · Vendor: {booking.vendor?.name ?? 'Not assigned'}
                </Text>
              </View>
            </View>
          </View>

          <FilterChips options={tabs} value={tab} onChange={setTab} />

          {tab === 'overview' ? (
            <Overview booking={booking} summary={summary} locations={locations} canManage={canManage} deleting={deleting} onDelete={confirmDelete} />
          ) : null}
          {tab === 'tracking' ? (
            <Tracking booking={booking} locations={locations} onLocationsChange={setLocations} canManage={canManage} />
          ) : null}
          {tab === 'payments' ? <BookingPayments bookingUid={booking.uid} onSummaryChange={setSummary} /> : null}
        </View>
      )}
    </SubScreen>
  );
}

function Overview({
  booking,
  summary,
  locations,
  canManage,
  deleting,
  onDelete,
}: {
  booking: Booking;
  summary: BookingPaymentSummary | null;
  locations: BookingLocationsResponse | null;
  canManage: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const freight = summary?.customer_freight ?? booking.customer_freight;
  const balance = summary?.balance_due == null ? null : Number(summary.balance_due);
  const lastLocation = locations?.last_location ?? booking.last_location ?? null;

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        <Kpi label="Customer freight" value={freight == null ? 'Not set' : formatMoney(freight)} helper={summary ? paymentStatusLabels[summary.payment_status] : '-'} />
        <Kpi label="Received" value={summary ? formatMoney(summary.total_settled) : '-'} helper={summary ? `Incl. ${formatMoney(summary.tds_deducted)} TDS` : '-'} accent="#0b876f" />
        <Kpi
          label={balance !== null && balance < 0 ? 'Customer credit' : 'Outstanding'}
          value={balance === null ? '-' : formatMoney(Math.abs(balance))}
          helper={balance !== null && balance < 0 ? 'Customer has paid extra' : 'Freight minus received'}
          accent={balance !== null && balance > 0 ? ORANGE : '#0b876f'}
        />
        <Kpi label="Pickup date" value={formatDate(booking.pickup_date)} helper={`Delivery ${formatDate(booking.expected_delivery_date)}`} accent="#3578e5" />
      </View>

      <Section icon="file-document-outline" title="Booking details">
        <InfoRow label="Booking number" value={booking.booking_number} />
        <InfoRow label="Status" value={bookingStatusLabels[booking.status]} />
        <InfoRow label="Pickup city" value={cityLabel(booking.origin_city)} />
        <InfoRow label="Drop city" value={cityLabel(booking.destination_city)} />
        <InfoRow label="Pickup date" value={formatDate(booking.pickup_date)} />
        <InfoRow label="Expected delivery" value={formatDate(booking.expected_delivery_date)} />
        <InfoRow label="Customer reference" value={booking.customer_reference} />
        <InfoRow label="Created" value={formatDateTime(booking.created_at)} />
        <InfoRow label="Last updated" value={formatDateTime(booking.updated_at)} />
      </Section>

      <Section icon="map-marker-path" title="Route">
        <InfoRow label="Pickup address" value={booking.pickup_address} />
        <InfoRow label="Delivery address" value={booking.delivery_address} />
      </Section>

      <Section icon="account-outline" title="Customer">
        {booking.customer ? (
          <Person
            name={booking.customer.name}
            lines={[booking.customer.company_name, booking.customer.phone, booking.customer.email]}
            phone={booking.customer.phone}
          />
        ) : (
          <Text className="font-manrope-medium text-[11px] text-[#617091]">No customer assigned.</Text>
        )}
      </Section>

      <Section icon="truck-outline" title="Vendor">
        {booking.vendor ? (
          <Person
            name={booking.vendor.name}
            lines={[booking.vendor.company_name, booking.vendor.mobile || booking.vendor.phone, booking.vendor.email]}
            phone={booking.vendor.mobile || booking.vendor.phone}
          />
        ) : (
          <Text className="font-manrope-medium text-[11px] text-[#617091]">No vendor assigned.</Text>
        )}
      </Section>

      <Section icon="steering" title="Vehicle">
        <InfoRow label="Vehicle" value={booking.vehicle_number} />
        <InfoRow label="Driver" value={booking.driver_number} />
        <InfoRow label="Last location" value={lastLocation?.place_name} />
        <InfoRow label="Located at" value={lastLocation?.recorded_at ? formatDateTime(lastLocation.recorded_at) : null} />
        {booking.driver_number ? (
          <View className="mt-2 items-start">
            <ChipButton label="Call driver" icon="call-outline" onPress={() => Linking.openURL(`tel:${booking.driver_number}`)} />
          </View>
        ) : null}
      </Section>

      <Section icon="note-text-outline" title="Remarks">
        <Text className="font-manrope-medium text-[11px] leading-[16px] text-[#26364b]">{booking.remarks || 'No remarks added.'}</Text>
      </Section>

      {canManage ? (
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className={`h-12 flex-row items-center justify-center rounded-[14px] border border-[#f0d6cb] bg-[#fff8f5] ${deleting ? 'opacity-60' : ''}`}>
          <Ionicons name="trash-outline" size={18} color="#cf5c38" />
          <Text className="font-manrope-bold ml-2 text-[12px] text-[#cf5c38]">{deleting ? 'Deleting...' : 'Delete booking'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Tracking({
  booking,
  locations,
  onLocationsChange,
  canManage,
}: {
  booking: Booking;
  locations: BookingLocationsResponse | null;
  onLocationsChange: (data: BookingLocationsResponse) => void;
  canManage: boolean;
}) {
  const { token, companyId } = useCompany();
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Links are created per share; reuse the one made in this session instead of minting a new one each tap.
  const shareUrl = useRef<string | null>(null);
  const points = [...(locations?.locations ?? [])].reverse();

  async function refreshLocation() {
    if (!token || !companyId) return;
    setRefreshing(true);
    setError(null);
    setNotice(null);
    try {
      const data = await bookingApi.refreshLocations(token, companyId, booking.uid);
      onLocationsChange(data);
      setNotice(data.new_locations ? `${data.new_locations} new location ${data.new_locations === 1 ? 'point' : 'points'} found.` : 'Location is up to date.');
    } catch (issue) {
      setError(errorMessage(issue, 'Could not refresh tracking details.'));
    } finally {
      setRefreshing(false);
    }
  }

  async function shareTracking() {
    if (!token || !companyId) return;
    setSharing(true);
    setError(null);
    try {
      if (!shareUrl.current) {
        const link = await bookingApi.createShareLink(token, companyId, booking.uid, {
          label: null,
          show_vehicle_number: true,
          expires_at: null,
        });
        shareUrl.current = link.url ?? null;
      }
      if (!shareUrl.current) throw new Error('missing url');
      await Share.share({ message: `Track booking ${booking.booking_number}: ${shareUrl.current}` });
    } catch (issue) {
      setError(errorMessage(issue, 'Could not create tracking link.'));
    } finally {
      setSharing(false);
    }
  }

  return (
    <View className="gap-3">
      <Section icon="map-marker-radius-outline" title="Tracking">
        <Text className="font-manrope-medium -mt-1 text-[10px] text-[#617091]">
          {booking.vehicle_number || 'Vehicle number pending'}
          {locations?.location_synced_at ? ` · Last synced ${formatDateTime(locations.location_synced_at)}` : ''}
        </Text>
        {locations?.location_sync_error ? (
          <View className="mt-2">
            <Banner tone="warning" message={locations.location_sync_error} />
          </View>
        ) : null}
        <View className="mt-2 gap-2">
          <Banner tone="error" message={error} />
          <Banner tone="success" message={notice} />
        </View>
        {canManage ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            <ChipButton label="Refresh location" icon="refresh" loading={refreshing} disabled={!booking.vehicle_number} onPress={refreshLocation} />
            <ChipButton label="Share tracking link" icon="share-social-outline" tone="orange" loading={sharing} onPress={shareTracking} />
          </View>
        ) : (
          <Text className="font-manrope-medium mt-2 text-[10px] text-[#8290a1]">
            Only owner, admin, or dispatcher roles can refresh tracking and share links.
          </Text>
        )}
      </Section>

      <Section icon="history" title="Location history">
        {points.length === 0 ? (
          <View className="items-center py-6">
            <MaterialCommunityIcons name="truck-outline" size={28} color="#8290a1" />
            <Text className="font-manrope-extrabold mt-2 text-[13px] text-[#10243e]">Location not available</Text>
            <Text className="font-manrope-medium mt-1 text-center text-[10px] text-[#617091]">Location for this vehicle is not available yet.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {points.map((point, index) => (
              <Pressable
                key={point.id}
                onPress={() => openInMaps(point.latitude, point.longitude, point.place_name)}
                className="flex-row items-center rounded-[11px] border border-[#ebe8e1] bg-white p-3 active:bg-[#faf9f6]">
                <View className={`h-9 w-9 items-center justify-center rounded-full ${index === 0 ? 'bg-[#fff0e5]' : 'bg-[#f4f6fa]'}`}>
                  <MaterialCommunityIcons name={index === 0 ? 'truck-fast-outline' : 'map-marker-outline'} size={18} color={index === 0 ? ORANGE : '#53688a'} />
                </View>
                <View className="ml-2.5 min-w-0 flex-1">
                  <Text numberOfLines={2} className="font-manrope-bold text-[12px] text-[#10243e]">{point.place_name ?? 'Vehicle location'}</Text>
                  <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">
                    {point.recorded_at ? formatDateTime(point.recorded_at) : 'Time unavailable'} · Direction {point.lane_direction ?? '-'}
                  </Text>
                </View>
                <Ionicons name="navigate-outline" size={17} color="#3578e5" />
              </Pressable>
            ))}
          </View>
        )}
      </Section>
    </View>
  );
}

function Kpi({ label, value, helper, accent }: { label: string; value: string; helper: string; accent?: string }) {
  return (
    <View className="w-[48.5%] rounded-[13px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
      <Text className="font-manrope-bold text-[9px] uppercase tracking-[0.6px] text-[#728095]">{label}</Text>
      <Text numberOfLines={1} className="font-manrope-extrabold mt-1 text-[16px] text-[#10243e]">{value}</Text>
      <View className="mt-1.5 h-[3px] w-7 rounded-full" style={{ backgroundColor: accent ?? '#d8dce3' }} />
      <Text numberOfLines={1} className="font-manrope-medium mt-1.5 text-[9px] text-[#8290a1]">{helper}</Text>
    </View>
  );
}

function Person({ name, lines, phone }: { name: string; lines: (string | null | undefined)[]; phone?: string | null }) {
  return (
    <View className="flex-row items-start">
      <View className="min-w-0 flex-1">
        <Text className="font-manrope-extrabold text-[13px] text-[#10243e]">{name}</Text>
        {lines.filter(Boolean).map((line) => (
          <Text key={line} className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">{line}</Text>
        ))}
      </View>
      {phone ? (
        <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} accessibilityLabel={`Call ${name}`} className="h-9 w-9 items-center justify-center rounded-full bg-[#e9f7f1]">
          <Ionicons name="call-outline" size={17} color="#17806d" />
        </Pressable>
      ) : null}
    </View>
  );
}
