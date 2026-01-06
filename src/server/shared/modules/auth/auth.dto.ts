import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

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
