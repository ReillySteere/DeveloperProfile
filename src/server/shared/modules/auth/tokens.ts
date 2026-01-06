const TOKENS = {
  AuthService: Symbol('AuthService'),
  JwtAuthGuard: Symbol('JwtAuthGuard'),
  JwtStrategy: Symbol('JwtStrategy'),
} as const;

export default TOKENS;
