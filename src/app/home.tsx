import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppScreen } from '@/components/app-shell';
import { SITE_URL } from '@/config';
import { publicApi, type ApiTransporter, type Location } from '@/services/api';

const ORANGE = '#ff7417';
const NAVY = '#10243e';
const TRUCK_IMAGE = require('@/assets/images/App-Images/ChatGPT Image Aug 22, 2026, 02_46_02 PM.png');
const CITY_TINTS = ['#fff2e7', '#eaf2ff', '#f3eaff', '#e9f7f1', '#fff0ef', '#eef7e9'];

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const stats: { icon: MaterialIconName; value: string; label: string; color: string }[] = [
  { icon: 'account-group-outline', value: '1,000+', label: 'Verified Transporters', color: ORANGE },
  { icon: 'file-document-outline', value: '50,000+', label: 'LRs Generated', color: NAVY },
  { icon: 'map-marker-outline', value: '250+', label: 'Cities Covered', color: '#17806d' },
];

const workspace: { label: string; description: string; href: Href; icon: MaterialIconName; color: string }[] = [
  { label: 'Bookings', description: 'Create and manage truck bookings', href: '/bookings', icon: 'file-document-multiple-outline', color: ORANGE },
  { label: 'Customers', description: 'Customer and company details', href: '/customers', icon: 'account-outline', color: '#3578e5' },
  { label: 'Vendors', description: 'Add and update vendor partners', href: '/vendors', icon: 'truck-outline', color: '#17806d' },
  { label: 'Verify vehicle', description: 'Fetch VAHAN / RC details', href: '/verify-vehicle', icon: 'map-marker-check-outline', color: '#7a4fd6' },
];

const CITY_CARD_WIDTH = 164;
const CITY_GAP = 12;

function openWebsite(path: string) {
  void WebBrowser.openBrowserAsync(`${SITE_URL}${path}`);
}

export default function HomeRoute() {
  const [transporters, setTransporters] = useState<ApiTransporter[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [citiesError, setCitiesError] = useState(false);

  const load = useCallback(async () => {
    const [homeResult, citiesResult] = await Promise.allSettled([publicApi.home(), publicApi.featuredCities()]);
    if (homeResult.status === 'fulfilled') setTransporters(homeResult.value.featured_transporters);
    if (citiesResult.status === 'fulfilled') setCities(citiesResult.value);
    setCitiesError(citiesResult.status === 'rejected');
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <AppScreen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={ORANGE} />}>
      <View className="w-full max-w-[560px] self-center px-[18px]">
        <Greeting />

        <HeroCard />

        <View className="mt-4 flex-row gap-2.5">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </View>

        <Text className="font-manrope-extrabold mb-2.5 mt-5 text-[17px] text-[#17253a]">Your Workspace</Text>
        <View className="flex-row flex-wrap justify-between gap-y-2.5">
          {workspace.map((item) => (
            <WorkspaceCard key={item.label} {...item} />
          ))}
        </View>

        <View className="mb-2.5 mt-5 flex-row items-center justify-between">
          <Text className="font-manrope-extrabold text-[17px] text-[#17253a]">Featured Transporters</Text>
          <Pressable hitSlop={10} onPress={() => openWebsite('/transporters')}>
            <Text className="font-manrope-bold text-xs text-[#f08a3c]">View All</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="h-[150px] items-center justify-center">
          <ActivityIndicator color={ORANGE} />
        </View>
      ) : transporters.length === 0 ? (
        <View className="mx-[18px] rounded-[16px] border border-[#ebe8e1] bg-white px-4 py-5" style={styles.card}>
          <Text className="font-manrope-semibold text-center text-[11px] text-[#7b8797]">Featured transporters will appear here.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.transporterList}>
          {transporters.map((transporter) => (
            <TransporterCard key={transporter.id} transporter={transporter} />
          ))}
        </ScrollView>
      )}

      <CityMarquee cities={cities} loading={loading} error={citiesError} onRetry={refresh} />
    </AppScreen>
  );
}

function Greeting() {
  return (
    <View className="mb-3.5 mt-2">
      <View className="flex-row items-center gap-1.5">
        {/* Here is a greetig but it looks bad so i remove */}
      </View>
    </View>
  );
}

function HeroCard() {
  const [query, setQuery] = useState('');

  const search = () => {
    const value = query.trim();
    openWebsite(value ? `/transporters?search=${encodeURIComponent(value)}` : '/transporters');
  };

  return (
    <View className="overflow-hidden rounded-[20px] bg-[#102844] px-4 pb-3.5 pt-4" style={styles.hero}>
      <Image
        source={TRUCK_IMAGE}
        contentFit="cover"
        contentPosition="center"
        transition={250}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-0 bg-black/35" />
      <View className="min-h-[112px] flex-row">
        <View className="w-[79%]">
          <Text className="font-manrope-bold text-[18px] leading-[25px] text-white">
            Find Verified Transporters &amp; Generate Digital LR
          </Text>
          <Text className="font-manrope-semibold mt-2 text-xs text-[#eef4fa]">
            Fast&nbsp; • &nbsp;Reliable&nbsp; • &nbsp;Paperless
          </Text>
        </View>
        <View className="flex-1" />
      </View>

      <View className="h-[50px] flex-row items-center rounded-[14px] bg-white p-1 pl-3.5">
        <Ionicons name="search-outline" size={18} color="#7c8999" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by city, GST, cargo type..."
          placeholderTextColor="#8a95a5"
          className="font-manrope-medium ml-2 flex-1 text-xs text-[#17253a]"
          returnKeyType="search"
          onSubmitEditing={search}
        />
        <Pressable
          accessibilityLabel="Search"
          onPress={search}
          className="h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#ff7417]">
          <Ionicons name="search" size={20} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: MaterialIconName; value: string; label: string; color: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-[14px] border border-[#eeece7] bg-white px-2.5 py-3" style={styles.card}>
      <View className="mb-2 h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}16` }}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text className="font-manrope-extrabold text-[16px] text-[#17253a]">{value}</Text>
      <Text className="font-manrope-medium mt-0.5 text-[9px] leading-3 text-[#7b8797]">{label}</Text>
    </View>
  );
}

function WorkspaceCard({ label, description, href, icon, color }: (typeof workspace)[number]) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-[48.5%] rounded-[14px] border border-[#eeece7] bg-white p-3 active:opacity-90"
      style={styles.card}>
      <View className="flex-row items-start justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}16` }}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <View className="h-7 w-7 items-center justify-center rounded-full bg-[#f4f7fa]">
          <Ionicons name="arrow-forward" size={13} color="#66768a" />
        </View>
      </View>
      <Text className="font-manrope-extrabold mt-2.5 text-[13px] text-[#17253a]">{label}</Text>
      <Text numberOfLines={2} className="font-manrope-medium mt-0.5 text-[9px] leading-3 text-[#7b8797]">
        {description}
      </Text>
    </Pressable>
  );
}

function TransporterCard({ transporter }: { transporter: ApiTransporter }) {
  const location = [transporter.city?.name, transporter.state?.name].filter(Boolean).join(', ') || 'India';
  const services = (transporter.service_types?.length ? transporter.service_types : transporter.services ?? []).slice(0, 3);

  return (
    <Pressable
      onPress={() => openWebsite(`/transporters/${transporter.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`View ${transporter.name}`}
      className="w-[300px] overflow-hidden rounded-[16px] border border-[#ebe8e1] bg-white"
      style={styles.card}>
      <View>
        <Image source={TRUCK_IMAGE} contentFit="cover" contentPosition="center" transition={250} style={styles.transporterImage} />
        <View className="absolute bottom-2 left-2 flex-row items-center rounded-full bg-black/55 px-2 py-1">
          <MaterialCommunityIcons name="map-marker-radius-outline" size={11} color="white" />
          <Text className="font-manrope-semibold ml-1 text-[9px] text-white">{location}</Text>
        </View>
      </View>
      <View className="px-3 py-2.5">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 flex-row items-center">
            <Text numberOfLines={1} className="font-manrope-bold mr-2 shrink text-[13px] text-[#173c68]">
              {transporter.name}
            </Text>
            {transporter.is_verified ? (
              <View className="rounded-full bg-[#ddecff] px-2 py-0.5">
                <Text className="font-manrope-bold text-[8px] text-[#3283db]">Verified</Text>
              </View>
            ) : null}
          </View>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#fff2e9]">
            <Ionicons name="arrow-forward" size={14} color={ORANGE} />
          </View>
        </View>
        <View className="mt-1 flex-row items-center">
          <Ionicons name="call-outline" size={12} color="#f49a32" />
          <Text className="font-manrope-bold ml-1 text-[10px] text-[#2d3a4d]">{transporter.phone || 'Contact on website'}</Text>
        </View>
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {services.length ? services.map((service) => <Tag key={service.id}>{service.name}</Tag>) : <Tag>Transport services</Tag>}
        </View>
      </View>
    </Pressable>
  );
}

function CityMarquee({ cities, loading, error, onRetry }: { cities: Location[]; loading: boolean; error: boolean; onRetry: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const interactingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const distance = cities.length * (CITY_CARD_WIDTH + CITY_GAP);
  // Only loop when there are enough cards to fill the screen.
  const loops = cities.length >= 3;

  useEffect(() => {
    if (!loops) return;
    offsetRef.current = distance;
    const startTimer = setTimeout(() => scrollRef.current?.scrollTo({ x: distance, animated: false }), 50);
    const ticker = setInterval(() => {
      if (interactingRef.current) return;
      let nextOffset = offsetRef.current + 1.25;
      if (nextOffset >= distance * 2) nextOffset -= distance;
      offsetRef.current = nextOffset;
      scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
    }, 32);

    return () => {
      clearTimeout(startTimer);
      clearInterval(ticker);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [distance, loops]);

  const pauseAutoScroll = () => {
    interactingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const resumeAutoScroll = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      interactingRef.current = false;
    }, 1200);
  };

  const normalizePosition = (offset: number) => {
    if (!loops) return;
    let normalized = offset;
    if (offset < distance * 0.35) normalized = offset + distance;
    else if (offset > distance * 2.65) normalized = offset - distance;
    if (normalized !== offset) {
      offsetRef.current = normalized;
      scrollRef.current?.scrollTo({ x: normalized, animated: false });
    }
  };

  const items = loops ? [...cities, ...cities, ...cities] : cities;

  return (
    <View className="mt-6 overflow-hidden pb-5">
      <View className="mb-3 flex-row items-end justify-between px-[18px]">
        <View className="min-w-0 flex-1 pr-3">
          <View className="mb-1.5 self-start rounded-full bg-[#fff0e6] px-2.5 py-1">
            <Text className="font-manrope-bold text-[8px] uppercase tracking-[0.6px] text-[#f27022]">Featured cities</Text>
          </View>
          <Text className="font-manrope-extrabold text-[17px] text-[#17253a]">Browse Featured Cities</Text>
          <Text className="font-manrope-medium mt-0.5 text-[10px] text-[#778398]">Find verified transporters in major logistics hubs</Text>
        </View>
        <View className="mb-0.5 flex-row items-center rounded-xl border border-[#e5e9ef] bg-white px-2.5 py-2">
          <Ionicons name="location-outline" size={14} color="#3578e5" />
          <Text className="font-manrope-bold ml-1 text-[9px] text-[#26364b]">
            {cities.length} {cities.length === 1 ? 'city' : 'cities'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="h-[140px] items-center justify-center">
          <ActivityIndicator color={ORANGE} />
        </View>
      ) : error && cities.length === 0 ? (
        <View className="mx-[18px] items-center rounded-[16px] border border-[#e4e7ec] bg-white px-4 py-5" style={styles.cityCard}>
          <Text className="font-manrope-semibold text-[11px] text-[#7b8797]">We couldn&apos;t load featured cities right now.</Text>
          <Pressable onPress={onRetry} hitSlop={8} className="mt-2 flex-row items-center">
            <Ionicons name="refresh" size={14} color={ORANGE} />
            <Text className="font-manrope-bold ml-1 text-xs text-[#f27022]">Try again</Text>
          </Pressable>
        </View>
      ) : cities.length === 0 ? (
        <View className="mx-[18px] rounded-[16px] border border-[#e4e7ec] bg-white px-4 py-5" style={styles.cityCard}>
          <Text className="font-manrope-semibold text-center text-[11px] text-[#7b8797]">Featured cities will appear here.</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onTouchStart={pauseAutoScroll}
          onTouchEnd={resumeAutoScroll}
          onScrollBeginDrag={pauseAutoScroll}
          onScrollEndDrag={resumeAutoScroll}
          onMomentumScrollEnd={(event) => {
            normalizePosition(event.nativeEvent.contentOffset.x);
            resumeAutoScroll();
          }}
          onScroll={(event) => {
            offsetRef.current = event.nativeEvent.contentOffset.x;
          }}
          contentContainerStyle={styles.cityList}>
          {items.map((city, index) => (
            <CityCard
              key={`${city.id}-${index}`}
              city={city}
              tint={CITY_TINTS[(index % cities.length) % CITY_TINTS.length]}
              onPress={() => openWebsite(city.parent?.slug ? `/transporters/${city.parent.slug}/${city.slug}` : '/transporters')}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function CityCard({ city, tint, onPress }: { city: Location; tint: string; onPress: () => void }) {
  const state = city.parent?.name ?? 'India';
  const code = city.parent?.code ?? state.slice(0, 3).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View transporters serving ${city.name}`}
      className="overflow-hidden rounded-[16px] border border-[#e4e7ec] bg-white"
      style={[styles.cityCard, { width: CITY_CARD_WIDTH }]}>
      <View className="relative h-[88px] overflow-hidden" style={{ backgroundColor: tint }}>
        <Image source={TRUCK_IMAGE} contentFit="cover" contentPosition="center" style={StyleSheet.absoluteFill} />
        <View className="absolute inset-0 bg-[#10243e]/25" />
        <View className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1">
          <Text className="font-manrope-bold text-[8px] tracking-[0.5px] text-[#51647c]">{code}</Text>
        </View>
        <View className="absolute bottom-2 left-2 h-7 w-7 items-center justify-center rounded-full bg-white/90">
          <MaterialCommunityIcons name="city-variant-outline" size={16} color="#315f94" />
        </View>
      </View>
      <View className="px-3 py-2.5">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-manrope-bold text-xs text-[#17253a]">{city.name}</Text>
            <Text numberOfLines={1} className="font-manrope-semibold mt-0.5 text-[9px] text-[#3578e5]">{state}</Text>
          </View>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#f4f7fa]">
            <Ionicons name="arrow-forward" size={13} color="#66768a" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-md bg-[#f5f5f3] px-2 py-0.5">
      <Text className="font-manrope-medium text-[8px] text-[#6f7a88]">{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    shadowColor: '#0e233d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    shadowColor: '#1f2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  transporterList: {
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  transporterImage: {
    width: '100%',
    height: 86,
  },
  cityCard: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 3,
  },
  cityList: {
    gap: CITY_GAP,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
});
