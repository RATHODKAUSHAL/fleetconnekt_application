import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = '#ff7417';
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center border-t border-[#e9e6df] bg-white"
      style={{ paddingBottom: Math.max(insets.bottom, 6) }}>
      <View className="h-[64px] w-full max-w-[560px] flex-row items-center justify-around bg-white px-2" style={styles.tabBar}>
        <TabLink href="/home" label="Home" icon="home" active={pathname === '/home'} />
        <TabLink
          href="/transporters"
          label="Transporters"
          icon="truck-check-outline"
          active={pathname === '/transporters'}
        />

        <Link href="/new-lr" asChild>
          <Pressable accessibilityLabel="Create new LR" className="w-[72px] items-center" style={styles.newLrButton}>
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full border-4 border-white bg-[#ff7417]" style={styles.actionButton}>
              <Ionicons name="add" size={28} color="white" />
            </View>
            <Text
              className="font-manrope-bold mt-1 text-[10px]"
              style={{ color: pathname === '/new-lr' ? ORANGE : '#26364b' }}>
              New LR
            </Text>
          </Pressable>
        </Link>

        <TabButton label="Fleet" icon="truck-outline" />
        <TabLink
          href="/profile"
          label="Profile"
          icon="account-outline"
          active={pathname === '/profile'}
        />
      </View>
    </View>
  );
}

function TabLink({
  href,
  label,
  icon,
  active,
}: {
  href: '/home' | '/transporters' | '/profile';
  label: string;
  icon: MaterialIconName;
  active: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityLabel={label} className="w-[68px] items-center py-1">
        <View className="h-8 w-10 items-center justify-center">
          <MaterialCommunityIcons name={icon} size={21} color={active ? ORANGE : '#778596'} />
        </View>
        <Text
          className="font-manrope-medium mt-0.5 text-[8px]"
          style={{ color: active ? ORANGE : '#778596' }}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function TabButton({ label, icon }: { label: string; icon: MaterialIconName }) {
  return (
    <Pressable accessibilityLabel={label} className="w-[62px] items-center py-1">
      <View className="h-8 w-10 items-center justify-center">
        <MaterialCommunityIcons name={icon} size={21} color="#778596" />
      </View>
      <Text className="font-manrope-medium mt-0.5 text-[9px] text-[#778596]">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    shadowColor: '#1f2937',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 10,
  },
  newLrButton: {
    marginTop: -18,
  },
  actionButton: {
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
