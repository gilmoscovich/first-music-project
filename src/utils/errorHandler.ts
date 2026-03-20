export interface AppError {
  code?: string;
  message: string;
  context?: string;
}

export function logError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string }).code;
  console.error(`[${context ?? 'unknown'}]`, code ? `${code}: ` : '', message);
}
