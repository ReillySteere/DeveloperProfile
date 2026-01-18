import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * Input DTO for authentication credentials.
 * Part of the Anti-Corruption Layer (ACL).
 */
export class AuthCredentialsDto {
  @ApiProperty({ example: 'demo', description: 'The username of the user' })
  @IsString()
  username!: string;

  @ApiProperty({
    example: 'password',
    description: 'The password of the user',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}

/**
 * Output DTO for user data.
 * Part of the Anti-Corruption Layer (ACL).
 * Excludes sensitive fields like password.
 */
export class UserDto {
  @ApiProperty({ example: 1, description: 'The unique user identifier' })
  userId!: number;

  @ApiProperty({ example: 'demo', description: 'The username' })
  username!: string;
}

/**
 * Output DTO for authentication token response.
 * Part of the Anti-Corruption Layer (ACL).
 */
export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token!: string;
}
