import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-shell';
import { ListHeader, Meta } from '@/components/list';
import { Banner, ChipButton, EmptyState, LoadingState, ORANGE, SearchBar, styles } from '@/components/ui';
import { useCompany } from '@/context/auth';
import { customerApi, errorMessage, type Customer } from '@/services/api';

export default function CustomersScreen() {
  const router = useRouter();
  const { token, companyId, canManage } = useCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
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
        const items = await customerApi.list(token, companyId, query);
        if (query === searchRef.current) setCustomers(items);
      } catch (issue) {
        setError(errorMessage(issue, 'Could not load customers.'));
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

  // Pick up changes made on the form screen when coming back.
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

  function confirmDelete(customer: Customer) {
    Alert.alert('Delete customer?', `This will remove ${customer.name}. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token || !companyId) return;
          setDeletingUid(customer.uid);
          try {
            await customerApi.delete(token, companyId, customer.uid);
            setCustomers((current) => current.filter((item) => item.uid !== customer.uid));
          } catch (issue) {
            Alert.alert('Could not delete customer', errorMessage(issue));
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
          title="Customers"
          subtitle="Manage your customer and company directory"
          actionLabel={canManage ? 'Add customer' : undefined}
          onAction={() => router.push('/customer-form')}
        />

        <View className="mt-4">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search customer, company, phone..." />
        </View>

        <View className="mt-3 gap-2.5">
          <Banner tone="error" message={error} />
          {loading && customers.length === 0 ? (
            <LoadingState label="Loading customers..." />
          ) : customers.length === 0 ? (
            <EmptyState
              icon="account-search-outline"
              title={search ? 'No matching customers' : 'No customers yet'}
              description={search ? 'Try another name, company or phone number.' : 'Add a customer to start building your directory.'}
              actionLabel={!search && canManage ? 'Add customer' : undefined}
              onAction={() => router.push('/customer-form')}
            />
          ) : (
            <>
              <Text className="font-manrope-semibold text-[10px] text-[#617091]">
                {customers.length} customer{customers.length === 1 ? '' : 's'}
              </Text>
              {customers.map((customer) => (
                <View key={customer.uid} className="rounded-[13px] border border-[#e3e7ed] bg-white p-3" style={styles.cardShadow}>
                  <View className="flex-row items-start">
                    <View className="h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#eaf2ff]">
                      <MaterialCommunityIcons name="account-outline" size={24} color="#3578e5" />
                    </View>
                    <View className="ml-2.5 min-w-0 flex-1">
                      <Text numberOfLines={1} className="font-manrope-extrabold text-[13px] text-[#10243e]">{customer.name}</Text>
                      <Text numberOfLines={1} className="font-manrope-semibold mt-0.5 text-[10px] text-[#617091]">
                        {customer.company_name || 'Individual customer'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                      accessibilityLabel={`Call ${customer.name}`}
                      className="h-9 w-9 items-center justify-center rounded-full bg-[#e9f7f1]">
                      <Ionicons name="call-outline" size={17} color="#17806d" />
                    </Pressable>
                  </View>
                  <View className="mt-2.5 gap-1.5">
                    <Meta icon="phone-outline" label={customer.phone} />
                    {customer.email ? <Meta icon="email-outline" label={customer.email} /> : null}
                    {customer.address ? <Meta icon="map-marker-outline" label={customer.address} /> : null}
                  </View>
                  {canManage ? (
                    <View className="mt-3 flex-row justify-end gap-2 border-t border-[#f0eee9] pt-3">
                      <ChipButton label="Edit" icon="create-outline" onPress={() => router.push({ pathname: '/customer-form', params: { uid: customer.uid } })} />
                      <ChipButton label="Delete" icon="trash-outline" tone="danger" loading={deletingUid === customer.uid} onPress={() => confirmDelete(customer)} />
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
