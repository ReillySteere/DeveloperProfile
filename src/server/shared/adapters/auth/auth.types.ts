/**
 * Business-layer types for authentication.
 *
 * These types are owned by the business layer and represent the
 * application's view of authentication concepts. They are intentionally
 * separate from the ACL DTOs used by the auth module internally.
 *
 * Adapters translate between these types and the module's internal types.
 */

/**
 * Represents an authenticated user in the business layer.
 */
export interface AuthenticatedUser {
  userId: number;
  username: string;
}

/**
 * Result of a successful authentication token generation.
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

/**
 * Credentials for authentication operations.
 */
export interface AuthCredentials {
  username: string;
  password: string;
}
