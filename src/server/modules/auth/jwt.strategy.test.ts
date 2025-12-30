import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  beforeEach(() => {
    jwtStrategy = new JwtStrategy();
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the user object extracted from the payload', async () => {
      const payload = { sub: 1, username: 'testUser' };
      const result = await jwtStrategy.validate(payload);
      expect(result).toEqual({
        userId: payload.sub,
        username: payload.username,
      });
    });
  });
});
