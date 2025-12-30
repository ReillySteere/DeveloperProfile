import type { Readable } from 'node:stream';

export interface ResumeReadableStream {
  stream: Readable;
  filename: string;
  contentType: string;
}
