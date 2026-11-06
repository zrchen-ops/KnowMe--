import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/AppButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

interface MemoryEditSheetProps {
  memoryId: string | null;
  onClose: () => void;
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: '#FAFAFE',
  borderRadius: radius.md,
  paddingHorizontal: 13,
  paddingVertical: 11,
  fontSize: 13.5,
  color: colors.text,
  lineHeight: 19,
};

export function MemoryEditSheet({ memoryId, onClose }: MemoryEditSheetProps) {
  const memory = useAppStore((state) => state.memories.find((item) => item.id === memoryId));
  const updateMemory = useAppStore((state) => state.updateMemory);
  const [content, setContent] = useState('');
  const [entityName, setEntityName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (memory) {
      setContent(memory.content);
      setEntityName(memory.payload?.entityName ?? '');
      setDescription(memory.payload?.description ?? '');
    }
  }, [memory]);

  const save = () => {
    if (!memory || content.trim().length === 0) return;
    updateMemory(memory.id, {
      content: content.trim(),
      entityName: entityName.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <BottomSheet
      visible={Boolean(memoryId)}
      onClose={onClose}
      title="编辑记忆"
      subtitle="修改会同步到图谱节点与成长中的目标，确认后生效。">
      <View style={{ gap: 14, paddingBottom: 6 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>原始描述</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="这条记忆说了什么？"
            placeholderTextColor={colors.textTertiary}
            style={[inputStyle, { minHeight: 78, textAlignVertical: 'top' }]}
          />
        </View>

        {memory?.payload?.entityName ? (
          <>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>记忆节点名称</Text>
              <TextInput
                value={entityName}
                onChangeText={setEntityName}
                placeholder="例如：通过英语六级"
                placeholderTextColor={colors.textTertiary}
                style={inputStyle}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>节点描述</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="补充一点背景，让未来的你更容易理解"
                placeholderTextColor={colors.textTertiary}
                style={[inputStyle, { minHeight: 66, textAlignVertical: 'top' }]}
              />
            </View>
          </>
        ) : null}

        <Text style={{ fontSize: 10.5, color: colors.textTertiary, lineHeight: 16 }}>
          KnowMe 会区分你的原话与 AI 推测，编辑不会改变记忆来源。
        </Text>

        <AppButton label="保存修改" onPress={save} disabled={content.trim().length === 0} />
      </View>
    </BottomSheet>
  );
}
