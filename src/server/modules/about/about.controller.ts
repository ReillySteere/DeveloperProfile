import { Controller, Get, Inject, Res, StreamableFile } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { IAboutService } from './about.service';
import TOKENS from './tokens';

@ApiTags('About')
@Controller('api/about')
export class AboutController {
  readonly #aboutService: IAboutService;

  constructor(@Inject(TOKENS.AboutService) aboutService: IAboutService) {
    this.#aboutService = aboutService;
  }

  @ApiOperation({ summary: 'Download resume' })
  @ApiResponse({
    status: 200,
    description: 'The resume file stream',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiProduces('application/pdf')
  @Get('resume')
  getResume(@Res({ passthrough: true }) res: Response): StreamableFile {
    const { stream, filename, contentType } = this.#aboutService.getResume();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return new StreamableFile(stream);
  }
}
