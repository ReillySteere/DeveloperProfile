import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface ApiRootResponse {
  name: string;
  version: string;
  documentation: string;
  endpoints: {
    about: string;
    experience: string;
    projects: string;
    blog: string;
    architecture: string;
    auth: string;
    health: string;
    traces: string;
  };
}

@ApiTags('API Root')
@Controller('api')
export class ApiRootController {
  @ApiOperation({ summary: 'Get API information and available endpoints' })
  @ApiResponse({
    status: 200,
    description: 'API discovery information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Developer Profile API' },
        version: { type: 'string', example: '1.5.0' },
        documentation: { type: 'string', example: '/api/docs' },
        endpoints: {
          type: 'object',
          properties: {
            about: { type: 'string', example: '/api/about' },
            experience: { type: 'string', example: '/api/experience' },
            projects: { type: 'string', example: '/api/projects' },
            blog: { type: 'string', example: '/api/blog' },
            architecture: { type: 'string', example: '/api/architecture' },
            auth: { type: 'string', example: '/api/auth' },
            health: { type: 'string', example: '/api/health' },
            traces: { type: 'string', example: '/api/traces' },
          },
        },
      },
    },
  })
  @Get()
  getApiRoot(): ApiRootResponse {
    return {
      name: 'Developer Profile API',
      version: process.env.npm_package_version || '1.5.0',
      documentation: '/api/docs',
      endpoints: {
        about: '/api/about',
        experience: '/api/experience',
        projects: '/api/projects',
        blog: '/api/blog',
        architecture: '/api/architecture',
        auth: '/api/auth',
        health: '/api/health',
        traces: '/api/traces',
      },
    };
  }
}
