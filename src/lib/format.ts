import type { BookingStatus, CityOption, PaymentMethod, PaymentStatus, PaymentType } from '@/services/api';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
export const PHONE_PATTERN = /^\+?[\d\s-]{7,30}$/;
export const PREFIX_PATTERN = /^[A-Z0-9]{2}$/;
export const URL_PATTERN = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;
export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
export const OTP_LENGTH = 4;

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const bookingStatusTone: Record<BookingStatus, { bg: string; color: string }> = {
  pending: { bg: '#fff0df', color: '#d9640f' },
  confirmed: { bg: '#e7f0ff', color: '#2f6fd6' },
  in_transit: { bg: '#e7f0ff', color: '#2f6fd6' },
  delivered: { bg: '#d9f3ec', color: '#0b876f' },
  cancelled: { bg: '#ffe4e7', color: '#ef3347' },
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  overpaid: 'Overpaid',
};

export const paymentStatusTone: Record<PaymentStatus, { bg: string; color: string }> = {
  unpaid: { bg: '#ffe4e7', color: '#ef3347' },
  partially_paid: { bg: '#fff0df', color: '#d9640f' },
  paid: { bg: '#d9f3ec', color: '#0b876f' },
  overpaid: { bg: '#e7f0ff', color: '#2f6fd6' },
};

export const paymentTypeLabels: Record<PaymentType, string> = {
  advance: 'Advance',
  balance: 'Balance',
  full: 'Full',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  cash: 'Cash',
  other: 'Other',
};

export function formatMoney(value: string | number | null | undefined, decimals = 0) {
  const amount = Number(value ?? 0) || 0;
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: 0 })}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-08-12" or an ISO timestamp → "12 Aug 2026". */
export function formatDate(value?: string | null) {
  if (!value) return '-';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours % 12 || 12}:${minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${time}`;
}

/** Local calendar date as YYYY-MM-DD (the format the API expects). */
export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function cityLabel(city?: CityOption | null) {
  if (!city) return '';
  return [city.name, city.state?.name].filter(Boolean).join(', ');
}

export function initials(value?: string | null) {
  const parts = (value ?? '').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]).join('') || 'FC').toUpperCase();
}

export function normalizeIndianMobile(value: string) {
  return value.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
}

export function money(value: string) {
  return Number(value.replace(/[^0-9.]/g, '')) || 0;
}
