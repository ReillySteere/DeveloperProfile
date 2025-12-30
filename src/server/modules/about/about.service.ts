import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { join } from 'path';
import { ResumeReadableStream } from './about.types';

export interface IAboutService {
  getResume(): ResumeReadableStream;
}

@Injectable()
export class AboutService {
  getResume(): ResumeReadableStream {
    const filename = 'ReillyGouldingResume.pdf';
    const filePath = join(process.cwd(), 'src/server/assets', filename);

    return {
      stream: createReadStream(filePath),
      filename,
      contentType: 'application/pdf',
    };
  }
}
