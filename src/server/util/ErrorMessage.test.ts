import ErrorMessage from './ErrorMessage';

describe('ErrorMessage utility function', () => {
  it('should return the error message when passed an Error object', () => {
    const testError = new Error('Test error message');
    const result = ErrorMessage(testError);
    expect(result).toBe('Test error message');
  });

  it('should return generic message when passed a non-Error value', () => {
    const result = ErrorMessage('not an error');
    expect(result).toBe('An unexpected error occurred');
  });

  it('should return generic message when passed null', () => {
    const result = ErrorMessage(null);
    expect(result).toBe('An unexpected error occurred');
  });

  it('should return generic message when passed undefined', () => {
    const result = ErrorMessage(undefined);
    expect(result).toBe('An unexpected error occurred');
  });
});
