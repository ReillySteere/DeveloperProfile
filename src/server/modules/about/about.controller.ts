import { Controller, Get, Inject, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { IAboutService } from './about.service';
import TOKENS from './tokens';

@Controller('api/about')
export class AboutController {
  readonly #aboutService: IAboutService;

  constructor(@Inject(TOKENS.AboutService) aboutService: IAboutService) {
    this.#aboutService = aboutService;
  }

  @Get('resume')
  getResume(@Res({ passthrough: true }) res: Response): StreamableFile {
    const { stream, filename, contentType } = this.#aboutService.getResume();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return new StreamableFile(stream);
  }
}
