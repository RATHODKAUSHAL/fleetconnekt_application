import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStore: SecureStoreModule | undefined;

// expo-secure-store has no web implementation; the browser uses localStorage instead.
if (Platform.OS !== 'web') {
  try {
    secureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    // The installed native binary may predate expo-secure-store. Fall back to the
    // app's private document directory until the client is rebuilt.
    secureStore = undefined;
  }
}

const TOKEN_KEY = 'fleetconnekt_auth_token';

function tokenFile() {
  return new File(Paths.document, `${TOKEN_KEY}.txt`);
}

export async function readToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }
  try {
    if (secureStore) return await secureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // Native module missing at runtime; use the file fallback below.
  }
  try {
    const file = tokenFile();
    return file.exists ? (await file.text()) || null : null;
  } catch {
    return null;
  }
}

export async function writeToken(token: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } catch {
      // Storage blocked (private mode); the session still works until reload.
    }
    return;
  }
  try {
    if (secureStore) {
      await secureStore.setItemAsync(TOKEN_KEY, token);
      return;
    }
  } catch {
    // Fall through to the file fallback.
  }
  try {
    const file = tokenFile();
    if (!file.exists) file.create();
    file.write(token);
  } catch {
    // Persisting failed; keep the in-memory session rather than blocking sign-in.
  }
}

export async function clearToken() {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    } catch {
      // Nothing stored.
    }
    return;
  }
  try {
    if (secureStore) await secureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Ignore and also clear the fallback.
  }
  try {
    const file = tokenFile();
    if (file.exists) file.delete();
  } catch {
    // Nothing stored.
  }
}
