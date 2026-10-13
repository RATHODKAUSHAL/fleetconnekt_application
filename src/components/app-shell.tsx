import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { type Href, Redirect, usePathname, useRouter } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { AppKeyboardAwareScrollView } from '@/components/keyboard-controller';
import { NAVY, ORANGE, styles, type MaterialIconName } from '@/components/ui';
import { needsCompanyProfile, roleLabels, useAuth, useCompany } from '@/context/auth';
import { initials } from '@/lib/format';

const navigation: { label: string; href: Href; match: string[]; icon: MaterialIconName }[] = [
  { label: 'Dashboard', href: '/home', match: ['/home'], icon: 'view-dashboard-outline' },
  { label: 'Bookings', href: '/bookings', match: ['/bookings', '/booking'], icon: 'file-document-multiple-outline' },
  { label: 'Customers', href: '/customers', match: ['/customers', '/customer-form'], icon: 'account-outline' },
  { label: 'Vendors', href: '/vendors', match: ['/vendors', '/vendor-form'], icon: 'truck-outline' },
  { label: 'Verify vehicle', href: '/verify-vehicle', match: ['/verify-vehicle'], icon: 'map-marker-check-outline' },
  { label: 'Generate LR', href: '/new-lr', match: ['/new-lr'], icon: 'receipt' },
];

/** Redirects signed-out users to login and users without a company to profile setup. */
function RequireAuth({ children, allowWithoutCompany }: { children: ReactNode; allowWithoutCompany?: boolean }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f8f8f5]">
        <ActivityIndicator color={ORANGE} />
      </View>
    );
  }
  if (!token || !user) return <Redirect href="/login" />;
  if (!allowWithoutCompany && needsCompanyProfile(user)) {
    return <Redirect href={{ pathname: '/profile-edit', params: { onboarding: '1' } }} />;
  }
  return <>{children}</>;
}

/** Main screen layout: top navbar with menu + account, scrollable content and the bottom tab bar. */
export function AppScreen({
  children,
  refreshControl,
  showTabBar = true,
}: {
  children: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  showTabBar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <RequireAuth>
      <View className="flex-1 bg-[#f8f8f5]">
        <SafeAreaView edges={['top']} className="flex-1">
          <View className="w-full max-w-[560px] self-center px-[18px] pb-2 pt-1">
            <AppHeader onOpenMenu={() => setMenuOpen(true)} />
          </View>
          <AppKeyboardAwareScrollView
            bottomOffset={20}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: (showTabBar ? 98 : 28) + insets.bottom }}>
            {children}
          </AppKeyboardAwareScrollView>
        </SafeAreaView>
        {showTabBar ? <BottomTabBar /> : null}
        <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </View>
    </RequireAuth>
  );
}

/** Detail and form layout: back arrow + title, scrollable content and an optional sticky footer. */
export function SubScreen({
  title,
  children,
  footer,
  right,
  onBack,
  refreshControl,
  allowWithoutCompany,
  hideBack,
  subheader,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Fixed content between the title bar and the scroll area (e.g. a stepper). */
  subheader?: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  refreshControl?: ReactElement<RefreshControlProps>;
  allowWithoutCompany?: boolean;
  hideBack?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <RequireAuth allowWithoutCompany={allowWithoutCompany}>
      <View className="flex-1 bg-[#f8f8f5]">
        <SafeAreaView edges={['top']} className="flex-1">
          <View className="w-full max-w-[560px] flex-1 self-center">
            <View className="h-14 flex-row items-center px-[18px]">
              {hideBack ? null : (
                <Pressable onPress={goBack} accessibilityLabel="Go back" className="-ml-2 h-10 w-10 items-center justify-center rounded-full">
                  <Ionicons name="arrow-back" size={25} color={NAVY} />
                </Pressable>
              )}
              <Text numberOfLines={1} className={`font-manrope-extrabold min-w-0 flex-1 text-[19px] text-[#10243e] ${hideBack ? '' : 'ml-2'}`}>
                {title}
              </Text>
              {right}
            </View>
            {subheader ? <View className="px-[18px]">{subheader}</View> : null}
            <AppKeyboardAwareScrollView
              bottomOffset={20}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
              contentContainerStyle={{ paddingBottom: (footer ? 106 : 28) + insets.bottom, paddingHorizontal: 18, paddingTop: 4 }}>
              {children}
            </AppKeyboardAwareScrollView>
          </View>
        </SafeAreaView>
        {footer}
      </View>
    </RequireAuth>
  );
}

export function AppHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <View className="flex-row items-center justify-between">
      <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
        <Pressable
          onPress={onOpenMenu}
          accessibilityLabel="Open menu"
          className="h-9 w-9 items-center justify-center rounded-xl bg-white"
          style={styles.softShadow}>
          <Ionicons name="menu" size={22} color={NAVY} />
        </Pressable>
        <Pressable onPress={() => router.replace('/home')} accessibilityLabel="Go to dashboard" className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#fff0e5]">
            <MaterialCommunityIcons name="truck-fast-outline" size={23} color={ORANGE} />
          </View>
          <Text className="font-manrope-extrabold text-[19px] tracking-[-0.5px] text-[#142238]">
            Fleet<Text className="font-manrope-extrabold text-[#f27022]">Connekt</Text>
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setAccountOpen(true)}
        accessibilityLabel="Open account menu"
        className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#173d6b]"
        style={styles.softShadow}>
        <Text className="font-manrope-extrabold text-[12px] text-white">{initials(user?.name || user?.email)}</Text>
      </Pressable>

      <AccountMenu visible={accountOpen} onClose={() => setAccountOpen(false)} />
    </View>
  );
}

function AccountMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { isOwner } = useCompany();
  const [loggingOut, setLoggingOut] = useState(false);

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  async function logout() {
    setLoggingOut(true);
    await signOut();
    setLoggingOut(false);
    onClose();
    router.replace('/login');
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/20" onPress={onClose} accessibilityLabel="Close account menu">
        <View
          className="absolute right-[18px] w-[250px] overflow-hidden rounded-[16px] border border-[#ebe8e1] bg-white"
          style={[styles.cardShadow, { top: insets.top + 50 }]}>
          <View className="border-b border-[#efede8] px-4 py-3">
            <Text className="font-manrope-bold text-[9px] uppercase tracking-[1.2px] text-[#8290a1]">Signed in as</Text>
            <Text numberOfLines={1} className="font-manrope-bold mt-1 text-[12px] text-[#10243e]">
              {user?.name || user?.email}
            </Text>
            {user?.name ? (
              <Text numberOfLines={1} className="font-manrope-medium mt-0.5 text-[10px] text-[#617091]">
                {user.email}
              </Text>
            ) : null}
          </View>
          <View className="p-1.5">
            <MenuRow icon="cog-outline" label="Settings" onPress={() => go('/settings')} />
            {isOwner ? <MenuRow icon="account-group-outline" label="Teams" onPress={() => go('/teams')} /> : null}
            <MenuRow icon="logout" label={loggingOut ? 'Logging out...' : 'Logout'} danger onPress={logout} disabled={loggingOut} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  disabled,
}: {
  icon: MaterialIconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className="h-11 flex-row items-center rounded-[10px] px-3 active:bg-[#faf9f6]">
      <MaterialCommunityIcons name={icon} size={19} color={danger ? '#cf5c38' : NAVY} />
      <Text className={`font-manrope-bold ml-3 text-[13px] ${danger ? 'text-[#cf5c38]' : 'text-[#26364b]'}`}>{label}</Text>
    </Pressable>
  );
}

function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { companyName, role } = useCompany();
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start(() => {
      if (!visible) setMounted(false);
    });
  }, [slide, visible]);

  const go = (href: Href) => {
    onClose();
    router.replace(href);
  };

  async function logout() {
    onClose();
    await signOut();
    router.replace('/login');
  }

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* Animated.View is not a NativeWind component, so it is styled with plain style objects. */}
      <Animated.View style={[menuStyles.backdrop, { opacity: slide }]}>
        <Pressable style={menuStyles.fill} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View
        style={[
          menuStyles.panel,
          styles.cardShadow,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-MENU_WIDTH - 20, 0] }) }],
          },
        ]}>
        <View className="flex-row items-center justify-between border-b border-[#efede8] px-4 pb-4">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#fff0e5]">
              <MaterialCommunityIcons name="truck-fast-outline" size={23} color={ORANGE} />
            </View>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="font-manrope-extrabold text-[16px] text-[#142238]">
                {companyName || (
                  <>
                    Fleet<Text className="text-[#f27022]">Connekt</Text>
                  </>
                )}
              </Text>
              <Text className="font-manrope-semibold text-[10px] text-[#617091]">{role ? roleLabels[role] : 'Member'}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close menu" className="h-8 w-8 items-center justify-center rounded-full bg-[#f4f6fa]">
            <Ionicons name="close" size={18} color={NAVY} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 12, gap: 4 }}>
          {navigation.map((item) => {
            const active = item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));
            return (
              <Pressable
                key={item.label}
                onPress={() => go(item.href)}
                className={`h-12 flex-row items-center rounded-[12px] px-3 ${active ? 'bg-[#fff0e5]' : 'active:bg-[#faf9f6]'}`}>
                <MaterialCommunityIcons name={item.icon} size={21} color={active ? ORANGE : '#53688a'} />
                <Text className={`font-manrope-bold ml-3 text-[13px] ${active ? 'text-[#f27022]' : 'text-[#26364b]'}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="border-t border-[#efede8] px-4 pt-3">
          <Text numberOfLines={1} className="font-manrope-bold text-[12px] text-[#10243e]">
            {user?.name || user?.email}
          </Text>
          {user?.name ? (
            <Text numberOfLines={1} className="font-manrope-medium text-[10px] text-[#617091]">
              {user.email}
            </Text>
          ) : null}
          <Pressable
            onPress={logout}
            className="mt-3 h-11 flex-row items-center justify-center rounded-[12px] border border-[#f0d6cb] bg-[#fff8f5]">
            <MaterialCommunityIcons name="logout" size={18} color="#cf5c38" />
            <Text className="font-manrope-bold ml-2 text-[12px] text-[#cf5c38]">Logout</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const MENU_WIDTH = 282;

const menuStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fill: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: MENU_WIDTH,
    maxWidth: '85%',
    backgroundColor: '#ffffff',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
});
