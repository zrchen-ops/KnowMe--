import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { LogoMark } from '@/components/common/LogoMark';
import { PlanCard } from './PlanCard';
import { MemoryConfirmCard } from './MemoryConfirmCard';
import { ReviewMiniCard } from './ReviewMiniCard';
import { TipCard } from './TipCard';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  onOpenMemory: (memoryId: string) => void;
  onOpenTask: (id: string) => void;
  onOpenGraph: () => void;
  onOpenReview: () => void;
}

export function ChatBubble({ message, onOpenMemory, onOpenTask, onOpenGraph, onOpenReview }: ChatBubbleProps) {
  if (message.role === 'user') {
    return (
      <AnimatedBubble align="right">
        <LinearGradient
          colors={colors.gradients.brandDeep}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 11,
            borderRadius: radius.lg,
            borderBottomRightRadius: 6,
            maxWidth: '85%',
            shadowColor: colors.brandDark,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.16,
            shadowRadius: 12,
          }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 21 }}>{message.text}</Text>
        </LinearGradient>
      </AnimatedBubble>
    );
  }

  return (
    <AnimatedBubble align="left">
      <LogoMark size={27} />
      <View style={{ flex: 1, gap: 8, maxWidth: '92%' }}>
        {message.kind === 'tip' ? (
          <TipCard />
        ) : (
          <>
            {message.text ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.card,
                  borderRadius: radius.lg,
                  borderBottomLeftRadius: 7,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  shadowColor: '#2C2452',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                }}>
                <Text style={{ fontSize: 13.5, lineHeight: 20.5, color: colors.text }}>{message.text}</Text>
              </View>
            ) : null}
            {message.kind === 'plan' && message.taskIds ? (
              <PlanCard taskIds={message.taskIds} onOpenTask={onOpenTask} />
            ) : null}
            {message.kind === 'memory' && message.memoryId ? (
              <MemoryConfirmCard
                memoryId={message.memoryId}
                onEdit={onOpenMemory}
                onOpenGraph={onOpenGraph}
              />
            ) : null}
            {message.kind === 'review' ? <ReviewMiniCard onOpenReview={onOpenReview} /> : null}
          </>
        )}
      </View>
    </AnimatedBubble>
  );
}

function AnimatedBubble({ align, children }: { align: 'left' | 'right'; children: ReactNode }) {
  return (
    <Animated.View
      entering={FadeInUp.duration(260)}
      style={{
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 7,
        width: '100%',
      }}>
      {children}
    </Animated.View>
  );
}
