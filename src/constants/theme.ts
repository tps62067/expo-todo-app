/**
 * 设计系统常量文件
 * 集中管理应用中使用的所有设计令牌（颜色、字体、间距等）
 */

// 颜色系统
export const COLORS = {
  // 主要颜色
  primary: '#5271FF',
  accent: '#FF7052',
  
  // 背景颜色
  bgColor: '#F5F7FA',
  
  // 文本颜色
  textColor: '#333333',
  
  // 基础颜色
  white: '#FFFFFF',
  black: '#000000',
  
  // 灰度色阶
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // 功能色
  success: '#10B981', // 成功
  warning: '#F59E0B', // 警告
  danger: '#EF4444',  // 危险
  info: '#3B82F6',    // 信息
  
  // 优先级颜色
  highPriority: '#E53935',
  mediumPriority: '#FB8C00',
  lowPriority: '#43A047',
  
  // 笔记颜色
  notePink: '#FFE4E1',    // 浅粉色
  noteBlue: '#E1F5FE',    // 浅蓝色
  notePurple: '#F3E5F5',  // 浅紫色
  noteGreen: '#E8F5E8',   // 浅绿色
  noteOrange: '#FFF3E0',  // 浅橙色
  noteGray: '#F5F5F5',    // 浅灰色
  noteSkyBlue: '#E3F2FD', // 天蓝色
  noteRose: '#FCE4EC',    // 玫瑰色
  
  // 边框颜色
  border: '#E5E7EB',
};

// 字体大小
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

// 字体粗细
export const FONT_WEIGHT = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// 间距系统
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// 圆角大小
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// 阴影样式
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
};

// 动画时间
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// 导出默认主题
const theme = {
  COLORS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
};

export default theme;