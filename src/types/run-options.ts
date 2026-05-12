/**
 * Options for the asynchronous run() method.
 */
export interface RunOptions<T = unknown> {
  showError?: boolean;
  onSuccess?: (result: T) => void;
  onError?: (error: unknown) => void;
  onStop?: () => void;
  abortSignal?: AbortSignal;
  successMessage?: string;
}
