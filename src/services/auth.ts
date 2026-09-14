export type AuthPurpose = 'login' | 'register';

const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API_URL?.replace(/\/$/, '');
const DEMO_OTP = '123456';

type RequestOtpResult = { demoCode?: string };

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}

export async function requestEmailOtp(email: string, purpose: AuthPurpose): Promise<RequestOtpResult> {
  if (!AUTH_API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return { demoCode: DEMO_OTP };
  }

  const response = await fetch(`${AUTH_API_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
  if (!response.ok) {
    throw new Error((await readError(response)) ?? 'We could not send your verification code.');
  }
  return {};
}

export async function verifyEmailOtp(email: string, otp: string, purpose: AuthPurpose) {
  if (!AUTH_API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (otp !== DEMO_OTP) throw new Error('That code is not correct. Use 123456 in demo mode.');
    return;
  }

  const response = await fetch(`${AUTH_API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, purpose }),
  });
  if (!response.ok) {
    throw new Error((await readError(response)) ?? 'That code is invalid or has expired.');
  }
}
