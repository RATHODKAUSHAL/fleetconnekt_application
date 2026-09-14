import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppKeyboardAwareScrollView } from '@/components/keyboard-controller';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className="items-center">
      <View className={`${compact ? 'h-14 w-14 rounded-[18px]' : 'h-[76px] w-[76px] rounded-[24px]'} items-center justify-center bg-[#fff0e5]`}>
        <MaterialCommunityIcons name="truck-fast-outline" size={compact ? 34 : 44} color="#f27022" />
      </View>
      <Text className="font-manrope-extrabold mt-4 text-[25px] tracking-[-0.8px] text-[#14253d]">
        Fleet<Text className="text-[#f27022]">Connect</Text>
      </Text>
    </View>
  );
}

export function AuthScreen({ children, showBack = false, onBack }: { children: ReactNode; showBack?: boolean; onBack?: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-[#f7f7f4]">
      <AppKeyboardAwareScrollView bottomOffset={18} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingBottom: 28 }}>
          <View className="w-full max-w-[520px] flex-1 self-center">
            <View className="h-12 justify-center">
              {showBack ? (
                <Ionicons.Button name="arrow-back" size={22} color="#14253d" backgroundColor="transparent" underlayColor="transparent" iconStyle={{ marginRight: 0 }} onPress={onBack} accessibilityLabel="Go back" />
              ) : null}
            </View>
            {children}
          </View>
      </AppKeyboardAwareScrollView>
    </SafeAreaView>
  );
}
