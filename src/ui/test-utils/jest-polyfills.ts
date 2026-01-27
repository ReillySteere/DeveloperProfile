/**
 * Jest Polyfills
 *
 * This file sets up global polyfills required by test dependencies.
 * It must run BEFORE any test dependencies are loaded.
 *
 * Used by: jest.browser.ts (setupFiles)
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';

// MSW's interceptors require TextEncoder/TextDecoder
// These must be set before MSW modules are imported
Object.assign(global, { TextEncoder, TextDecoder });

// MSW 2.x requires Web Streams API (TransformStream, ReadableStream, etc.)
// Node.js 18+ provides these in 'stream/web'
Object.assign(global, { ReadableStream, TransformStream, WritableStream });

// Ensure Blob and File are available
if (typeof global.Blob === 'undefined') {
  const { Blob } = require('buffer');
  Object.assign(global, { Blob });
}

// BroadcastChannel polyfill for MSW
if (typeof global.BroadcastChannel === 'undefined') {
  class BroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage() {}
    close() {}
  }
  Object.assign(global, { BroadcastChannel });
}
