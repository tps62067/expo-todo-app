import { randomUUID } from 'expo-crypto';

/**
 * 生成UUID v4
 */
export const generateUUID = (): string => {
  return randomUUID();
};

/**
 * 验证UUID格式
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}; 