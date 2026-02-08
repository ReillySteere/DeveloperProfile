/**
 * Build-time metadata extraction script.
 * Parses TypeScript source of shared UI components and extracts prop
 * definitions, types, defaults, and descriptions using the TS Compiler API.
 *
 * Usage: npx ts-node scripts/extract-component-metadata.ts
 * Output: public/data/component-metadata.json
 */
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import type {
  ComponentMetadata,
  PropDefinition,
  PropControlType,
  PropOption,
  ComponentCategory,
  ComponentExample,
} from '../src/shared/types/playground.types';

const COMPONENTS_DIR = path.join(
  __dirname,
  '..',
  'src',
  'ui',
  'shared',
  'components',
);
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'public',
  'data',
  'component-metadata.json',
);

/** Components to extract metadata from */
const TARGET_COMPONENTS = [
  'Button',
  'Badge',
  'Card',
  'CardHeader',
  'CardTitle',
  'CardContent',
  'CardFooter',
  'Skeleton',
  'LinkButton',
];

/** Map component names to their source files */
const COMPONENT_FILES: Record<string, string> = {
  Button: 'Button/Button.tsx',
  Badge: 'Badge/Badge.tsx',
  Card: 'Card/Card.tsx',
  CardHeader: 'Card/Card.tsx',
  CardTitle: 'Card/Card.tsx',
  CardContent: 'Card/Card.tsx',
  CardFooter: 'Card/Card.tsx',
  Skeleton: 'Skeleton/Skeleton.tsx',
  LinkButton: 'LinkButton/LinkButton.tsx',
};

/** Map component names to categories */
const COMPONENT_CATEGORIES: Record<string, ComponentCategory> = {
  Button: 'Inputs',
  Badge: 'Data Display',
  Card: 'Layout',
  CardHeader: 'Layout',
  CardTitle: 'Layout',
  CardContent: 'Layout',
  CardFooter: 'Layout',
  Skeleton: 'Feedback',
  LinkButton: 'Navigation',
};

/** Map component names to descriptions */
const COMPONENT_DESCRIPTIONS: Record<string, string> = {
  Button: 'Accessible button with primary/secondary variants and optional icon',
  Badge: 'Small label for status or category display',
  Card: 'Container card component with optional article semantics',
  CardHeader: 'Header section of a Card',
  CardTitle: 'Title heading within a Card',
  CardContent: 'Main content area of a Card',
  CardFooter: 'Footer section of a Card',
  Skeleton: 'Loading placeholder with animation',
  LinkButton: 'Anchor element styled as a button',
};

function mapTypeToControl(typeStr: string): PropControlType {
  if (typeStr === 'boolean') return 'boolean';
  if (typeStr === 'number' || typeStr === 'string | number') return 'number';
  if (typeStr.includes('ReactNode') || typeStr.includes('React.ReactNode'))
    return 'node';
  if (
    typeStr.includes('=>') ||
    typeStr.includes('Function') ||
    typeStr.includes('EventHandler')
  )
    return 'function';
  if (typeStr.includes("'") && typeStr.includes('|')) return 'select';
  return 'string';
}

function extractUnionOptions(typeStr: string): PropOption[] {
  const matches = typeStr.match(/'([^']+)'/g);
  if (!matches) return [];
  return matches.map((m) => {
    const value = m.replace(/'/g, '');
    return { label: value, value };
  });
}

function getPropsInterfaceName(componentName: string): string {
  // Card subcomponents don't have their own props interface in the source
  // They use React.HTMLAttributes<...> directly
  const propsInterfaces: Record<string, string> = {
    Button: 'ButtonProps',
    Badge: 'BadgeProps',
    LinkButton: 'LinkButtonProps',
    Skeleton: 'SkeletonProps',
    Card: 'CardProps',
  };
  return propsInterfaces[componentName] || `${componentName}Props`;
}

function extractPropsFromInterface(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  interfaceName: string,
): PropDefinition[] {
  const props: PropDefinition[] = [];

  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.name) {
          const name = member.name.getText(sourceFile);
          const required = !member.questionToken;
          const type = member.type
            ? member.type.getText(sourceFile)
            : 'unknown';

          // Skip HTML attributes inherited from extends
          if (
            [
              'className',
              'style',
              'id',
              'key',
              'ref',
              'children',
              'dangerouslySetInnerHTML',
            ].includes(name)
          ) {
            continue;
          }

          // Skip common HTML event handlers and aria attributes
          if (name.startsWith('on') || name.startsWith('aria-')) continue;

          const controlType = mapTypeToControl(type);
          const options =
            controlType === 'select' ? extractUnionOptions(type) : undefined;

          // Extract JSDoc description
          const symbol = checker.getSymbolAtLocation(
            member.name as ts.Node,
          );
          const description = symbol
            ? ts.displayPartsToString(
                symbol.getDocumentationComment(checker),
              )
            : undefined;

          props.push({
            name,
            type,
            controlType,
            required,
            description: description || undefined,
            options,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return props;
}

function buildDefaultProps(
  props: PropDefinition[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const prop of props) {
    if (prop.controlType === 'node' || prop.controlType === 'function')
      continue;
    if (prop.defaultValue) {
      defaults[prop.name] = prop.defaultValue;
    } else if (prop.options && prop.options.length > 0) {
      defaults[prop.name] = prop.options[0].value;
    } else if (prop.controlType === 'boolean') {
      defaults[prop.name] = false;
    } else if (prop.controlType === 'string') {
      defaults[prop.name] = '';
    } else if (prop.controlType === 'number') {
      defaults[prop.name] = 0;
    }
  }
  return defaults;
}

function buildExamples(
  componentName: string,
  props: PropDefinition[],
): ComponentExample[] {
  const defaults = buildDefaultProps(props);
  return [{ name: 'Default', props: defaults }];
}

function extractMetadata(): ComponentMetadata[] {
  const configPath = path.join(__dirname, '..', 'tsconfig.json');
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  const filePaths = [
    ...new Set(
      TARGET_COMPONENTS.map((name) =>
        path.join(COMPONENTS_DIR, COMPONENT_FILES[name]),
      ),
    ),
  ];

  const program = ts.createProgram(filePaths, parsedConfig.options);
  const checker = program.getTypeChecker();

  const results: ComponentMetadata[] = [];

  for (const componentName of TARGET_COMPONENTS) {
    const filePath = path.join(COMPONENTS_DIR, COMPONENT_FILES[componentName]);
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      console.warn(`Could not find source file for ${componentName}`);
      continue;
    }

    const interfaceName = getPropsInterfaceName(componentName);
    const props = extractPropsFromInterface(checker, sourceFile, interfaceName);

    // Add children prop for components that accept it
    const acceptsChildren = [
      'Button',
      'Badge',
      'Card',
      'CardHeader',
      'CardTitle',
      'CardContent',
      'CardFooter',
      'LinkButton',
    ];
    if (acceptsChildren.includes(componentName)) {
      props.push({
        name: 'children',
        type: 'React.ReactNode',
        controlType: 'string',
        required: false,
        description: 'Content to render inside the component',
        defaultValue: componentName,
      });
    }

    // Set known defaults
    if (componentName === 'Button') {
      const variantProp = props.find((p) => p.name === 'variant');
      if (variantProp) variantProp.defaultValue = 'primary';
    }
    if (componentName === 'Card') {
      const asProp = props.find((p) => p.name === 'as');
      if (asProp) asProp.defaultValue = 'div';
    }
    if (componentName === 'Badge') {
      const variantProp = props.find((p) => p.name === 'variant');
      if (variantProp) variantProp.defaultValue = 'primary';
    }

    const importDir = COMPONENT_FILES[componentName].split('/')[0];
    results.push({
      name: componentName,
      description:
        COMPONENT_DESCRIPTIONS[componentName] || `${componentName} component`,
      category: COMPONENT_CATEGORIES[componentName] || 'Data Display',
      props,
      examples: buildExamples(componentName, props),
      importPath: `ui/shared/components/${importDir}/${importDir}`,
    });
  }

  return results;
}

// Main
const metadata = extractMetadata();

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(metadata, null, 2));
console.log(
  `Extracted metadata for ${metadata.length} components to ${OUTPUT_PATH}`,
);
