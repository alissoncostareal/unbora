import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { radius, type ThemeColors } from '@/theme/colors';

interface AuthFieldProps extends Pick<TextInputProps, 'autoCapitalize' | 'keyboardType'> {
  colors: ThemeColors;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
}

export function AuthField({
  colors,
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  autoCapitalize,
  keyboardType,
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;
  const isSpotify = colors.useGlass;

  const fieldBg = isSpotify ? colors.surfaceStrong : colors.surface;
  const fieldRadius = isSpotify ? 6 : 12;

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.label,
          {
            color: colors.textPrimary,
            fontSize: isSpotify ? 14 : 13,
            fontWeight: isSpotify ? '700' : '600',
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          autoCapitalize={autoCapitalize ?? (isPassword ? 'none' : 'words')}
          keyboardType={keyboardType}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: fieldBg,
              borderRadius: fieldRadius,
              borderColor: focused ? colors.primary : isSpotify ? 'transparent' : colors.border,
              borderWidth: isSpotify ? (focused ? 1.5 : 0) : 1,
            },
          ]}
        />
        {isPassword && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            style={styles.eyeButton}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  label: {
    letterSpacing: 0.2,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
  },
});
