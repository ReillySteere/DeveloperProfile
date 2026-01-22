import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IArchitectureService } from './architecture.service';
import TOKENS from './tokens';
import {
  Adr,
  AdrListItem,
  ComponentDoc,
  ComponentDocSummary,
  DependencyGraphsData,
  FocusedDependencyGraph,
} from 'shared/types';

@ApiTags('Architecture')
@Controller('api/architecture')
export class ArchitectureController {
  constructor(
    @Inject(TOKENS.ArchitectureService)
    private readonly architectureService: IArchitectureService,
  ) {}

  @ApiOperation({ summary: 'List all Architecture Decision Records' })
  @ApiResponse({ status: 200, description: 'List of ADRs with metadata' })
  @Get('adrs')
  async findAllAdrs(): Promise<AdrListItem[]> {
    return this.architectureService.findAllAdrs();
  }

  @ApiOperation({ summary: 'Get a single ADR by slug' })
  @ApiParam({ name: 'slug', example: 'ADR-001-persistent-storage-for-blog' })
  @ApiResponse({ status: 200, description: 'The requested ADR' })
  @ApiResponse({ status: 404, description: 'ADR not found' })
  @Get('adrs/:slug')
  async findAdrBySlug(@Param('slug') slug: string): Promise<Adr> {
    const adr = await this.architectureService.findAdrBySlug(slug);
    if (!adr) {
      throw new NotFoundException(`ADR "${slug}" not found`);
    }
    return adr;
  }

  @ApiOperation({ summary: 'List all component documentation' })
  @ApiResponse({ status: 200, description: 'List of component docs' })
  @Get('components')
  async findAllComponents(): Promise<ComponentDocSummary[]> {
    return this.architectureService.findAllComponents();
  }

  @ApiOperation({ summary: 'Get component documentation by name' })
  @ApiParam({ name: 'slug', example: 'blog' })
  @ApiResponse({ status: 200, description: 'The component documentation' })
  @ApiResponse({ status: 404, description: 'Component doc not found' })
  @Get('components/:slug')
  async findComponentBySlug(
    @Param('slug') slug: string,
  ): Promise<ComponentDoc> {
    const doc = await this.architectureService.findComponentBySlug(slug);
    if (!doc) {
      throw new NotFoundException(
        `Component documentation "${slug}" not found`,
      );
    }
    return doc;
  }

  @ApiOperation({ summary: 'Get all dependency graphs metadata' })
  @ApiResponse({ status: 200, description: 'Dependency graphs data' })
  @ApiResponse({ status: 404, description: 'Graphs not generated' })
  @Get('dependencies')
  async getDependencyGraphs(): Promise<DependencyGraphsData> {
    return this.architectureService.getDependencyGraphs();
  }

  @ApiOperation({ summary: 'Get focused dependency graph for a target' })
  @ApiParam({ name: 'scope', enum: ['ui', 'server'] })
  @ApiParam({ name: 'target', example: 'blog' })
  @ApiResponse({ status: 200, description: 'Focused dependency graph' })
  @ApiResponse({ status: 404, description: 'Graph not found' })
  @Get('dependencies/:scope/:target')
  async getDependencyGraphByTarget(
    @Param('scope') scope: 'ui' | 'server',
    @Param('target') target: string,
  ): Promise<FocusedDependencyGraph> {
    return this.architectureService.getDependencyGraphByTarget(scope, target);
  }
}
