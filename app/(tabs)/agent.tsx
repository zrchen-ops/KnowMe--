import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentComposer } from '@/components/agent/AgentComposer';
import { ChatBubble } from '@/components/agent/ChatBubble';
import { QuickActions } from '@/components/agent/QuickActions';
import { TypingIndicator } from '@/components/agent/TypingIndicator';
import { VoiceInputSheet } from '@/components/agent/VoiceInputSheet';
import { LogoMark } from '@/components/common/LogoMark';
import { IconButton } from '@/components/common/IconButton';
import { ScreenBackground } from '@/components/common/ScreenBackground';
import { MemoryEditSheet } from '@/components/memory/MemoryEditSheet';
import { colors } from '@/constants/colors';
import { useAgentChat } from '@/hooks/useAgentChat';
import { useAppStore } from '@/store/useAppStore';
import { greetingForHour } from '@/utils/date';

export default function AgentScreen() {
  const insets = useSafeAreaInsets();
  const messages = useAppStore((state) => state.messages);
  const displayName = useAppStore((state) => state.settings.displayName);
  const { send, typing } = useAgentChat();
  const [input, setInput] = useState('');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const mounted = useRef(false);

  const scrollToEnd = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = setTimeout(() => scrollToEnd(true), 80);
    return () => clearTimeout(timer);
  }, [messages.length, typing, scrollToEnd]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void send(text);
  };

  const openMemoryForEdit = (memoryId: string) => setEditingMemoryId(memoryId);

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 40,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <LogoMark size={34} />
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
                  KnowMe
                </Text>
                <Text style={{ fontSize: 9.5, color: colors.textTertiary, letterSpacing: 1.4 }}>
                  KNOW ME · 知我
                </Text>
              </View>
            </View>
            <IconButton
              icon={SlidersHorizontal}
              onPress={() => router.push('/settings')}
              label="设置"
              size={17}
            />
          </View>

          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 27,
                fontWeight: '700',
                color: colors.text,
                letterSpacing: -0.8,
                lineHeight: 36,
              }}>
              {greetingForHour()}，{displayName} 👋
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
              今天也要加油呀！
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, marginTop: 8 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 13,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              onOpenMemory={openMemoryForEdit}
              onOpenTask={(id) => router.push({ pathname: '/task/[id]', params: { id } })}
              onOpenGraph={() => router.navigate('/graph')}
              onOpenReview={() => router.push('/review')}
            />
          ))}
          {typing ? <TypingIndicator /> : null}

          <QuickActions
            onMemory={() => router.navigate('/graph')}
            onGoal={() => router.push('/goal/create')}
            onReview={() => router.push('/review')}
          />
          <View style={{ height: 2 }} />
        </ScrollView>

        <View style={{ paddingBottom: Math.max(insets.bottom, 10) + 62 }}>
          <AgentComposer
            value={input}
            onChangeText={setInput}
            onSend={handleSend}
            onVoice={() => setVoiceVisible(true)}
            typing={typing}
          />
        </View>
      </KeyboardAvoidingView>

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(245,245,252,0)', 'rgba(245,245,252,0.9)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.max(insets.bottom, 10) + 70 }}
      />

      <VoiceInputSheet
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        onTranscribed={(text) => setInput((prev) => (prev ? `${prev}${text}` : text))}
      />
      <MemoryEditSheet memoryId={editingMemoryId} onClose={() => setEditingMemoryId(null)} />
    </ScreenBackground>
  );
}
