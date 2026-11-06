import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/common/AppButton';
import { BottomSheet } from '@/components/common/BottomSheet';
import { FilterChip } from '@/components/common/FilterChip';
import { colors, entityTones } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import type { Entity, EntityType } from '@/types';

interface NodeEditorSheetProps {
  visible: boolean;
  entity: Entity | null;
  onClose: () => void;
}

const TYPE_OPTIONS: EntityType[] = ['goal', 'plan', 'person', 'event', 'interest', 'career'];

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

export function NodeEditorSheet({ visible, entity, onClose }: NodeEditorSheetProps) {
  const addEntity = useAppStore((state) => state.addEntity);
  const updateEntity = useAppStore((state) => state.updateEntity);
  const relations = useAppStore((state) => state.relations);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EntityType>('goal');
  const [relationType, setRelationType] = useState('关联');

  useEffect(() => {
    if (!visible) return;
    if (entity) {
      const currentRelation = relations.find(
        (relation) => relation.targetId === entity.id,
      );
      setName(entity.name);
      setDescription(entity.description);
      setType(entity.type);
      setRelationType(currentRelation?.relationType ?? '关联');
    } else {
      setName('');
      setDescription('');
      setType('goal');
      setRelationType('关联');
    }
  }, [entity, relations, visible]);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (entity) {
      updateEntity(entity.id, {
        name: trimmed,
        type,
        description: description.trim(),
        relationType,
      });
    } else {
      addEntity({
        name: trimmed,
        type,
        description: description.trim(),
        relationType: relationType.trim() || '关联',
      });
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={entity ? '编辑节点' : '添加记忆节点'}
      subtitle={entity ? '修改会同步到图谱与关联的目标。' : '把重要的人、目标、事件放进你的记忆图谱。'}>
      <View style={{ gap: 14, paddingBottom: 6 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>节点名称</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例如：通过英语六级"
            placeholderTextColor={colors.textTertiary}
            style={inputStyle}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>节点类型</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option}
                label={entityTones[option].label}
                compact
                active={type === option}
                onPress={() => setType(option)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>
            与「我」的关系
          </Text>
          <TextInput
            value={relationType}
            onChangeText={setRelationType}
            placeholder="拥有目标 / 认识 / 兴趣"
            placeholderTextColor={colors.textTertiary}
            style={inputStyle}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' }}>描述</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="为什么它对你重要？"
            placeholderTextColor={colors.textTertiary}
            style={[inputStyle, { minHeight: 76, textAlignVertical: 'top' }]}
          />
        </View>

        <Text style={{ fontSize: 10.5, color: colors.textTertiary, lineHeight: 16 }}>
          手动添加的节点会以「用户提供」的记忆来源保存，并可在图谱中随时修改或删除。
        </Text>

        <AppButton
          label={entity ? '保存修改' : '添加到图谱'}
          onPress={save}
          disabled={name.trim().length === 0}
        />
      </View>
    </BottomSheet>
  );
}
