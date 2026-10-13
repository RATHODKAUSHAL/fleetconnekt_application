import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { InfoRow, ORANGE, Section, styles } from '@/components/ui';
import { roleLabels, useAuth } from '@/context/auth';
import { initials } from '@/lib/format';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshUser, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const company = user?.companies?.[0];
  const membership = user?.memberships?.[0];

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser().catch(() => undefined);
    setRefreshing(false);
  }, [refreshUser]);

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SubScreen title="My Profile" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}>
      <View className="items-center rounded-[22px] border border-[#ebe8e1] bg-white px-5 py-6" style={styles.cardShadow}>
        <View className="h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-[#fff0e5] bg-[#173d6b]">
          <Text className="font-manrope-extrabold text-2xl text-white">{initials(user?.name || user?.email)}</Text>
        </View>
        <Text className="font-manrope-extrabold mt-3 text-[20px] text-[#17253a]">{user?.name || 'Add your name'}</Text>
        <Text className="font-manrope-medium mt-1 text-xs text-[#748197]">{user?.email}</Text>
        <View className="mt-3 flex-row flex-wrap justify-center gap-2">
          {user?.email_verified_at ? (
            <View className="flex-row items-center rounded-full bg-[#e9f7f1] px-3 py-1.5">
              <MaterialCommunityIcons name="check-decagram" size={14} color="#17806d" />
              <Text className="font-manrope-bold ml-1.5 text-[10px] text-[#17806d]">Verified account</Text>
            </View>
          ) : null}
          {user?.role ? (
            <View className="flex-row items-center rounded-full bg-[#fff0e5] px-3 py-1.5">
              <MaterialCommunityIcons name="shield-account-outline" size={14} color={ORANGE} />
              <Text className="font-manrope-bold ml-1.5 text-[10px] text-[#f27022]">{roleLabels[user.role]}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push('/profile-edit')}
          className="mt-4 h-10 flex-row items-center rounded-[12px] bg-[#ff7417] px-4"
          style={styles.orangeShadow}>
          <MaterialCommunityIcons name="account-edit-outline" size={18} color="white" />
          <Text className="font-manrope-extrabold ml-1.5 text-xs text-white">Update profile</Text>
        </Pressable>
      </View>

      <View className="mt-4 gap-3">
        <Section icon="account-outline" title="User details">
          <InfoRow label="Name" value={user?.name} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Mobile" value={user?.mobile} />
        </Section>

        <Section icon="office-building-outline" title="Company details">
          {company ? (
            <>
              <InfoRow label="Company name" value={company.name} />
              <InfoRow label="Company phone" value={company.phone} />
              <InfoRow label="Company email" value={company.email} />
              <InfoRow label="Website" value={company.website} />
              <InfoRow label="State" value={company.state?.name} />
              <InfoRow label="City" value={company.city?.name} />
            </>
          ) : membership ? (
            <>
              <InfoRow label="Company name" value={membership.name} />
              <InfoRow label="Your role" value={roleLabels[membership.role]} />
            </>
          ) : (
            <Text className="font-manrope-medium text-[11px] text-[#617091]">No company added yet.</Text>
          )}
        </Section>

        {company ? (
          <Section icon="truck-cargo-container" title="Services">
            {company.services?.length ? (
              <View className="flex-row flex-wrap gap-1.5">
                {company.services.map((service) => (
                  <View key={`s-${service.id}`} className="rounded-full bg-[#fff0e5] px-2.5 py-1">
                    <Text className="font-manrope-bold text-[10px] text-[#f27022]">{service.name}</Text>
                  </View>
                ))}
                {company.service_types?.map((type) => (
                  <View key={`t-${type.id}`} className="rounded-full bg-[#f4f6fa] px-2.5 py-1">
                    <Text className="font-manrope-semibold text-[10px] text-[#26364b]">{type.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="font-manrope-medium text-[11px] text-[#617091]">No services selected yet.</Text>
            )}
          </Section>
        ) : null}

        <Pressable onPress={logout} className="h-12 flex-row items-center justify-center rounded-[14px] border border-[#f0d6cb] bg-[#fff8f5]">
          <MaterialCommunityIcons name="logout" size={18} color="#cf5c38" />
          <Text className="font-manrope-bold ml-2 text-[12px] text-[#cf5c38]">Sign out</Text>
        </Pressable>
      </View>
    </SubScreen>
  );
}
