import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTransporter, transporters } from '@/data/transporters';

const ORANGE = '#ff7417';
const NAVY = '#17253a';
const TRUCK_IMAGE = require('@/assets/images/App-Images/ChatGPT Image Aug 22, 2026, 02_46_02 PM.png');
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const SERVICE_ICONS: Record<string, MaterialIconName> = {
  FTL: 'truck-cargo-container',
  PTL: 'package-variant-closed',
  Container: 'shipping-pallet',
  Refrigerated: 'snowflake',
  'Open Truck': 'truck-flatbed',
  ODC: 'truck-trailer',
  Express: 'truck-fast-outline',
};

export function generateStaticParams() {
  return transporters.map(({ id }) => ({ id }));
}

export default function TransporterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transporter = getTransporter(id);
  const [expanded, setExpanded] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/transporters');
  };

  if (!transporter) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f8f5] px-6">
        <MaterialCommunityIcons name="truck-alert-outline" size={48} color="#8290a1" />
        <Text className="font-manrope-extrabold mt-4 text-lg text-[#17253a]">Transporter not found</Text>
        <Pressable onPress={goBack} className="mt-5 rounded-xl bg-[#ff7417] px-5 py-3">
          <Text className="font-manrope-bold text-sm text-white">Back to directory</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const visibleAbout = expanded ? transporter.about : `${transporter.about.slice(0, 145).trim()}...`;

  return (
    <View className="flex-1 bg-[#f8f8f5]">
      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="w-full max-w-[560px] self-center">
          <View className="relative h-[205px] overflow-hidden bg-[#23425f]">
            <Image source={TRUCK_IMAGE} contentFit="cover" contentPosition="center" style={StyleSheet.absoluteFill} />
            <View className="absolute inset-0 bg-black/20" />
            <SafeAreaView edges={['top']} className="flex-row items-center justify-between px-[18px] pt-1">
              <RoundIcon label="Go back" icon="arrow-back" onPress={goBack} />
              <RoundIcon
                label="Share transporter"
                icon="share-social-outline"
                onPress={() => Share.share({ message: `${transporter.name} — ${transporter.from}, ${transporter.state}` })}
              />
            </SafeAreaView>
          </View>

          <View className="-mt-6 rounded-t-[26px] bg-[#f8f8f5] px-[18px] pb-2 pt-0">
            <View className="-mt-9 flex-row items-end">
              <View className="h-[72px] w-[72px] items-center justify-center rounded-[18px] border-4 border-white bg-[#173d6b]" style={styles.logoShadow}>
                <Text className="font-manrope-extrabold text-[25px] text-white">{transporter.initials}</Text>
              </View>
              <View className="mb-1 ml-3 rounded-full bg-[#1689e7] px-2.5 py-1">
                <Text className="font-manrope-bold text-[9px] text-white">Verified</Text>
              </View>
            </View>

            <Text className="font-manrope-extrabold mt-3 text-[23px] tracking-[-0.5px] text-[#17253a]">{transporter.name}</Text>
            <View className="mt-1 flex-row items-center">
              <Ionicons name="star" size={18} color={ORANGE} />
              <Text className="font-manrope-extrabold ml-1.5 text-[13px] text-[#26364b]">{transporter.rating}</Text>
              <Text className="font-manrope-medium ml-1 text-[12px] text-[#748197]">({transporter.reviews})</Text>
            </View>

            <View className="mt-4 flex-row items-center">
              <Text className="font-manrope-medium text-[11px] text-[#65758a]">
                <Text className="font-manrope-bold text-[#32445a]">GST:</Text> {transporter.gst}
              </Text>
              <Pressable
                hitSlop={8}
                accessibilityLabel="Copy GST number"
                onPress={() => Alert.alert('GST number', transporter.gst)}
                className="ml-2 h-7 w-7 items-center justify-center rounded-lg bg-white">
                <Ionicons name="copy-outline" size={14} color="#607188" />
              </Pressable>
            </View>
            <View className="mt-2 flex-row items-center">
              <Ionicons name="location-outline" size={16} color="#607188" />
              <Text className="font-manrope-medium ml-1.5 text-[12px] text-[#65758a]">{transporter.from}, {transporter.state}</Text>
            </View>
            <Text className="font-manrope-medium ml-[22px] mt-1 text-[11px] text-[#8290a1]">Since {transporter.since}</Text>

            <View className="mt-5 flex-row gap-2">
              {transporter.services.map((service) => (
                <ServiceCard key={service} label={service} icon={SERVICE_ICONS[service] ?? 'truck-outline'} />
              ))}
            </View>

            <View className="mt-5 border-t border-[#e8e6e1] pt-5">
              <Text className="font-manrope-extrabold text-[17px] text-[#17253a]">About</Text>
              <Text className="font-manrope-medium mt-2 text-[12px] leading-[19px] text-[#65758a]">{visibleAbout}</Text>
              <Pressable onPress={() => setExpanded((value) => !value)} className="mt-3 flex-row items-center self-start" hitSlop={8}>
                <Text className="font-manrope-bold text-[12px] text-[#ff7417]">{expanded ? 'Read Less' : 'Read More'}</Text>
                <Ionicons name={expanded ? 'arrow-up' : 'arrow-forward'} size={15} color={ORANGE} style={{ marginLeft: 7 }} />
              </Pressable>
            </View>

            <View className="mt-5 border-t border-[#e8e6e1] pt-5">
              <Text className="font-manrope-extrabold text-[17px] text-[#17253a]">Fleet &amp; Capacity</Text>
              <View className="mt-4 flex-row rounded-[18px] border border-[#e8e6e1] bg-white py-4" style={styles.cardShadow}>
                <Metric icon="truck-outline" value={transporter.trucks} label="Trucks" />
                <View className="w-px bg-[#eceae5]" />
                <Metric icon="weight-kilogram" value={transporter.capacity} label="Max Capacity" />
                <View className="w-px bg-[#eceae5]" />
                <Metric icon="truck-check-outline" value={transporter.availability} label="Available Now" />
              </View>
            </View>
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RoundIcon({ label, icon, onPress }: { label: string; icon: ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} className="h-10 w-10 items-center justify-center rounded-full bg-black/35">
      <Ionicons name={icon} size={21} color="white" />
    </Pressable>
  );
}

function ServiceCard({ label, icon }: { label: string; icon: MaterialIconName }) {
  return (
    <View className="min-w-0 flex-1 items-center rounded-[14px] border border-[#eceae5] bg-white px-1 py-3">
      <MaterialCommunityIcons name={icon} size={24} color="#284969" />
      <Text className="font-manrope-bold mt-2 text-center text-[9px] text-[#52657a]" numberOfLines={1}>{label}</Text>
    </View>
  );
}

function Metric({ icon, value, label }: { icon: MaterialIconName; value: string; label: string }) {
  return (
    <View className="min-w-0 flex-1 items-center px-1">
      <MaterialCommunityIcons name={icon} size={22} color="#284969" />
      <Text className="font-manrope-extrabold mt-2 text-[13px] text-[#17253a]">{value}</Text>
      <Text className="font-manrope-medium mt-0.5 text-center text-[9px] text-[#8290a1]">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoShadow: {
    shadowColor: '#17253a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardShadow: {
    shadowColor: '#25364a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
