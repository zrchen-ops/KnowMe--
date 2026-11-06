import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { colors } from '@/constants/colors';
import { floatingShadow, radius } from '@/constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scrollable?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  scrollable = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(160)}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(320)}
          exiting={SlideOutDown.duration(220)}
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.xxl + 4,
            borderTopRightRadius: radius.xxl + 4,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
            paddingHorizontal: 20,
            paddingTop: 10,
            maxHeight: '90%',
            ...floatingShadow,
          }}>
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E3E1F0',
              marginBottom: 15,
            }}
          />
          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 14,
                gap: 12,
              }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={{ marginTop: 4, fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 }}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F4F3FA',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <X size={16} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          ) : null}

          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 8 }}
              bounces>
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
