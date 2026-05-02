export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export type ValidatorOptions = {
  /** Override the default rejection message. */
  message?: string;
};
