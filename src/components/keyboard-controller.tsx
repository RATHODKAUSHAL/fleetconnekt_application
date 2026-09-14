import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { ScrollView } from 'react-native';

type KeyboardControllerModule = typeof import('react-native-keyboard-controller');
type KeyboardAwareProps = ComponentProps<typeof ScrollView> & {
  bottomOffset?: number;
  enabled?: boolean;
  mode?: 'insets' | 'layout';
};

let keyboardController: KeyboardControllerModule | undefined;

try {
  keyboardController = require('react-native-keyboard-controller') as KeyboardControllerModule;
} catch {
  // The current native binary may predate this dependency. Keep the app usable
  // until the development/production client is rebuilt with the module linked.
  keyboardController = undefined;
}

const NativeKeyboardProvider = keyboardController?.KeyboardProvider;
const NativeKeyboardToolbar = keyboardController?.KeyboardToolbar;
const NativeKeyboardAwareScrollView = keyboardController?.KeyboardAwareScrollView as
  | ComponentType<KeyboardAwareProps>
  | undefined;

export function AppKeyboardProvider({ children }: { children: ReactNode }) {
  if (NativeKeyboardProvider) {
    return <NativeKeyboardProvider>{children}</NativeKeyboardProvider>;
  }
  return <>{children}</>;
}

export function AppKeyboardToolbar() {
  return NativeKeyboardToolbar ? <NativeKeyboardToolbar /> : null;
}

export function AppKeyboardAwareScrollView({ bottomOffset, ...props }: KeyboardAwareProps) {
  if (NativeKeyboardAwareScrollView) {
    return <NativeKeyboardAwareScrollView bottomOffset={bottomOffset} {...props} />;
  }
  return <ScrollView {...props} />;
}
