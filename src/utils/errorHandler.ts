export interface AppError {
  code?: string;
  message: string;
  context?: string;
}

const errors: AppError[] = [];

export const logError = (error: unknown, context?: string): AppError => {
  const appError: AppError = {
    message: error instanceof Error ? error.message : String(error),
    code: (error as { code?: string }).code,
    context,
  };
  errors.push(appError);
  return appError;
};

export const getErrors = (): AppError[] => [...errors];
