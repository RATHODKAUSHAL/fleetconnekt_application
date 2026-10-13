import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { ORANGE, styles, type MaterialIconName } from '@/components/ui';
import { useCompany } from '@/context/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { isOwner } = useCompany();

  const sections: { label: string; description: string; icon: MaterialIconName; href: Href }[] = [
    { label: 'Profile', description: 'Your account details, company details and services', icon: 'account-circle-outline', href: '/profile' },
    { label: 'Booking prefix', description: 'Set the 2-character prefix and next number for new bookings', icon: 'pound', href: '/booking-prefix' },
    ...(isOwner
      ? [{ label: 'Teams', description: 'Add people from your company and assign roles', icon: 'account-group-outline' as const, href: '/teams' as Href }]
      : []),
  ];

  return (
    <SubScreen title="Settings">
      <Text className="font-manrope-medium mb-4 text-[11px] text-[#617091]">Manage your profile and how new bookings are numbered.</Text>
      <View className="overflow-hidden rounded-[18px] border border-[#ebe8e1] bg-white" style={styles.cardShadow}>
        {sections.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.href)}
            className={`flex-row items-center px-4 py-4 active:bg-[#faf9f6] ${index ? 'border-t border-[#efede8]' : ''}`}>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e5]">
              <MaterialCommunityIcons name={item.icon} size={21} color={ORANGE} />
            </View>
            <View className="ml-3 min-w-0 flex-1">
              <Text className="font-manrope-bold text-[13px] text-[#26364b]">{item.label}</Text>
              <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#8290a1]">{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8a95a5" />
          </Pressable>
        ))}
      </View>
    </SubScreen>
  );
}
