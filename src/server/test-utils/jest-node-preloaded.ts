// @ts-expect-error - setup script
global.self = {};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

process.env.JWT_AUTH_SECRET = 'test-secret';

afterAll(() => {
  jest.clearAllMocks();
});
