import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ConfirmDialog, ORANGE, Pill } from '@/components/ui';
import { bookingStatusLabels, bookingStatusTone, formatDate, formatMoney } from '@/lib/format';
import type { Booking } from '@/services/api';

/** Delete confirmation for a booking, showing a short summary so the user can verify what is being removed. */
export function BookingDeleteDialog({
  booking,
  deleting,
  error,
  onConfirm,
  onCancel,
}: {
  booking: Booking | null;
  deleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const tone = booking ? bookingStatusTone[booking.status] ?? bookingStatusTone.pending : null;

  return (
    <ConfirmDialog
      visible={!!booking}
      title="Delete booking?"
      message="This booking will be permanently removed. Please confirm the details below before deleting."
      confirmLabel="Delete booking"
      loading={deleting}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
      details={
        booking && tone ? (
          <View>
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-[10px]" style={{ backgroundColor: tone.bg }}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={19} color={tone.color} />
              </View>
              <View className="ml-2.5 min-w-0 flex-1">
                <View className="flex-row flex-wrap items-center gap-1.5">
                  <Text numberOfLines={1} className="font-manrope-extrabold text-[13px] text-[#10243e]">{booking.booking_number}</Text>
                  <Pill label={bookingStatusLabels[booking.status] ?? booking.status} bg={tone.bg} color={tone.color} />
                </View>
                <Text className="font-manrope-semibold mt-0.5 text-[10px] text-[#637194]">{formatDate(booking.pickup_date || booking.created_at)}</Text>
              </View>
            </View>
            <View className="mt-2.5 flex-row items-center border-t border-[#ebe8e1] pt-2.5">
              <Ionicons name="location-outline" size={15} color={ORANGE} />
              <Text numberOfLines={1} className="font-manrope-bold ml-1 shrink text-[11px] text-[#10243e]">{booking.origin_city?.name ?? '-'}</Text>
              <Ionicons name="arrow-forward" size={12} color="#617091" style={{ marginHorizontal: 5 }} />
              <Text numberOfLines={1} className="font-manrope-bold shrink text-[11px] text-[#10243e]">{booking.destination_city?.name ?? '-'}</Text>
            </View>
            <View className="mt-1.5 flex-row items-center justify-between gap-2">
              <Text numberOfLines={1} className="font-manrope-medium min-w-0 flex-1 text-[10px] text-[#617091]">
                {booking.customer?.name || 'No customer'} · {booking.vehicle_number || 'No vehicle'}
              </Text>
              {booking.customer_freight != null ? (
                <Text className="font-manrope-bold text-[10px] text-[#10243e]">{formatMoney(booking.customer_freight)}</Text>
              ) : null}
            </View>
          </View>
        ) : null
      }
    />
  );
}
