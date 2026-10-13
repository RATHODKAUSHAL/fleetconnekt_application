import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { AuthScreen, BrandMark } from '@/components/auth-screen';
import { EMAIL_PATTERN } from '@/lib/format';
import { ApiError, authApi, errorMessage } from '@/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function createAccount() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email address is required.');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Enter a valid email address, like name@company.com.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      const response = await authApi.requestOtp(normalizedEmail, 'register');
      router.push({ pathname: '/verify-otp', params: { email: normalizedEmail, purpose: 'register', message: response.message } });
    } catch (issue) {
      // Validation errors (e.g. the email is already registered) belong under the field.
      if (issue instanceof ApiError && issue.status === 422) setError(issue.message);
      else Alert.alert('Could not send code', errorMessage(issue));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen showBack onBack={() => router.back()}>
      <View className="pt-5">
        <BrandMark compact />
        <View className="mt-9">
          <Text className="font-manrope-extrabold text-[27px] tracking-[-0.6px] text-[#14253d]">Create your account</Text>
          <Text className="font-manrope-medium mt-2 text-sm leading-[21px] text-[#748197]">Enter your work email. We’ll send a one-time code to verify it.</Text>
          <Text className="font-manrope-bold mb-2 mt-7 text-xs text-[#26364b]">Email address</Text>
          <View className={`h-14 flex-row items-center rounded-2xl border bg-white px-4 ${error ? 'border-[#ef3347]' : 'border-[#e1e5ea]'}`}>
            <Ionicons name="mail-outline" size={20} color="#8290a1" />
            <TextInput value={email} onChangeText={(value) => { setEmail(value); setError(''); }} placeholder="you@company.com" placeholderTextColor="#9aa4b2" autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="done" onSubmitEditing={createAccount} className="font-manrope-semibold ml-3 flex-1 text-[14px] text-[#14253d]" />
          </View>
          {error ? (
            <View className="mt-2">
              <Text className="font-manrope-semibold text-xs text-[#ef3347]">{error}</Text>
              {/already been taken/i.test(error) ? (
                <Pressable onPress={() => router.replace('/login')} hitSlop={8} className="mt-1">
                  <Text className="font-manrope-bold text-xs text-[#f27022]">Sign in with this email instead</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <Pressable onPress={createAccount} disabled={loading} className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl bg-[#f27022] ${loading ? 'opacity-70' : ''}`}>
            {loading ? <ActivityIndicator color="white" /> : null}
            <Text className="font-manrope-bold mx-2 text-[15px] text-white">{loading ? 'Sending code...' : 'Send verification code'}</Text>
            {!loading ? <Ionicons name="arrow-forward" size={19} color="white" /> : null}
          </Pressable>
          <Text className="font-manrope-medium mt-5 text-center text-[11px] leading-[17px] text-[#8a95a5]">By continuing, you agree to FleetConnekt’s Terms of Service and Privacy Policy.</Text>
          <View className="mt-7 flex-row items-center justify-center">
            <Text className="font-manrope-medium text-sm text-[#748197]">Already registered? </Text>
            <Pressable onPress={() => router.replace('/login')} hitSlop={8}><Text className="font-manrope-bold text-sm text-[#f27022]">Sign in</Text></Pressable>
          </View>
        </View>
      </View>
    </AuthScreen>
  );
}
