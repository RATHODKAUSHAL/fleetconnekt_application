import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { AuthScreen } from '@/components/auth-screen';
import { type AuthPurpose, requestEmailOtp, verifyEmailOtp } from '@/services/auth';

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; purpose?: string; demoCode?: string }>();
  const email = params.email ?? '';
  const purpose: AuthPurpose = params.purpose === 'register' ? 'register' : 'login';
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [demoCode, setDemoCode] = useState(params.demoCode);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function verifyCode() {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert('Enter the full code', 'The verification code contains 6 digits.');
      return;
    }
    try {
      setLoading(true);
      await verifyEmailOtp(email, otp, purpose);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Verification failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (resendIn > 0) return;
    try {
      const result = await requestEmailOtp(email, purpose);
      setDemoCode(result.demoCode);
      setOtp('');
      setResendIn(30);
      Alert.alert('Code sent', `A new verification code was sent to ${email}.`);
    } catch (error) {
      Alert.alert('Could not resend', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <AuthScreen showBack onBack={() => router.back()}>
      <View className="flex-1 justify-center pb-20">
        <View className="h-[76px] w-[76px] items-center justify-center self-center rounded-[24px] bg-[#fff0e5]">
          <Ionicons name="mail-unread-outline" size={40} color="#f27022" />
        </View>
        <Text className="font-manrope-extrabold mt-7 text-center text-[27px] tracking-[-0.6px] text-[#14253d]">Check your email</Text>
        <Text className="font-manrope-medium mt-2 text-center text-sm leading-[21px] text-[#748197]">
          We sent a 6-digit verification code to{`\n`}<Text className="font-manrope-bold text-[#26364b]">{email}</Text>
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()} className="mt-8 flex-row justify-between gap-2">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <View key={index} className={`h-[58px] flex-1 items-center justify-center rounded-2xl border bg-white ${index === otp.length ? 'border-[#f27022]' : 'border-[#dfe4e9]'}`}>
              <Text className="font-manrope-extrabold text-xl text-[#14253d]">{otp[index] ?? ''}</Text>
            </View>
          ))}
          <TextInput ref={inputRef} value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={OTP_LENGTH} autoFocus onSubmitEditing={verifyCode} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
        </Pressable>

        {demoCode ? (
          <View className="mt-4 rounded-xl bg-[#eaf2ff] px-3 py-2.5">
            <Text className="font-manrope-semibold text-center text-xs text-[#315f94]">Demo mode code: {demoCode}</Text>
          </View>
        ) : null}

        <Pressable onPress={verifyCode} disabled={loading} className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-[#f27022] ${loading ? 'opacity-70' : ''}`}>
          {loading ? <ActivityIndicator color="white" /> : null}
          <Text className="font-manrope-bold mx-2 text-[15px] text-white">{loading ? 'Verifying...' : 'Verify & continue'}</Text>
          {!loading ? <Ionicons name="checkmark-circle-outline" size={20} color="white" /> : null}
        </Pressable>

        <View className="mt-7 flex-row items-center justify-center">
          <Text className="font-manrope-medium text-sm text-[#748197]">Didn’t receive it? </Text>
          <Pressable onPress={resendCode} disabled={resendIn > 0} hitSlop={8}>
            <Text className={`font-manrope-bold text-sm ${resendIn > 0 ? 'text-[#a7afb9]' : 'text-[#f27022]'}`}>{resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}</Text>
          </Pressable>
        </View>
      </View>
    </AuthScreen>
  );
}
