import React from 'react';
import Svg, {Path} from 'react-native-svg';

interface TabIconProps {
  iconPath: string;
  color: string;
  size?: number;
}

/**
 * SVG 아이콘 컴포넌트
 * @param iconPath - SVG path 데이터
 * @param color - 아이콘 색상
 * @param size - 아이콘 크기 (기본값: 24)
 */
export function SVGIcon({iconPath, color, size = 24}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={iconPath}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
