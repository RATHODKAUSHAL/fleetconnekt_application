import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WELCOME_IMAGE = require('@/assets/images/App-Images/ChatGPT Image Aug 22, 2026, 05_05_21 PM.png');
const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);
const NAVY = '#15263d';
const ORANGE = '#f27022';

const statistics = [
  { value: '1,000+', label: 'Verified\nTransporters', icon: 'shield-check-outline' as const },
  { value: '50,000+', label: 'LRs\nGenerated', icon: 'file-document-outline' as const },
  { value: '250+', label: 'Cities\nCovered', icon: 'map-marker-radius-outline' as const },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const brandProgress = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const statsProgress = useRef(new Animated.Value(0)).current;

  const logoSize = Math.min(42, Math.max(32, width * 0.1));
  const taglineSize = Math.min(18, Math.max(15, width * 0.043));
  const statNumberSize = Math.min(27, Math.max(21, width * 0.061));
  const statLabelSize = Math.min(12, Math.max(10, width * 0.028));
  const statsHeight = Math.min(176, Math.max(132, height * 0.19 + insets.bottom));

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(brandProgress, {
        toValue: 1,
        delay: 180,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        delay: 430,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(statsProgress, {
        toValue: 1,
        delay: 720,
        duration: 480,
        useNativeDriver: true,
      }),
    ]);

    entrance.start();
    const navigationTimer = setTimeout(() => router.replace('/login'), 2450);

    return () => {
      entrance.stop();
      clearTimeout(navigationTimer);
    };
  }, [backgroundOpacity, brandProgress, router, statsProgress, taglineOpacity]);

  return (
    <View style={styles.screen}>
      <AnimatedImageBackground
        source={WELCOME_IMAGE}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { opacity: backgroundOpacity }]}
        imageStyle={styles.backgroundImage}
      />

      <View style={styles.content}>
        <View style={[styles.brandRegion, { paddingTop: insets.top }]}>
          <Animated.View
            style={{
              opacity: brandProgress,
              transform: [
                {
                  translateY: brandProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            }}>
            <Text
              accessibilityRole="header"
              style={[styles.brand, { fontSize: logoSize, lineHeight: logoSize * 1.16 }]}>
              Fleet<Text style={styles.brandOrange}>Connekt</Text>
            </Text>
            <View style={styles.accent} />
            <Animated.Text
              style={[
                styles.tagline,
                { fontSize: taglineSize, lineHeight: taglineSize * 1.35, opacity: taglineOpacity },
              ]}>
              Move India Forward
            </Animated.Text>
          </Animated.View>
        </View>

        <View style={styles.truckSafeRegion} />

        <View style={[styles.statsRegion, { height: statsHeight, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={styles.scrimLight} />
            <View style={styles.scrimMedium} />
            <View style={styles.scrimDark} />
          </View>

          <Animated.View
            style={[
              styles.statsRow,
              {
                opacity: statsProgress,
                transform: [
                  {
                    translateY: statsProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}>
            {statistics.map((statistic, index) => (
              <View key={statistic.value} style={styles.statGroup}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.statContent}>
                  <MaterialCommunityIcons name={statistic.icon} size={16} color={ORANGE} />
                  <Text style={[styles.statValue, { fontSize: statNumberSize, lineHeight: statNumberSize * 1.18 }]}>{statistic.value}</Text>
                  <Text style={[styles.statLabel, { fontSize: statLabelSize }]}>{statistic.label}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e9d6c4',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  brandRegion: {
    flex: 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  truckSafeRegion: {
    flex: 0.62,
  },
  brand: {
    fontFamily: 'Manrope_800ExtraBold',
    color: NAVY,
    textAlign: 'center',
    letterSpacing: -1.2,
    textShadowColor: 'rgba(255,255,255,0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  brandOrange: {
    color: ORANGE,
  },
  accent: {
    width: 44,
    height: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 9,
    borderRadius: 2,
    backgroundColor: ORANGE,
  },
  tagline: {
    fontFamily: 'Manrope_600SemiBold',
    color: '#3d4448',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  statsRegion: {
    justifyContent: 'center',
    paddingTop: 18,
    paddingHorizontal: 8,
  },
  scrimLight: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 29, 0.08)',
  },
  scrimMedium: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 29, 0.2)',
  },
  scrimDark: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 29, 0.38)',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  statGroup: {
    flex: 1,
    height: '74%',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  statValue: {
    fontFamily: 'Manrope_800ExtraBold',
    color: '#ff812f',
    marginTop: 3,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: 'Manrope_600SemiBold',
    color: '#f2eee8',
    marginTop: 1,
    lineHeight: 15,
    textAlign: 'center',
  },
  divider: {
    position: 'absolute',
    left: 0,
    top: '16%',
    bottom: '16%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
});
