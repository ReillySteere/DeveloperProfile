const fs = require('fs');
const path = require('path');

const featureName = process.argv[2];
if (!featureName) {
  console.error(
    'Please provide a feature name. Usage: node scaffold-feature.js <name>',
  );
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '../../../');
const srcServer = path.join(rootDir, 'src', 'server', 'modules', featureName);
const srcUi = path.join(rootDir, 'src', 'ui', 'containers', featureName); // FIXED: Added 'containers'
const srcShared = path.join(rootDir, 'src', 'shared', 'types');

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

const PascalCase = featureName.charAt(0).toUpperCase() + featureName.slice(1);

// Server Scaffolding
createDir(srcServer);

// 1. Tokens
writeFile(
  path.join(srcServer, 'tokens.ts'),
  `
const TOKENS = {
  ${PascalCase}Service: Symbol('${PascalCase}Service'),
  ${PascalCase}Repository: Symbol('${PascalCase}Repository'), // Optional if using Repository pattern
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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

// 5. Unit Test
writeFile(
  path.join(srcServer, `${featureName}.service.spec.ts`),
  `
import { ${PascalCase}Service } from './${featureName}.service';

describe('${PascalCase}Service', () => {
  let service: ${PascalCase}Service;

  beforeEach(() => {
    // Manual DI
    service = new ${PascalCase}Service();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`,
);

// UI Scaffolding
createDir(srcUi);
createDir(path.join(srcUi, 'components'));
createDir(path.join(srcUi, 'hooks'));

writeFile(
  path.join(srcUi, `${featureName}.container.tsx`),
  `
import React from 'react';
import { use${PascalCase} } from './hooks/use${PascalCase}';

export const ${PascalCase}Container: React.FC = () => {
  const { data, isLoading } = use${PascalCase}();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>${PascalCase} Feature</h1>
    </div>
  );
};
`,
);

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

// Shared Types
createDir(srcShared);
writeFile(
  path.join(srcShared, `${featureName}.ts`),
  `
// Shared types for ${featureName}
export interface ${PascalCase}Dto {
  id: string;
}
`,
);

console.log(
  `\nSuccess! Scaffolding complete for feature: ${featureName} (with Tokens & Containers)`,
);
console.log(
  `\nNext Steps:\n1. Register ${PascalCase}Module in app.module.ts\n2. Configure routes for UI.`,
);
