/**
 * Error Handling Utilities
 * Обработка и форматиране на грешки
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * Парсва API error response
 */
export const parseApiError = (error: any): AppError => {
  if (error.response) {
    // API error response
    const { data, status } = error.response;
    return {
      message: data?.error || data?.message || 'Грешка при заявка',
      code: data?.code,
      statusCode: status,
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Няма интернет връзка. Моля, провери връзката си.',
      code: 'NETWORK_ERROR',
    };
  } else {
    // Other error
    return {
      message: error.message || 'Неочаквана грешка',
      code: 'UNKNOWN_ERROR',
    };
  }
};

/**
 * Показва user-friendly error message
 */
export const getErrorMessage = (error: AppError | Error | string): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return error.message || 'Възникна грешка';
};

