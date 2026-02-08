import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IPlaygroundService } from './playground.service';
import TOKENS from './tokens';
import { ComponentMetadata, CompositionTemplate } from 'shared/types';

@ApiTags('Playground')
@Controller('api/playground')
export class PlaygroundController {
  constructor(
    @Inject(TOKENS.PlaygroundService)
    private readonly playgroundService: IPlaygroundService,
  ) {}

  @ApiOperation({ summary: 'List all playground components' })
  @ApiResponse({
    status: 200,
    description: 'Array of component metadata',
  })
  @Get('components')
  async getAllComponents(): Promise<ComponentMetadata[]> {
    return this.playgroundService.getAllComponents();
  }

  @ApiOperation({ summary: 'Get a single component by name' })
  @ApiParam({ name: 'name', example: 'Button' })
  @ApiResponse({ status: 200, description: 'Component metadata' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @Get('components/:name')
  async getComponent(@Param('name') name: string): Promise<ComponentMetadata> {
    const component = await this.playgroundService.getComponent(name);
    if (!component) {
      throw new NotFoundException(`Component "${name}" not found`);
    }
    return component;
  }

  @ApiOperation({ summary: 'Get component MDX documentation' })
  @ApiParam({ name: 'name', example: 'VitalGauge' })
  @ApiResponse({ status: 200, description: 'Component documentation content' })
  @ApiResponse({ status: 404, description: 'Documentation not found' })
  @Get('components/:name/docs')
  async getComponentDocs(
    @Param('name') name: string,
  ): Promise<{ content: string }> {
    const docs = await this.playgroundService.getComponentDocs(name);
    if (!docs) {
      throw new NotFoundException(`Documentation for "${name}" not found`);
    }
    return docs;
  }

  @ApiOperation({ summary: 'List all composition templates' })
  @ApiResponse({
    status: 200,
    description: 'Array of composition templates',
  })
  @Get('compositions')
  async getCompositionTemplates(): Promise<CompositionTemplate[]> {
    return this.playgroundService.getCompositionTemplates();
  }
}
