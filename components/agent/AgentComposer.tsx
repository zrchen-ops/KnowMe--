import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUp, Mic } from 'lucide-react-native';
import { Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/common/PressableScale';
import { colors } from '@/constants/colors';

interface AgentComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onVoice: () => void;
  typing: boolean;
}

export function AgentComposer({ value, onChangeText, onSend, onVoice, typing }: AgentComposerProps) {
  const canSend = value.trim().length > 0 && !typing;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderRadius: 26,
          borderWidth: 1,
          borderColor: '#E8E7F2',
          paddingLeft: 6,
          paddingRight: 6,
          paddingVertical: 6,
          shadowColor: '#2A2350',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 3,
        }}>
        <PressableScale
          onPress={onVoice}
          accessibilityRole="button"
          accessibilityLabel="语音输入"
          haptic
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#F5F4FB',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Mic size={17} color={colors.textSecondary} strokeWidth={1.9} />
        </PressableScale>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="有什么想问的都可以..."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={240}
          style={{
            flex: 1,
            minHeight: 38,
            maxHeight: 96,
            paddingVertical: 9,
            paddingHorizontal: 2,
            fontSize: 13.5,
            lineHeight: 19,
            color: colors.text,
          }}
        />

        <PressableScale
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="发送消息"
          haptic
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canSend ? 1 : 0.45,
          }}>
          <LinearGradient
            colors={colors.gradients.brandDeep}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <ArrowUp size={17} color="#FFFFFF" strokeWidth={2.4} />
        </PressableScale>
      </View>
      <Text style={{ fontSize: 9.5, color: colors.textTertiary, textAlign: 'center', marginTop: 7 }}>
        AI 生成内容仅供参考 · 记忆需由你确认
      </Text>
    </View>
  );
}
