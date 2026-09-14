import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { AuthScreen, BrandMark } from '@/components/auth-screen';
import { requestEmailOtp } from '@/services/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function continueWithEmail() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('Check your email', 'Enter a valid email address to continue.');
      return;
    }
    try {
      setLoading(true);
      const result = await requestEmailOtp(normalizedEmail, 'login');
      router.push({ pathname: '/verify-otp', params: { email: normalizedEmail, purpose: 'login', ...(result.demoCode ? { demoCode: result.demoCode } : {}) } });
    } catch (error) {
      Alert.alert('Unable to continue', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen>
      <View className="flex-1 justify-center pb-12">
        <BrandMark />
        <View className="mt-11">
          <Text className="font-manrope-extrabold text-[28px] tracking-[-0.7px] text-[#14253d]">Welcome back</Text>
          <Text className="font-manrope-medium mt-2 text-sm leading-[21px] text-[#748197]">Sign in with your email to manage your transport business.</Text>
          <Text className="font-manrope-bold mb-2 mt-7 text-xs text-[#26364b]">Email address</Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-[#e1e5ea] bg-white px-4">
            <Ionicons name="mail-outline" size={20} color="#8290a1" />
            <TextInput value={email} onChangeText={setEmail} placeholder="you@company.com" placeholderTextColor="#9aa4b2" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" returnKeyType="done" onSubmitEditing={continueWithEmail} className="font-manrope-semibold ml-3 flex-1 text-[14px] text-[#14253d]" />
          </View>
          <Pressable onPress={continueWithEmail} disabled={loading} className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl bg-[#f27022] ${loading ? 'opacity-70' : ''}`}>
            {loading ? <ActivityIndicator color="white" /> : null}
            <Text className="font-manrope-bold mx-2 text-[15px] text-white">{loading ? 'Sending code...' : 'Continue with email'}</Text>
            {!loading ? <Ionicons name="arrow-forward" size={19} color="white" /> : null}
          </Pressable>
          <View className="mt-7 flex-row items-center justify-center">
            <Text className="font-manrope-medium text-sm text-[#748197]">New to FleetConnect? </Text>
            <Pressable onPress={() => router.push('/register')} hitSlop={8}><Text className="font-manrope-bold text-sm text-[#f27022]">Create an account</Text></Pressable>
          </View>
        </View>
      </View>
    </AuthScreen>
  );
}
