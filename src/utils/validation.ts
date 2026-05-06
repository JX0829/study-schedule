/**
 * 输入验证工具函数
 * 
 * 提供统一的输入校验逻辑，避免各组件重复实现
 */

/**
 * 校验并解析整数输入
 * @returns [有效值, 是否合法]
 */
export function parseIntegerInput(value: string, min = -Infinity, max = Infinity): [number, boolean] {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return [0, false];
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return [0, false];
  if (num < min || num > max) return [num, false];
  return [num, true];
}

/**
 * 校验积分值（1-999 范围）
 */
export function validatePointsInput(value: string): [number, boolean] {
  return parseIntegerInput(value, 1, 999);
}

/**
 * 校验概率百分比（0-100）
 */
export function validateProbabilityInput(value: string): [number, boolean] {
  return parseIntegerInput(value, 0, 100);
}

/**
 * 校验名称（非空、长度限制）
 */
export function validateName(value: string, maxLength = 20): { valid: boolean; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: '名称不能为空' };
  if (trimmed.length > maxLength) return { valid: false, error: `名称不能超过${maxLength}个字符` };
  return { valid: true };
}

/**
 * 校验密码（至少4位）
 */
export function validatePassword(value: string): { valid: boolean; error?: string } {
  if (value.length < 4) return { valid: false, error: '密码至少4位' };
  return { valid: true };
}
