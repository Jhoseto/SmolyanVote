/**
 * Validation Utilities
 * Валидация на user input
 */

/**
 * Валидира email адрес
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Валидира парола (минимум 6 символа)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Валидира username (букви, цифри, подчертавки, минимум 3 символа)
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  return usernameRegex.test(username);
};

/**
 * Валидира message text (не празно, максимум 1000 символа)
 */
export const isValidMessage = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
};

