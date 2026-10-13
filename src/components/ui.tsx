import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatDate, toIsoDate } from '@/lib/format';

export const ORANGE = '#ff7417';
export const NAVY = '#10243e';

export type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type IonIconName = ComponentProps<typeof Ionicons>['name'];

export function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: MaterialIconName;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="rounded-[12px] border border-[#e0ddd8] bg-white p-3" style={styles.cardShadow}>
      <View className="mb-2.5 flex-row items-center">
        <MaterialCommunityIcons name={icon} size={21} color={ORANGE} />
        <Text className="font-manrope-extrabold ml-2.5 min-w-0 flex-1 text-[14px] text-[#10243e]">{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Field({
  label,
  required,
  error,
  helper,
  prefix,
  rightIcon,
  multiline,
  editable = true,
  className,
  ...inputProps
}: Omit<TextInputProps, 'className'> & {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  prefix?: string;
  rightIcon?: IonIconName;
  className?: string;
}) {
  return (
    <View className={`min-w-0 flex-1 ${className ?? ''}`}>
      <FieldLabel label={label} required={required} />
      <View
        className={`flex-row items-center rounded-[9px] border px-3 ${multiline ? 'min-h-[64px] items-start py-2' : 'h-[42px]'} ${
          error ? 'border-[#ef3347] bg-[#fffafa]' : 'border-[#d8d5cf] bg-white'
        } ${editable ? '' : 'bg-[#f6f5f2]'}`}>
        {prefix ? <Text className="font-manrope-extrabold mr-2.5 text-[12px] text-[#10243e]">{prefix}</Text> : null}
        <TextInput
          placeholderTextColor="#8490a1"
          multiline={multiline}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={`font-manrope-medium min-w-0 flex-1 py-0 text-[12px] ${editable ? 'text-[#10243e]' : 'text-[#617091]'} ${multiline ? 'min-h-[46px]' : ''}`}
          {...inputProps}
        />
        {rightIcon ? <Ionicons name={rightIcon} size={18} color="#10243e" /> : null}
      </View>
      <FieldMessage error={error} helper={helper} />
    </View>
  );
}

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text className="font-manrope-bold mb-1 text-[10px] text-[#10243e]">
      {label}
      {required ? <Text className="text-[#ef3347]"> *</Text> : null}
    </Text>
  );
}

export function FieldMessage({ error, helper }: { error?: string; helper?: string }) {
  if (error) return <Text className="font-manrope-semibold mt-1 text-[10px] text-[#ef3347]">{error}</Text>;
  if (helper) return <Text className="font-manrope-medium mt-1 text-[10px] text-[#8290a1]">{helper}</Text>;
  return null;
}

/** A tappable field that shows the current value and opens a picker (sheet, calendar, search). */
export function PressableField({
  label,
  value,
  placeholder,
  onPress,
  required,
  error,
  helper,
  icon = 'chevron-down',
  disabled,
  loading,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  onPress: () => void;
  required?: boolean;
  error?: string;
  helper?: string;
  icon?: IonIconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1">
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={`h-[42px] flex-row items-center rounded-[9px] border px-3 ${
          error ? 'border-[#ef3347] bg-[#fffafa]' : 'border-[#d8d5cf] bg-white'
        } ${disabled ? 'opacity-50' : ''}`}>
        <Text
          numberOfLines={1}
          className={`font-manrope-medium min-w-0 flex-1 text-[12px] ${value ? 'text-[#10243e]' : 'text-[#8490a1]'}`}>
          {value || placeholder || 'Select'}
        </Text>
        {loading ? <ActivityIndicator size="small" color={ORANGE} /> : <Ionicons name={icon} size={18} color="#10243e" />}
      </Pressable>
      <FieldMessage error={error} helper={helper} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  tone = 'orange',
  className,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IonIconName;
  tone?: 'orange' | 'navy' | 'danger';
  className?: string;
}) {
  const background = tone === 'navy' ? 'bg-[#061934]' : tone === 'danger' ? 'bg-[#cf3d3d]' : 'bg-[#ff7a0f]';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`h-14 flex-1 flex-row items-center justify-center rounded-[13px] px-3 ${background} ${disabled || loading ? 'opacity-60' : ''} ${className ?? ''}`}
      style={tone === 'orange' ? styles.orangeShadow : undefined}>
      {loading ? <ActivityIndicator color="white" /> : icon ? <Ionicons name={icon} size={20} color="white" /> : null}
      <Text className="font-manrope-extrabold ml-2 text-[14px] text-white">{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  icon,
  className,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IonIconName;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`h-14 flex-1 flex-row items-center justify-center rounded-[13px] border border-[#d8dce3] bg-white px-3 ${disabled ? 'opacity-45' : ''} ${className ?? ''}`}>
      {icon ? <Ionicons name={icon} size={20} color={NAVY} /> : null}
      <Text className="font-manrope-extrabold ml-2 text-[14px] text-[#10243e]">{label}</Text>
    </Pressable>
  );
}

/** Small action chip used inside cards (Edit, Delete, Refresh...). */
export function ChipButton({
  label,
  icon,
  onPress,
  tone = 'default',
  loading,
  disabled,
}: {
  label: string;
  icon?: IonIconName;
  onPress: () => void;
  tone?: 'default' | 'orange' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const palette =
    tone === 'orange'
      ? { box: 'border-[#ffdac0] bg-[#fff0e5]', text: 'text-[#f27022]', icon: '#f27022' }
      : tone === 'danger'
        ? { box: 'border-[#f6cfd3] bg-[#fff5f6]', text: 'text-[#cf3d3d]', icon: '#cf3d3d' }
        : { box: 'border-[#e5e9ef] bg-white', text: 'text-[#10243e]', icon: NAVY };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-9 flex-row items-center justify-center rounded-[10px] border px-3 ${palette.box} ${disabled ? 'opacity-50' : ''}`}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.icon} />
      ) : icon ? (
        <Ionicons name={icon} size={15} color={palette.icon} />
      ) : null}
      <Text className={`font-manrope-bold ml-1.5 text-[11px] ${palette.text}`}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ tone, message }: { tone: 'error' | 'success' | 'warning' | 'info'; message?: string | null }) {
  if (!message) return null;
  const palette = {
    error: { box: 'border-[#f6cfd3] bg-[#fff5f6]', text: 'text-[#b4232f]', icon: 'alert-circle-outline' as const, color: '#cf3d3d' },
    success: { box: 'border-[#bfe8d9] bg-[#effaf5]', text: 'text-[#0b6f5b]', icon: 'checkmark-circle-outline' as const, color: '#0b876f' },
    warning: { box: 'border-[#ffbc7f] bg-[#fffaf4]', text: 'text-[#26364b]', icon: 'information-circle-outline' as const, color: ORANGE },
    info: { box: 'border-[#cfe0fb] bg-[#f3f8ff]', text: 'text-[#315f94]', icon: 'information-circle-outline' as const, color: '#3578e5' },
  }[tone];
  return (
    <View className={`flex-row rounded-[10px] border p-2.5 ${palette.box}`}>
      <Ionicons name={palette.icon} size={19} color={palette.color} />
      <Text className={`font-manrope-semibold ml-2 min-w-0 flex-1 text-[11px] leading-[16px] ${palette.text}`}>{message}</Text>
    </View>
  );
}

export function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: bg }}>
      <Text className="font-manrope-bold text-[9px]" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View className="min-h-[220px] items-center justify-center">
      <ActivityIndicator color={ORANGE} />
      <Text className="font-manrope-semibold mt-3 text-[11px] text-[#617091]">{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: MaterialIconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center rounded-[13px] border border-[#e3e7ed] bg-white px-5 py-8" style={styles.cardShadow}>
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0e5]">
        <MaterialCommunityIcons name={icon} size={28} color={ORANGE} />
      </View>
      <Text className="font-manrope-extrabold mt-3 text-center text-[15px] text-[#10243e]">{title}</Text>
      {description ? (
        <Text className="font-manrope-medium mt-1 text-center text-[11px] leading-[16px] text-[#617091]">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="mt-4 h-10 flex-row items-center rounded-[12px] bg-[#ff7417] px-4" style={styles.orangeShadow}>
          <Ionicons name="add" size={19} color="white" />
          <Text className="font-manrope-extrabold ml-1.5 text-xs text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onSubmit,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onSubmit?: () => void;
}) {
  return (
    <View className="h-[40px] flex-row items-center rounded-[11px] border border-[#ebe8e2] bg-white px-3">
      <Ionicons name="search-outline" size={16} color="#8a95a5" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8a95a5"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        className="font-manrope-medium ml-2 flex-1 py-0 text-[11px] text-[#17253a]"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={16} color="#9aa4b2" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`h-9 min-w-[64px] items-center justify-center rounded-[10px] border px-3 ${active ? 'border-[#ffdac0] bg-[#fff0e5]' : 'border-[#ece9e4] bg-white'}`}>
            <Text className={`font-manrope-bold text-[10px] ${active ? 'text-[#f27022]' : 'text-[#10243e]'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Sticky footer that holds one or two full-width actions, like the LR form footer. */
export function FormFooter({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-[#e5e2dc] bg-white px-[18px] pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View className="w-full max-w-[560px] flex-row gap-3 self-center">{children}</View>
    </View>
  );
}

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} accessibilityLabel="Close" />
        <View
          className="max-h-[85%] w-full max-w-[560px] self-center rounded-t-[22px] bg-[#f8f8f5] px-[18px] pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-[#d8dce3]" />
          <View className="mb-3 flex-row items-center">
            <Text className="font-manrope-extrabold min-w-0 flex-1 text-[16px] text-[#10243e]">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close" className="h-8 w-8 items-center justify-center rounded-full bg-white">
              <Ionicons name="close" size={18} color={NAVY} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: T; label: string; description?: string }[];
  value?: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="overflow-hidden rounded-[14px] border border-[#ebe8e1] bg-white">
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={`flex-row items-center px-4 py-3.5 active:bg-[#faf9f6] ${index ? 'border-t border-[#efede8]' : ''}`}>
                <View className="min-w-0 flex-1">
                  <Text className={`font-manrope-bold text-[13px] ${active ? 'text-[#f27022]' : 'text-[#26364b]'}`}>{option.label}</Text>
                  {option.description ? (
                    <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#8290a1]">{option.description}</Text>
                  ) : null}
                </View>
                {active ? <Ionicons name="checkmark-circle" size={20} color={ORANGE} /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

/** Select field + its option sheet in one component. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
  error,
  helper,
  placeholder,
  disabled,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string; description?: string }[];
  onChange: (value: T) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableField
        label={label}
        value={options.find((option) => option.value === value)?.label}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        required={required}
        error={error}
        helper={helper}
        disabled={disabled}
      />
      <OptionSheet visible={open} title={label} options={options} value={value} onSelect={onChange} onClose={() => setOpen(false)} />
    </>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Date field (YYYY-MM-DD) with a calendar sheet; no native date picker needed. */
export function DateField({
  label,
  value,
  onChange,
  required,
  error,
  helper,
  maxDate,
  clearable = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  maxDate?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const days = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1).getDay();
    const total = new Date(cursor.year, cursor.month + 1, 0).getDate();
    return [...Array.from({ length: first }, () => null), ...Array.from({ length: total }, (_, index) => index + 1)];
  }, [cursor]);

  const shiftMonth = (delta: number) =>
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <>
      <PressableField
        label={label}
        value={value ? formatDate(value) : ''}
        placeholder="Select date"
        icon="calendar-outline"
        onPress={() => {
          const base = value ? new Date(`${value}T00:00:00`) : new Date();
          setCursor({ year: base.getFullYear(), month: base.getMonth() });
          setOpen(true);
        }}
        required={required}
        error={error}
        helper={helper}
      />
      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
        <View className="rounded-[14px] border border-[#ebe8e1] bg-white p-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} accessibilityLabel="Previous month" className="h-9 w-9 items-center justify-center rounded-full bg-[#f4f6fa]">
              <Ionicons name="chevron-back" size={18} color={NAVY} />
            </Pressable>
            <Text className="font-manrope-extrabold text-[14px] text-[#10243e]">
              {MONTH_NAMES[cursor.month]} {cursor.year}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={10} accessibilityLabel="Next month" className="h-9 w-9 items-center justify-center rounded-full bg-[#f4f6fa]">
              <Ionicons name="chevron-forward" size={18} color={NAVY} />
            </Pressable>
          </View>
          <View className="flex-row">
            {WEEKDAYS.map((day, index) => (
              <Text key={`${day}-${index}`} className="font-manrope-bold flex-1 text-center text-[10px] text-[#8290a1]">
                {day}
              </Text>
            ))}
          </View>
          <View className="mt-2 flex-row flex-wrap">
            {days.map((day, index) => {
              if (!day) return <View key={`blank-${index}`} style={styles.dayCell} />;
              const iso = toIsoDate(new Date(cursor.year, cursor.month, day));
              const selected = iso === value;
              const blocked = Boolean(maxDate && iso > maxDate);
              return (
                <View key={iso} style={styles.dayCell} className="items-center justify-center">
                  <Pressable
                    disabled={blocked}
                    onPress={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`h-9 w-9 items-center justify-center rounded-full ${selected ? 'bg-[#ff7a0f]' : ''}`}>
                    <Text
                      className={`font-manrope-bold text-[12px] ${selected ? 'text-white' : blocked ? 'text-[#c6ccd5]' : 'text-[#10243e]'}`}>
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
        <View className="mt-3 flex-row gap-3">
          {clearable && value ? (
            <SecondaryButton
              label="Clear"
              onPress={() => {
                onChange('');
                setOpen(false);
              }}
            />
          ) : null}
          <PrimaryButton
            label="Today"
            onPress={() => {
              onChange(toIsoDate(new Date()));
              setOpen(false);
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}

export function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-start justify-between gap-3 border-t border-[#f0eee9] py-2.5">
      <Text className="font-manrope-medium text-[11px] text-[#65728a]">{label}</Text>
      <Text className="font-manrope-bold min-w-0 flex-1 text-right text-[11px] text-[#10243e]">{value || '—'}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  softShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orangeShadow: {
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  chipRow: {
    gap: 8,
    paddingRight: 2,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
  },
});
