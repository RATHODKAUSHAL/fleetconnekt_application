import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-shell';
import { ListHeader, Meta } from '@/components/list';
import { Banner, ChipButton, EmptyState, FilterChips, LoadingState, NAVY, ORANGE, Pill, SearchBar, styles } from '@/components/ui';
import { VehicleLocationSheet } from '@/components/vehicle-location-sheet';
import { useCompany } from '@/context/auth';
import {
  bookingStatusLabels,
  bookingStatusTone,
  formatDate,
  formatMoney,
  paymentStatusLabels,
  paymentStatusTone,
} from '@/lib/format';
import { bookingApi, errorMessage, type Booking, type PaymentStatus } from '@/services/api';

const PER_PAGE = 10;

type PaymentFilter = 'all' | PaymentStatus;

const paymentFilters: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overpaid', label: 'Overpaid' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const { token, companyId, canManage } = useCompany();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [locateVehicle, setLocateVehicle] = useState<string | null>(null);
  const requestId = useRef(0);
  const firstFocus = useRef(true);

  const fetchPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!token || !companyId) return;
      const currentRequest = ++requestId.current;
      try {
        setError(null);
        const response = await bookingApi.list(token, companyId, {
          page: nextPage,
          perPage: PER_PAGE,
          search,
          paymentStatus: paymentFilter === 'all' ? null : paymentFilter,
        });
        if (currentRequest !== requestId.current) return;
        setBookings((current) => (append ? [...current, ...response.data] : response.data));
        setPage(response.current_page);
        setLastPage(response.last_page ?? 1);
        setTotal(response.total ?? response.data.length);
      } catch (issue) {
        if (currentRequest === requestId.current) setError(errorMessage(issue, 'Could not load bookings.'));
      }
    },
    [companyId, paymentFilter, search, token],
  );

  useEffect(() => {
    setLoading(true);
    fetchPage(1, false).finally(() => setLoading(false));
  }, [fetchPage]);

  // Reload the first page when returning from the form or detail screen.
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void fetchPage(1, false);
    }, [fetchPage]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await fetchPage(1, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    await fetchPage(page + 1, true);
    setLoadingMore(false);
  };

  function confirmDelete(booking: Booking) {
    Alert.alert('Delete booking?', `This will remove ${booking.booking_number}. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token || !companyId) return;
          setDeletingUid(booking.uid);
          try {
            await bookingApi.delete(token, companyId, booking.uid);
            setBookings((current) => current.filter((item) => item.uid !== booking.uid));
            setTotal((current) => Math.max(current - 1, 0));
          } catch (issue) {
            Alert.alert('Could not delete booking', errorMessage(issue));
          } finally {
            setDeletingUid(null);
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}>
      <View className="w-full max-w-[560px] self-center px-[18px] pt-3">
        <ListHeader
          title="Truck bookings"
          subtitle="Create, track and collect payments for bookings"
          actionLabel={canManage ? 'New booking' : undefined}
          onAction={() => router.push('/booking-form')}
        />

        <View className="mt-4 flex-row items-center gap-2">
          <View className="min-w-0 flex-1">
            <SearchBar
              value={searchInput}
              onChangeText={(value) => {
                setSearchInput(value);
                if (!value) setSearch('');
              }}
              onSubmit={() => setSearch(searchInput.trim())}
              placeholder="Search booking number..."
            />
          </View>
          <Pressable
            onPress={() => setSearch(searchInput.trim())}
            accessibilityLabel="Search bookings"
            className="h-[40px] w-[40px] items-center justify-center rounded-[11px] bg-[#061934]">
            <Ionicons name="search" size={18} color="white" />
          </Pressable>
        </View>

        <View className="mt-2.5">
          <FilterChips options={paymentFilters} value={paymentFilter} onChange={setPaymentFilter} />
        </View>

        <View className="mt-3 gap-2.5">
          <Banner tone="error" message={error} />
          {loading && bookings.length === 0 ? (
            <LoadingState label="Loading bookings..." />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="file-document-multiple-outline"
              title={search || paymentFilter !== 'all' ? 'No matching bookings' : 'No bookings yet'}
              description={search || paymentFilter !== 'all' ? 'Try another booking number or filter.' : 'Create your first booking to see it here.'}
              actionLabel={!search && paymentFilter === 'all' && canManage ? 'New booking' : undefined}
              onAction={() => router.push('/booking-form')}
            />
          ) : (
            <>
              <Text className="font-manrope-semibold text-[10px] text-[#617091]">
                Showing {bookings.length} of {total} booking{total === 1 ? '' : 's'}
              </Text>
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.uid}
                  booking={booking}
                  canManage={canManage}
                  deleting={deletingUid === booking.uid}
                  onOpen={() => router.push({ pathname: '/booking/[uid]', params: { uid: booking.uid } })}
                  onEdit={() => router.push({ pathname: '/booking-form', params: { uid: booking.uid } })}
                  onDelete={() => confirmDelete(booking)}
                  onLocate={() => setLocateVehicle(booking.vehicle_number)}
                />
              ))}
              {page < lastPage ? (
                <Pressable
                  onPress={loadMore}
                  disabled={loadingMore}
                  className="h-11 flex-row items-center justify-center rounded-[12px] border border-[#e5e9ef] bg-white">
                  {loadingMore ? <ActivityIndicator color={ORANGE} /> : <Ionicons name="chevron-down" size={17} color={NAVY} />}
                  <Text className="font-manrope-bold ml-2 text-[12px] text-[#10243e]">{loadingMore ? 'Loading...' : 'Load more'}</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>
      <VehicleLocationSheet vehicleNumber={locateVehicle} onClose={() => setLocateVehicle(null)} />
    </AppScreen>
  );
}

function BookingCard({
  booking,
  canManage,
  deleting,
  onOpen,
  onEdit,
  onDelete,
  onLocate,
}: {
  booking: Booking;
  canManage: boolean;
  deleting: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLocate: () => void;
}) {
  const tone = bookingStatusTone[booking.status] ?? bookingStatusTone.pending;
  const paymentStatus = booking.payment?.payment_status;

  return (
    <Pressable onPress={onOpen} className="rounded-[13px] border border-[#e3e7ed] bg-white p-3 active:opacity-90" style={styles.cardShadow}>
      <View className="flex-row items-start">
        <View className="h-[46px] w-[46px] items-center justify-center rounded-[12px]" style={{ backgroundColor: tone.bg }}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={25} color={tone.color} />
        </View>
        <View className="ml-2.5 min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
              <Text numberOfLines={1} className="font-manrope-extrabold text-[13px] text-[#10243e]">{booking.booking_number}</Text>
              <Pill label={bookingStatusLabels[booking.status] ?? booking.status} bg={tone.bg} color={tone.color} />
            </View>
            <Text className="font-manrope-semibold text-[9px] text-[#637194]">{formatDate(booking.pickup_date || booking.created_at)}</Text>
          </View>
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="location-outline" size={16} color={ORANGE} />
            <Text numberOfLines={1} className="font-manrope-bold ml-1 shrink text-[11px] text-[#10243e]">{booking.origin_city?.name ?? '-'}</Text>
            <Ionicons name="arrow-forward" size={13} color="#617091" style={{ marginHorizontal: 5 }} />
            <Text numberOfLines={1} className="font-manrope-bold shrink text-[11px] text-[#10243e]">{booking.destination_city?.name ?? '-'}</Text>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center">
        <Meta grow icon="account-outline" label={booking.customer?.name || 'No customer'} />
        <View className="mx-1.5 h-4 w-px bg-[#dce1e8]" />
        <Meta grow icon="truck-outline" label={booking.vehicle_number || 'No vehicle'} />
        <View className="mx-1.5 h-4 w-px bg-[#dce1e8]" />
        <Meta grow icon="currency-inr" label={booking.customer_freight == null ? 'Not set' : formatMoney(booking.customer_freight)} />
      </View>

      <View className="mt-3 flex-row flex-wrap items-center justify-between gap-2 border-t border-[#f0eee9] pt-3">
        <View className="flex-row items-center gap-1.5">
          {paymentStatus ? (
            <Pill label={paymentStatusLabels[paymentStatus]} bg={paymentStatusTone[paymentStatus].bg} color={paymentStatusTone[paymentStatus].color} />
          ) : null}
          {booking.vendor ? (
            <Text numberOfLines={1} className="font-manrope-semibold text-[9px] text-[#637194]">Vendor: {booking.vendor.name}</Text>
          ) : null}
        </View>
        <View className="flex-row gap-2">
          {booking.vehicle_number ? <ChipButton label="Locate" icon="navigate-outline" tone="orange" onPress={onLocate} /> : null}
          {canManage ? (
            <>
              <ChipButton label="Edit" icon="create-outline" onPress={onEdit} />
              <ChipButton label="Delete" icon="trash-outline" tone="danger" loading={deleting} onPress={onDelete} />
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
