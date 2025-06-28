import '@testing-library/jest-dom';

import { enableFetchMocks } from 'jest-fetch-mock';
import { cleanup } from './test-utils';

/* eslint camelcase: "off" */
(global as any).__non_webpack_require__ = (path: string) => require(path);
(global as any).__webpack_public_path__ = '';

enableFetchMocks();

afterEach(cleanup);
