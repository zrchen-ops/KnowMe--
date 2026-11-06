import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { colors } from '@/constants/colors';

interface LogoMarkProps {
  size?: number;
}

export function LogoMark({ size = 40 }: LogoMarkProps) {
  const radiusValue = size * 0.28;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radiusValue,
        overflow: 'hidden',
        shadowColor: colors.brandDark,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 4,
      }}>
      <LinearGradient
        colors={['#7C6CF7', '#5E4FE0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24">
          <Line x1="12" y1="12" x2="6.4" y2="7.6" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} />
          <Line x1="12" y1="12" x2="18" y2="6.6" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.2} />
          <Line x1="12" y1="12" x2="17.4" y2="17.2" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.2} />
          <Line x1="12" y1="12" x2="7" y2="17.4" stroke="#FFFFFF" strokeOpacity={0.38} strokeWidth={1.2} />
          <Circle cx="12" cy="12" r="3" fill="#FFFFFF" />
          <Circle cx="6.4" cy="7.6" r="2.1" fill="#FFFFFF" fillOpacity={0.9} />
          <Circle cx="18" cy="6.6" r="1.75" fill="#FFFFFF" fillOpacity={0.82} />
          <Circle cx="17.4" cy="17.2" r="2.1" fill="#FFFFFF" fillOpacity={0.86} />
          <Circle cx="7" cy="17.4" r="1.65" fill="#FFFFFF" fillOpacity={0.72} />
        </Svg>
      </LinearGradient>
    </View>
  );
}
