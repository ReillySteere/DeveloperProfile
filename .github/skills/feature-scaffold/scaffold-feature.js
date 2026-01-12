const fs = require('fs');
const path = require('path');

const inputArgs = process.argv.slice(2);
if (inputArgs.length === 0) {
  console.error(
    'Please provide a feature name. Usage: node scaffold-feature.js <name>',
  );
  process.exit(1);
}

// Parse logic
const words = inputArgs
  .join(' ')
  .trim()
  .split(/[\s-_]+/);
const PascalCase = words
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  .join('');
const camelCase = PascalCase.charAt(0).toLowerCase() + PascalCase.slice(1);
const featureName = camelCase; // Use camelCase for file/folder names

const rootDir = path.resolve(__dirname, '../../../');
const srcServer = path.join(rootDir, 'src', 'server', 'modules', featureName);
const srcUi = path.join(rootDir, 'src', 'ui', 'containers', featureName);
const srcShared = path.join(rootDir, 'src', 'shared', 'types');
const srcRoutes = path.join(rootDir, 'src', 'ui', 'shared', 'routes');

function createDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
}

function writeFile(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created: ${filePath}`);
  } else {
    console.log(`Skipped (exists): ${filePath}`);
  }
}

console.log(`Scaffolding feature: ${featureName}`);
console.log(`PascalCase: ${PascalCase}`);
console.log(`camelCase: ${camelCase}`);

// Server Scaffolding
createDir(srcServer);

// 1. Tokens
writeFile(
  path.join(srcServer, 'tokens.ts'),
  `
const TOKENS = {
  ${PascalCase}Service: Symbol('${PascalCase}Service'),
};
export default TOKENS;
`,
);

// 2. Service
writeFile(
  path.join(srcServer, `${featureName}.service.ts`),
  `
import { Injectable } from '@nestjs/common';

export interface I${PascalCase}Service {
  findAll(): Promise<any[]>;
}

@Injectable()
export class ${PascalCase}Service implements I${PascalCase}Service {
  async findAll() {
    return [];
  }
}
`,
);

// 3. Controller
writeFile(
  path.join(srcServer, `${featureName}.controller.ts`),
  `
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { I${PascalCase}Service } from './${featureName}.service';
import TOKENS from './tokens';

@ApiTags('${PascalCase}')
@Controller('api/${featureName}')
export class ${PascalCase}Controller {
  constructor(
    @Inject(TOKENS.${PascalCase}Service) private readonly service: I${PascalCase}Service
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${featureName}' })
  findAll() {
    return this.service.findAll();
  }
}
`,
);

// 4. Module
writeFile(
  path.join(srcServer, `${featureName}.module.ts`),
  `
import { Module } from '@nestjs/common';
import { ${PascalCase}Controller } from './${featureName}.controller';
import { ${PascalCase}Service } from './${featureName}.service';
import TOKENS from './tokens';

@Module({
  controllers: [${PascalCase}Controller],
  providers: [
    {
      provide: TOKENS.${PascalCase}Service,
      useClass: ${PascalCase}Service,
    },
  ],
})
export class ${PascalCase}Module {}
`,
);

// 5. Integration Test
writeFile(
  path.join(srcServer, `${featureName}.integration.test.ts`),
  `
import { Test, TestingModule } from '@nestjs/testing';
import { ${PascalCase}Module } from './${featureName}.module';
import { I${PascalCase}Service } from './${featureName}.service';
import { ${PascalCase}Controller } from './${featureName}.controller';
import TOKENS from './tokens';

describe('${PascalCase} Integration', () => {
  let module: TestingModule;
  let service: I${PascalCase}Service;
  let controller: ${PascalCase}Controller;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ${PascalCase}Module,
      ],
    }).compile();

    service = module.get<I${PascalCase}Service>(TOKENS.${PascalCase}Service);
    controller = module.get<${PascalCase}Controller>(${PascalCase}Controller);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should return data via controller', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([]);
  });
});
`,
);

// UI Scaffolding
createDir(srcUi);
createDir(path.join(srcUi, 'components'));
createDir(path.join(srcUi, 'hooks'));

// Container
writeFile(
  path.join(srcUi, `${featureName}.container.tsx`),
  `
import React from 'react';
import { use${PascalCase} } from './hooks/use${PascalCase}';

export default function ${PascalCase}Container() {
  const { data, isLoading } = use${PascalCase}();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>${PascalCase} Feature</h1>
    </div>
  );
}
`,
);

// Hook
writeFile(
  path.join(srcUi, 'hooks', `use${PascalCase}.ts`),
  `
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const use${PascalCase} = () => {
  return useQuery({
    queryKey: ['${featureName}'],
    queryFn: async () => {
      const { data } = await axios.get('/api/${featureName}');
      return data;
    },
  });
};
`,
);

// UI Integration Test
writeFile(
  path.join(srcUi, `${featureName}.container.test.tsx`),
  `
import React from 'react';
import { render, screen, waitFor } from 'ui/test-utils';
import axios from 'axios';
import ${PascalCase}Container from './${featureName}.container';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('${PascalCase}Container', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
    render(<${PascalCase}Container />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders content when data fetching succeeds', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    render(<${PascalCase}Container />);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /${PascalCase} Feature/i })).toBeInTheDocument();
    });
  });
});
`,
);

// Route
if (!fs.existsSync(srcRoutes)) {
  // Should exist in this project, but safe check
  fs.mkdirSync(srcRoutes, { recursive: true });
}

writeFile(
  path.join(srcRoutes, `${featureName}.tsx`),
  `
import { createFileRoute } from '@tanstack/react-router';
import ${PascalCase}Container from 'ui/containers/${featureName}/${featureName}.container';

export const Route = createFileRoute('/${featureName}')({
  component: ${PascalCase}Container,
});
`,
);

// Shared Types
createDir(srcShared);
writeFile(
  path.join(srcShared, `${featureName}.types.ts`),
  `
// Shared types for ${featureName}
export interface ${PascalCase}Dto {
  id: string;
}
`,
);

console.log(`\nSuccess! Scaffolding complete for feature: ${featureName}`);
console.log(
  `\nNext Steps:\n1. Register ${PascalCase}Module in app.module.ts\n`,
);
