import { AudioLines, Mic } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppButton } from '@/components/common/AppButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { colors } from '@/constants/colors';

const SAMPLE = '今天完成了两个小时的高数复习';

interface VoiceInputSheetProps {
  visible: boolean;
  onClose: () => void;
  onTranscribed: (text: string) => void;
}

function WaveBar({ index }: { index: number }) {
  const height = useSharedValue(8);

  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(8 + ((index * 7) % 24), { duration: 320 + index * 24 }),
        withTiming(6 + ((index * 3) % 10), { duration: 360 }),
      ),
      -1,
      true,
    );
  }, [height, index]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[
        {
          width: 4,
          borderRadius: 2,
          backgroundColor: colors.brand,
          opacity: 0.85,
        },
        style,
      ]}
    />
  );
}

export function VoiceInputSheet({ visible, onClose, onTranscribed }: VoiceInputSheetProps) {
  const [transcribing, setTranscribing] = useState(false);

  const finish = () => {
    setTranscribing(true);
    setTimeout(() => {
      setTranscribing(false);
      onTranscribed(SAMPLE);
      onClose();
    }, 800);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="语音输入"
      subtitle="演示模式 · 接入后端语音服务后即可真实转写">
      <View style={{ alignItems: 'center', paddingBottom: 10, gap: 18 }}>
        <View
          style={{
            width: 86,
            height: 86,
            borderRadius: 43,
            backgroundColor: colors.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#E4DEFF',
          }}>
          <Mic size={30} color={colors.brand} strokeWidth={1.9} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 40 }}>
          {Array.from({ length: 17 }).map((_, index) => (
            <WaveBar key={index} index={index} />
          ))}
        </View>

        <View style={{ alignItems: 'center', gap: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <AudioLines size={13} color={colors.brand} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
              {transcribing ? '正在转写…' : '正在聆听…'}
            </Text>
          </View>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 17 }}>
            说一句关于今天的话，例如「今天完成了两个小时的高数复习」
          </Text>
        </View>

        <AppButton
          label={transcribing ? '正在转写' : '结束录音并转写'}
          onPress={finish}
          disabled={transcribing}
          style={{ alignSelf: 'stretch' }}
        />
      </View>
    </BottomSheet>
  );
}
