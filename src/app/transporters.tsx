import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppKeyboardAwareScrollView } from '@/components/keyboard-controller';
import { transporters, type Transporter } from '@/data/transporters';

const ORANGE = '#ff7417';
const TRUCK_IMAGE = require('@/assets/images/App-Images/ChatGPT Image Aug 22, 2026, 02_46_02 PM.png');
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type FilterKind = 'state' | 'city' | 'company';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function TransportersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string | string[]; state?: string | string[]; city?: string | string[] }>();
  const routeQuery = readParam(params.query);
  const routeState = readParam(params.state);
  const routeCity = readParam(params.city);
  const [query, setQuery] = useState(routeQuery);
  const [selectedState, setSelectedState] = useState(routeState || 'All');
  const [selectedCity, setSelectedCity] = useState(routeCity || 'All');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [activeFilter, setActiveFilter] = useState<FilterKind | null>(null);

  useEffect(() => {
    setQuery(routeQuery);
    setSelectedState(routeState || 'All');
    setSelectedCity(routeCity || 'All');
    setSelectedCompany('All');
  }, [routeCity, routeQuery, routeState]);

  const stateOptions = useMemo(
    () => ['All', ...Array.from(new Set(transporters.flatMap((item) => item.serviceStates))).sort()],
    [],
  );

  const cityOptions = useMemo(() => {
    const candidates = selectedState === 'All'
      ? transporters
      : transporters.filter((item) => item.serviceStates.includes(selectedState));
    return ['All', ...Array.from(new Set(candidates.flatMap((item) => item.serviceCities))).sort()];
  }, [selectedState]);

  const companyOptions = useMemo(() => {
    const candidates = transporters.filter((item) => {
      const matchesState = selectedState === 'All' || item.serviceStates.includes(selectedState);
      const matchesCity = selectedCity === 'All' || item.serviceCities.includes(selectedCity);
      return matchesState && matchesCity;
    });
    return ['All', ...candidates.map((item) => item.name).sort()];
  }, [selectedCity, selectedState]);

  const filteredTransporters = useMemo(() => {
    const search = query.trim().toLowerCase();
    return transporters
      .filter((item) => {
        const matchesState = selectedState === 'All' || item.serviceStates.includes(selectedState);
        const matchesCity = selectedCity === 'All' || item.serviceCities.includes(selectedCity);
        const matchesCompany = selectedCompany === 'All' || item.name === selectedCompany;
        const searchable = [
          item.name,
          item.gst,
          item.from,
          item.state,
          ...item.services,
          ...item.serviceCities,
          ...item.serviceStates,
        ].join(' ').toLowerCase();
        return matchesState && matchesCity && matchesCompany && (!search || searchable.includes(search));
      })
      .sort((a, b) => Number(b.rating) - Number(a.rating));
  }, [query, selectedCity, selectedCompany, selectedState]);

  const hasFilters = Boolean(query.trim()) || selectedState !== 'All' || selectedCity !== 'All' || selectedCompany !== 'All';
  const options = activeFilter === 'state' ? stateOptions : activeFilter === 'city' ? cityOptions : companyOptions;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedState('All');
    setSelectedCity('All');
    setSelectedCompany('All');
  };

  const selectOption = (value: string) => {
    if (activeFilter === 'state') {
      setSelectedState(value);
      setSelectedCity('All');
      setSelectedCompany('All');
    } else if (activeFilter === 'city') {
      setSelectedCity(value);
      setSelectedCompany('All');
    } else if (activeFilter === 'company') {
      setSelectedCompany(value);
    }
    setActiveFilter(null);
  };

  return (
    <View className="flex-1 bg-[#f8f8f5]">
      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <AppKeyboardAwareScrollView
          bottomOffset={18}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
          <View className="w-full max-w-[560px] flex-1 self-center px-[18px] pt-2">
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable accessibilityLabel="Go back" onPress={goBack} className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <Ionicons name="arrow-back" size={22} color="#17253a" />
              </Pressable>
              <Text className="font-manrope-extrabold text-[18px] text-[#17253a]">Transporter Directory</Text>
              <Pressable
                accessibilityLabel={hasFilters ? 'Clear transporter filters' : 'Transporter filters'}
                onPress={hasFilters ? clearFilters : undefined}
                className={`h-10 w-10 items-center justify-center rounded-full ${hasFilters ? 'bg-[#fff0e5]' : 'bg-white'}`}>
                <MaterialCommunityIcons name={hasFilters ? 'filter-remove-outline' : 'filter-variant'} size={23} color={hasFilters ? ORANGE : '#17253a'} />
              </Pressable>
            </View>

            <View className="h-[48px] flex-row items-center rounded-[14px] border border-[#e7e5df] bg-white px-3.5" style={styles.softShadow}>
              <Ionicons name="search-outline" size={19} color="#718096" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search transporter, GST, city..."
                placeholderTextColor="#8490a1"
                autoCorrect={false}
                className="font-manrope-medium ml-2 flex-1 text-xs text-[#17253a]"
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#9aa4b2" />
                </Pressable>
              ) : null}
            </View>

            <View className="mt-3 flex-row gap-2">
              <FilterCard label="State Name" value={selectedState} icon="map-outline" onPress={() => setActiveFilter('state')} />
              <FilterCard label="City Name" value={selectedCity} icon="city-variant-outline" onPress={() => setActiveFilter('city')} />
              <FilterCard label="Company Name" value={selectedCompany} icon="office-building-outline" onPress={() => setActiveFilter('company')} />
            </View>

            <View className="mb-2.5 mt-3.5 flex-row items-center justify-between">
              <Text className="font-manrope-medium text-[10px] text-[#56667a]">
                Showing <Text className="font-manrope-bold text-[#17253a]">{filteredTransporters.length} verified</Text> {filteredTransporters.length === 1 ? 'transporter' : 'transporters'}
              </Text>
              <View className="flex-row items-center rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
                <Text className="font-manrope-medium text-[9px] text-[#7a8797]">Sort: </Text>
                <Text className="font-manrope-bold text-[9px] text-[#26364b]">Rating</Text>
              </View>
            </View>

            {filteredTransporters.length ? (
              <View className="gap-3">
                {filteredTransporters.map((item, index) => (
                  <DirectoryCard
                    key={item.id}
                    {...item}
                    imagePosition={index % 2 === 0 ? 'center' : 'right'}
                    onPress={() => router.push({ pathname: '/transporter/[id]', params: { id: item.id } })}
                  />
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-16">
                <MaterialCommunityIcons name="truck-alert-outline" size={44} color="#9aa4b2" />
                <Text className="font-manrope-extrabold mt-3 text-[15px] text-[#26364b]">No transporters found</Text>
                <Text className="font-manrope-medium mt-1 text-center text-[11px] text-[#8290a1]">Try changing your state, city, company, or search.</Text>
                <Pressable onPress={clearFilters} className="mt-4 rounded-xl bg-[#fff0e5] px-4 py-2.5">
                  <Text className="font-manrope-bold text-[11px] text-[#f27022]">Clear filters</Text>
                </Pressable>
              </View>
            )}
          </View>
        </AppKeyboardAwareScrollView>
      </SafeAreaView>

      <FilterPicker
        visible={activeFilter !== null}
        title={activeFilter === 'state' ? 'Select state' : activeFilter === 'city' ? 'Select city' : 'Select company'}
        options={options}
        selected={activeFilter === 'state' ? selectedState : activeFilter === 'city' ? selectedCity : selectedCompany}
        onSelect={selectOption}
        onClose={() => setActiveFilter(null)}
      />
    </View>
  );
}

function FilterCard({ label, value, icon, onPress }: { label: string; value: string; icon: MaterialIconName; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="min-w-0 flex-1 rounded-[13px] border border-[#e9e7e2] bg-white px-2.5 py-2.5" style={styles.softShadow}>
      <View className="mb-0.5 flex-row items-center">
        <MaterialCommunityIcons name={icon} size={11} color="#7a899b" />
        <Text className="font-manrope-medium ml-1 text-[8px] text-[#7a899b]">{label}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="font-manrope-bold min-w-0 flex-1 text-[10px] text-[#26364b]" numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={12} color="#748397" />
      </View>
    </Pressable>
  );
}

function FilterPicker({ visible, title, options, selected, onSelect, onClose }: { visible: boolean; title: string; options: string[]; selected: string; onSelect: (value: string) => void; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/35">
        <Pressable onPress={(event) => event.stopPropagation()} className="max-h-[72%] rounded-t-[24px] bg-[#f8f8f5]">
          <SafeAreaView edges={['bottom']}>
            <View className="flex-row items-center justify-between border-b border-[#e8e6e1] px-5 py-4">
              <Text className="font-manrope-extrabold text-[17px] text-[#17253a]">{title}</Text>
              <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-white">
                <Ionicons name="close" size={19} color="#52657a" />
              </Pressable>
            </View>
            <AppKeyboardAwareScrollView bottomOffset={12} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 10 }}>
              {options.map((option) => (
                <Pressable key={option} onPress={() => onSelect(option)} className="flex-row items-center border-b border-[#eceae5] px-2 py-4">
                  <Text className={`font-manrope-semibold min-w-0 flex-1 text-[13px] ${selected === option ? 'text-[#f27022]' : 'text-[#26364b]'}`}>{option}</Text>
                  {selected === option ? <Ionicons name="checkmark-circle" size={20} color={ORANGE} /> : null}
                </Pressable>
              ))}
            </AppKeyboardAwareScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DirectoryCard({ name, rating, reviews, gst, services, from, destinations, since, imagePosition, onPress }: Transporter & { imagePosition: 'center' | 'right'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${name}`} onPress={onPress} className="overflow-hidden rounded-[16px] border border-[#e7e5df] bg-white active:opacity-90" style={styles.cardShadow}>
      <View className="flex-row p-3">
        <Image source={TRUCK_IMAGE} contentFit="cover" contentPosition={imagePosition} transition={200} style={styles.profileImage} />
        <View className="ml-3 min-w-0 flex-1">
          <View className="flex-row items-start justify-between">
            <View className="min-w-0 flex-1 pr-1">
              <View className="flex-row items-center">
                <Text className="font-manrope-extrabold mr-2 min-w-0 flex-1 text-xs text-[#17253a]" numberOfLines={1}>{name}</Text>
                <View className="rounded-full bg-[#1689e7] px-2 py-0.5"><Text className="font-manrope-bold text-[7px] text-white">Verified</Text></View>
              </View>
              <View className="mt-1 flex-row items-center">
                <Ionicons name="star" size={12} color={ORANGE} />
                <Text className="font-manrope-bold ml-1 text-[9px] text-[#26364b]">{rating}</Text>
                <Text className="font-manrope ml-1 text-[9px] text-[#7d8998]">({reviews})</Text>
              </View>
              <Text className="font-manrope-medium mt-1 text-[8px] text-[#65758a]"><Text className="font-manrope-bold text-[#32445a]">GST:</Text> {gst}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#748397" />
          </View>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {services.slice(0, 3).map((service) => <Pill key={service}>{service}</Pill>)}
          </View>
        </View>
      </View>
      <View className="mx-3 flex-row items-center justify-between border-t border-[#f0eee9] py-2.5">
        <View className="min-w-0 flex-1 flex-row items-center pr-2">
          <Text className="font-manrope-semibold text-[9px] text-[#53657a]">{from}</Text>
          <Ionicons name="arrow-forward" size={12} color="#53657a" style={{ marginHorizontal: 5 }} />
          <Text className="font-manrope-medium flex-1 text-[8px] text-[#6e7d90]" numberOfLines={1}>{destinations}</Text>
        </View>
        <Text className="font-manrope-medium text-[8px] text-[#8290a1]">Since {since}</Text>
      </View>
    </Pressable>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <View className="rounded-md bg-[#f1f4f7] px-2 py-1"><Text className="font-manrope-semibold text-[8px] text-[#5e6e81]">{children}</Text></View>;
}

const styles = StyleSheet.create({
  softShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },
  cardShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  profileImage: {
    width: 78,
    height: 82,
    borderRadius: 12,
  },
});
