/**
 * Mock for nodemailer in tests.
 *
 * Usage:
 * ```typescript
 * import { mockNodemailer, createMockTransporter } from 'server/test-utils/mockNodemailer';
 *
 * jest.mock('nodemailer', () => mockNodemailer);
 *
 * // In test:
 * const transporter = createMockTransporter();
 * (nodemailer.createTransport as jest.Mock).mockReturnValue(transporter);
 * ```
 */

export interface MockTransporter {
  sendMail: jest.Mock;
  verify: jest.Mock;
  close: jest.Mock;
}

export interface MockNodemailer {
  createTransport: jest.Mock;
}

/**
 * Creates a fresh mock transporter.
 * Configure sendMail behavior per test.
 */
export function createMockTransporter(): MockTransporter {
  return {
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: [],
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  };
}

/**
 * Creates a fresh mock nodemailer module.
 */
export function createMockNodemailer(): MockNodemailer {
  return {
    createTransport: jest.fn().mockReturnValue(createMockTransporter()),
  };
}

/**
 * Default mock for use with jest.mock('nodemailer', () => mockNodemailer).
 */
export const mockNodemailer = createMockNodemailer();
