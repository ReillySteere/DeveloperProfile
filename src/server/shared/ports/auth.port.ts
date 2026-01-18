import { CanActivate } from '@nestjs/common';

/**
 * Port interface for authentication operations.
 *
 * This defines the contract that the authentication adapter must implement.
 * Business modules should depend on this interface, not the concrete implementation.
 */
export interface IAuthenticationPort {
  /**
   * Validates user credentials and returns the authenticated user if valid.
   * @param username - The username to validate
   * @param password - The password to validate
   * @returns The authenticated user or null if credentials are invalid
   */
  validateCredentials(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser | null>;

  /**
   * Generates an access token for the authenticated user.
   * @param user - The authenticated user
   * @returns The token result containing the access token
   */
  generateToken(user: AuthenticatedUser): TokenResult;

  /**
   * Creates a new user account.
   * @param username - The username for the new account
   * @param password - The password for the new account
   * @returns The created account details
   */
  createAccount(
    username: string,
    password: string,
  ): Promise<AccountCreationResult>;
}

/**
 * Port interface for authentication guard operations.
 *
 * This wraps the JWT authentication guard functionality.
 * Extends CanActivate to ensure compatibility with NestJS guards.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAuthGuardPort extends CanActivate {}

/**
 * Business-layer representation of an authenticated user.
 * This type is owned by the business layer, not the auth module.
 */
export interface AuthenticatedUser {
  userId: number;
  username: string;
}

/**
 * Result of a successful token generation.
 */
export interface TokenResult {
  accessToken: string;
}

/**
 * Result of a successful account creation.
 */
export interface AccountCreationResult {
  userId: number;
  username: string;
}
