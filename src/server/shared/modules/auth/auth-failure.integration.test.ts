import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { User } from './user.entity';

describe('Auth Module Configuration Failure', () => {
  const originalSecret = process.env.JWT_AUTH_SECRET;

  beforeAll(() => {
    delete process.env.JWT_AUTH_SECRET;
  });

  afterAll(() => {
    process.env.JWT_AUTH_SECRET = originalSecret;
  });

  it('should throw error if JWT_AUTH_SECRET is not defined', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [User],
            synchronize: true,
          }),
          AuthModule,
        ],
      }).compile(),
    ).rejects.toThrow('JWT_AUTH_SECRET is not defined');
  });
});
