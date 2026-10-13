import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles, type MaterialIconName } from '@/components/ui';

export function ListHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1">
        <Text className="font-manrope-extrabold text-[23px] text-[#10243e]">{title}</Text>
        <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">{subtitle}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="h-10 flex-row items-center justify-center rounded-[12px] bg-[#ff7417] px-3.5" style={styles.orangeShadow}>
          <Ionicons name="add" size={21} color="white" />
          <Text className="font-manrope-extrabold ml-1.5 text-xs text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Icon + single-line label. Pass `grow` when it sits in a row and should share the width. */
export function Meta({ icon, label, grow }: { icon: MaterialIconName; label: string; grow?: boolean }) {
  return (
    <View className={`flex-row items-center ${grow ? 'min-w-0 flex-1' : ''}`}>
      <MaterialCommunityIcons name={icon} size={14} color="#53688a" />
      <Text numberOfLines={1} className="font-manrope-semibold ml-1.5 min-w-0 flex-1 text-[10px] text-[#637194]">
        {label}
      </Text>
    </View>
  );
}
