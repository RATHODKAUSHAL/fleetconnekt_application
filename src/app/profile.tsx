import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const settings: { label: string; description: string; icon: MaterialIconName }[] = [
  { label: 'Business details', description: 'Company, GST and address', icon: 'office-building-outline' },
  { label: 'Notifications', description: 'Manage alerts and updates', icon: 'bell-outline' },
  { label: 'Privacy & security', description: 'Account and sign-in settings', icon: 'shield-lock-outline' },
  { label: 'Help & support', description: 'FAQs and contact support', icon: 'help-circle-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#f7f7f4]">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 94 + insets.bottom }}>
          <View className="w-full max-w-[560px] self-center px-[18px] pt-2">
            <Text className="font-manrope-extrabold text-[22px] text-[#17253a]">My Profile</Text>

            <View className="mt-5 items-center rounded-[22px] border border-[#ebe8e1] bg-white px-5 py-6" style={styles.card}>
              <View className="h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-[#fff0e5] bg-[#173d6b]">
                <Text className="font-manrope-extrabold text-2xl text-white">RK</Text>
              </View>
              <Text className="font-manrope-extrabold mt-3 text-[20px] text-[#17253a]">Rajesh Kumar</Text>
              <Text className="font-manrope-medium mt-1 text-xs text-[#748197]">rajesh@shreelogistics.in</Text>
              <View className="mt-3 flex-row items-center rounded-full bg-[#e9f7f1] px-3 py-1.5">
                <MaterialCommunityIcons name="check-decagram" size={14} color="#17806d" />
                <Text className="font-manrope-bold ml-1.5 text-[10px] text-[#17806d]">Verified account</Text>
              </View>
            </View>

            <Text className="font-manrope-extrabold mb-3 mt-6 text-[16px] text-[#17253a]">Account settings</Text>
            <View className="overflow-hidden rounded-[18px] border border-[#ebe8e1] bg-white" style={styles.card}>
              {settings.map((item, index) => (
                <Pressable
                  key={item.label}
                  className={`flex-row items-center px-4 py-4 active:bg-[#faf9f6] ${index ? 'border-t border-[#efede8]' : ''}`}>
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e5]">
                    <MaterialCommunityIcons name={item.icon} size={21} color="#f27022" />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <Text className="font-manrope-bold text-[13px] text-[#26364b]">{item.label}</Text>
                    <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#8290a1]">{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8a95a5" />
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => router.replace('/login')}
              className="mt-5 h-12 flex-row items-center justify-center rounded-[14px] border border-[#f0d6cb] bg-[#fff8f5]">
              <MaterialCommunityIcons name="logout" size={18} color="#cf5c38" />
              <Text className="font-manrope-bold ml-2 text-[12px] text-[#cf5c38]">Sign out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
