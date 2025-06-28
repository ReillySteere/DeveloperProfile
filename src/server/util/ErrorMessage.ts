/**
 *
 * @param error - The error object to extract the message from.
 * @description This function takes an error object and returns a standardized error message.
 * @returns - A string containing the error message.
 */
const ErrorMessage = (error: unknown): string => {
  const errorMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred';

  return errorMessage;
};

export default ErrorMessage;
