import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { SubScreen } from '@/components/app-shell';
import { Meta } from '@/components/list';
import { Banner, EmptyState, LoadingState, ORANGE, Pill, styles } from '@/components/ui';
import { roleLabels, useCompany } from '@/context/auth';
import { errorMessage, teamApi, type CompanyMember } from '@/services/api';

function OwnerOnlyNotice() {
  return (
    <EmptyState
      icon="shield-lock-outline"
      title="Only the company owner can manage teams"
      description="Ask your company owner to add or update team members."
    />
  );
}

export default function TeamsScreen() {
  const router = useRouter();
  const { token, isOwner, ownedCompanyId } = useCompany();
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !ownedCompanyId) return;
    try {
      setError(null);
      setMembers(await teamApi.list(token, ownedCompanyId));
    } catch (issue) {
      setError(errorMessage(issue, 'Could not load team members.'));
    }
  }, [ownedCompanyId, token]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const addButton = isOwner && ownedCompanyId ? (
    <Pressable onPress={() => router.push('/team-form')} className="h-10 flex-row items-center rounded-[12px] bg-[#ff7417] px-3" style={styles.orangeShadow}>
      <Ionicons name="add" size={19} color="white" />
      <Text className="font-manrope-extrabold ml-1 text-xs text-white">Add member</Text>
    </Pressable>
  ) : undefined;

  return (
    <SubScreen title="Teams" right={addButton} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}>
      {!isOwner ? (
        <OwnerOnlyNotice />
      ) : !ownedCompanyId ? (
        <Banner tone="warning" message="A company profile is required before team members can be loaded." />
      ) : loading ? (
        <LoadingState label="Loading team members..." />
      ) : (
        <View className="gap-2.5">
          <Banner tone="error" message={error} />
          {members.length === 0 ? (
            <EmptyState
              icon="account-group-outline"
              title="No team members yet"
              description="Add people from your company so they can work in FleetConnekt."
              actionLabel="Add member"
              onAction={() => router.push('/team-form')}
            />
          ) : (
            members.map((member) => (
              <View key={member.uid} className="rounded-[13px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
                <View className="flex-row items-start">
                  <View className="h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#eaf2ff]">
                    <MaterialCommunityIcons name={member.role === 'owner' ? 'crown-outline' : 'account-outline'} size={23} color="#3578e5" />
                  </View>
                  <View className="ml-2.5 min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-manrope-extrabold text-[13px] text-[#10243e]">{member.user?.name || '-'}</Text>
                    <Text className="font-manrope-semibold mt-0.5 text-[10px] text-[#f27022]">{roleLabels[member.role] ?? member.role}</Text>
                  </View>
                  {member.is_active ? <Pill label="Active" bg="#d9f3ec" color="#0b876f" /> : <Pill label="Inactive" bg="#eef0f3" color="#617091" />}
                </View>
                <View className="mt-2.5 gap-1.5">
                  <Meta icon="email-outline" label={member.user?.email || '-'} />
                  <Meta icon="phone-outline" label={member.user?.mobile || '-'} />
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </SubScreen>
  );
}
