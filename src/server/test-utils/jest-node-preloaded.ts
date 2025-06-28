// @ts-expect-error - setup script
global.self = {};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

afterAll(() => {
  jest.clearAllMocks();
});
