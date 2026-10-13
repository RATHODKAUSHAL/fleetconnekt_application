import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-shell';
import { ListHeader, Meta } from '@/components/list';
import { Banner, ChipButton, EmptyState, LoadingState, ORANGE, Pill, SearchBar, styles } from '@/components/ui';
import { useCompany } from '@/context/auth';
import { errorMessage, vendorApi, type Vendor } from '@/services/api';

export default function VendorsScreen() {
  const router = useRouter();
  const { token, companyId, canManage } = useCompany();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  const load = useCallback(
    async (query: string) => {
      if (!token || !companyId) return;
      try {
        setError(null);
        const items = await vendorApi.list(token, companyId, query);
        if (query === searchRef.current) setVendors(items);
      } catch (issue) {
        setError(errorMessage(issue, 'Could not load vendors.'));
      }
    },
    [companyId, token],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      load(search).finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useFocusEffect(
    useCallback(() => {
      void load(searchRef.current);
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  };

  function confirmDelete(vendor: Vendor) {
    Alert.alert('Delete vendor?', `This will remove ${vendor.name} from your company. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token || !companyId) return;
          setDeletingUid(vendor.uid);
          try {
            await vendorApi.delete(token, companyId, vendor.uid);
            setVendors((current) => current.filter((item) => item.uid !== vendor.uid));
          } catch (issue) {
            Alert.alert('Could not delete vendor', errorMessage(issue));
          } finally {
            setDeletingUid(null);
          }
        },
      },
    ]);
  }

  return (
    <AppScreen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}>
      <View className="w-full max-w-[560px] self-center px-[18px] pt-3">
        <ListHeader
          title="Vendors"
          subtitle="Add and update your vendor partners"
          actionLabel={canManage ? 'Add vendor' : undefined}
          onAction={() => router.push('/vendor-form')}
        />

        <View className="mt-4">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search vendor, company, phone, email..." />
        </View>

        <View className="mt-3 gap-2.5">
          <Banner tone="error" message={error} />
          {loading && vendors.length === 0 ? (
            <LoadingState label="Loading vendors..." />
          ) : vendors.length === 0 ? (
            <EmptyState
              icon="truck-outline"
              title={search ? 'No matching vendors' : 'No vendors yet'}
              description={search ? 'Try another name, company, phone or email.' : 'Add vendor partners to assign them to bookings.'}
              actionLabel={!search && canManage ? 'Add vendor' : undefined}
              onAction={() => router.push('/vendor-form')}
            />
          ) : (
            <>
              <Text className="font-manrope-semibold text-[10px] text-[#617091]">
                {vendors.length} vendor{vendors.length === 1 ? '' : 's'}
              </Text>
              {vendors.map((vendor) => (
                <View key={vendor.uid} className="rounded-[13px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
                  <View className="flex-row items-start">
                    <View className="h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#e9f7f1]">
                      <MaterialCommunityIcons name="truck-outline" size={24} color="#17806d" />
                    </View>
                    <View className="ml-2.5 min-w-0 flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text numberOfLines={1} className="font-manrope-extrabold shrink text-[13px] text-[#10243e]">{vendor.name}</Text>
                        {vendor.is_active ? (
                          <Pill label="Active" bg="#d9f3ec" color="#0b876f" />
                        ) : (
                          <Pill label="Inactive" bg="#eef0f3" color="#617091" />
                        )}
                      </View>
                      <Text numberOfLines={1} className="font-manrope-semibold mt-0.5 text-[10px] text-[#617091]">{vendor.company_name}</Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${vendor.mobile || vendor.phone}`)}
                      accessibilityLabel={`Call ${vendor.name}`}
                      className="h-9 w-9 items-center justify-center rounded-full bg-[#e9f7f1]">
                      <Ionicons name="call-outline" size={17} color="#17806d" />
                    </Pressable>
                  </View>
                  <View className="mt-2.5 gap-1.5">
                    <Meta icon="phone-outline" label={vendor.mobile || vendor.phone} />
                    {vendor.email ? <Meta icon="email-outline" label={vendor.email} /> : null}
                  </View>
                  {canManage ? (
                    <View className="mt-3 flex-row justify-end gap-2 border-t border-[#f0eee9] pt-3">
                      <ChipButton label="Edit" icon="create-outline" onPress={() => router.push({ pathname: '/vendor-form', params: { uid: vendor.uid } })} />
                      <ChipButton label="Delete" icon="trash-outline" tone="danger" loading={deletingUid === vendor.uid} onPress={() => confirmDelete(vendor)} />
                    </View>
                  ) : null}
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </AppScreen>
  );
}
