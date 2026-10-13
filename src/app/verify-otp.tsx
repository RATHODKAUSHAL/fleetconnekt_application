import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { AuthScreen } from '@/components/auth-screen';
import { needsCompanyProfile, useAuth } from '@/context/auth';
import { OTP_LENGTH } from '@/lib/format';
import { authApi, errorMessage } from '@/services/api';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string; purpose?: string; message?: string }>();
  const email = params.email ?? '';
  const purpose = params.purpose === 'register' ? 'register' : 'login';
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(params.message ?? '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function verifyCode() {
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) {
      setError(`Enter the ${OTP_LENGTH}-digit code sent to your email.`);
      return;
    }
    setError('');
    setLoading(true);
    let result: Awaited<ReturnType<typeof authApi.verifyOtp>>;
    try {
      result = await authApi.verifyOtp(email, otp, purpose);
    } catch (issue) {
      // Only a failed verify request means the code itself was wrong.
      setError(errorMessage(issue, 'That code is invalid or has expired.'));
      setOtp('');
      setLoading(false);
      return;
    }

    try {
      // The verify response carries the bare user; load companies and role before routing.
      const user = await authApi.getUser(result.token).catch(() => result.user);
      await signIn(result.token, user);
      if (purpose === 'register' || needsCompanyProfile(user)) {
        router.replace({ pathname: '/profile-edit', params: { onboarding: '1' } });
      } else {
        router.replace('/home');
      }
    } catch {
      setError('You are verified, but we could not finish signing you in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (resendIn > 0 || resending) return;
    try {
      setResending(true);
      const response = await authApi.requestOtp(email, purpose);
      setOtp('');
      setError('');
      setNotice(response.message);
      setResendIn(30);
    } catch (issue) {
      Alert.alert('Could not resend', errorMessage(issue));
    } finally {
      setResending(false);
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
          We sent a {OTP_LENGTH}-digit verification code to{`\n`}<Text className="font-manrope-bold text-[#26364b]">{email}</Text>
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()} className="mt-8 flex-row justify-center gap-3">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <View key={index} className={`h-[62px] w-[58px] items-center justify-center rounded-2xl border bg-white ${error ? 'border-[#ef3347]' : index === otp.length ? 'border-[#f27022]' : 'border-[#dfe4e9]'}`}>
              <Text className="font-manrope-extrabold text-xl text-[#14253d]">{otp[index] ?? ''}</Text>
            </View>
          ))}
          <TextInput ref={inputRef} value={otp} onChangeText={(value) => { setOtp(value.replace(/\D/g, '').slice(0, OTP_LENGTH)); setError(''); }} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={OTP_LENGTH} autoFocus onSubmitEditing={verifyCode} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
        </Pressable>

        {error ? (
          <Text className="font-manrope-semibold mt-3 text-center text-xs text-[#ef3347]">{error}</Text>
        ) : notice ? (
          <View className="mt-4 rounded-xl bg-[#eaf2ff] px-3 py-2.5">
            <Text className="font-manrope-semibold text-center text-xs text-[#315f94]">{notice}</Text>
          </View>
        ) : null}

        <Pressable onPress={verifyCode} disabled={loading} className={`mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-[#f27022] ${loading ? 'opacity-70' : ''}`}>
          {loading ? <ActivityIndicator color="white" /> : null}
          <Text className="font-manrope-bold mx-2 text-[15px] text-white">{loading ? 'Verifying...' : purpose === 'register' ? 'Verify & create account' : 'Verify & sign in'}</Text>
          {!loading ? <Ionicons name="checkmark-circle-outline" size={20} color="white" /> : null}
        </Pressable>

        <View className="mt-7 flex-row items-center justify-center">
          <Text className="font-manrope-medium text-sm text-[#748197]">Didn’t receive it? </Text>
          <Pressable onPress={resendCode} disabled={resendIn > 0 || resending} hitSlop={8}>
            <Text className={`font-manrope-bold text-sm ${resendIn > 0 || resending ? 'text-[#a7afb9]' : 'text-[#f27022]'}`}>{resending ? 'Sending...' : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8} className="mt-4 self-center">
          <Text className="font-manrope-bold text-sm text-[#617091]">Change email</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
