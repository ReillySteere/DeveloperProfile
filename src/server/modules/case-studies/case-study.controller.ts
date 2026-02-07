import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Inject,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ICaseStudyService } from './case-study.service';
import TOKENS from './tokens';
import { CaseStudy } from './case-study.entity';
import { CreateCaseStudyDto } from './dto/create-case-study.dto';
import { UpdateCaseStudyDto } from './dto/update-case-study.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuardAdapter } from 'server/shared/adapters/auth';

@ApiTags('Case Studies')
@Controller('api/case-studies')
export class CaseStudyController {
  readonly #caseStudyService: ICaseStudyService;

  constructor(
    @Inject(TOKENS.CaseStudyService)
    caseStudyService: ICaseStudyService,
  ) {
    this.#caseStudyService = caseStudyService;
  }

  @ApiOperation({ summary: 'Retrieve all published case studies' })
  @ApiResponse({
    status: 200,
    description: 'List of published case studies',
  })
  @Get()
  findAll(): Promise<CaseStudy[]> {
    return this.#caseStudyService.findPublished();
  }

  @ApiOperation({ summary: 'Retrieve case study by project ID' })
  @ApiParam({
    name: 'projectId',
    type: 'string',
    description: 'ID of the project',
    example: 'uuid-1234',
  })
  @ApiResponse({
    status: 200,
    description: 'The case study for the project',
  })
  @ApiResponse({
    status: 404,
    description: 'No case study found for this project',
  })
  @Get('project/:projectId')
  async findByProjectId(
    @Param('projectId') projectId: string,
  ): Promise<CaseStudy> {
    const caseStudy = await this.#caseStudyService.findByProjectId(projectId);
    if (!caseStudy) {
      throw new NotFoundException(
        `No case study found for project "${projectId}"`,
      );
    }
    return caseStudy;
  }

  @ApiOperation({ summary: 'Retrieve a single case study by slug' })
  @ApiParam({
    name: 'slug',
    type: 'string',
    description: 'Slug of the case study',
    example: 'checkout-migration',
  })
  @ApiResponse({
    status: 200,
    description: 'The requested case study',
  })
  @ApiResponse({
    status: 404,
    description: 'Case study not found',
  })
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<CaseStudy> {
    return this.#caseStudyService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Create a new case study' })
  @ApiBody({
    type: CreateCaseStudyDto,
    description: 'Data for the new case study',
  })
  @ApiResponse({
    status: 201,
    description: 'The created case study',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuardAdapter)
  @Post()
  create(@Body() createCaseStudyDto: CreateCaseStudyDto): Promise<CaseStudy> {
    return this.#caseStudyService.create(createCaseStudyDto);
  }

  @ApiOperation({ summary: 'Update an existing case study' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID of the case study to update',
    example: 'uuid-1234',
  })
  @ApiBody({
    type: UpdateCaseStudyDto,
    description: 'Data to update the case study',
  })
  @ApiResponse({
    status: 200,
    description: 'The updated case study',
  })
  @ApiResponse({
    status: 404,
    description: 'Case study not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuardAdapter)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCaseStudyDto: UpdateCaseStudyDto,
  ): Promise<CaseStudy> {
    return this.#caseStudyService.update(id, updateCaseStudyDto);
  }

  @ApiOperation({ summary: 'Delete a case study' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID of the case study to delete',
    example: 'uuid-1234',
  })
  @ApiResponse({
    status: 204,
    description: 'Case study deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Case study not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuardAdapter)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.#caseStudyService.delete(id);
  }
}
