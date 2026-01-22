/**
 * Build-Time Dependency Graph Generator
 *
 * Uses dependency-cruiser to analyze the codebase and generate focused JSON graphs
 * for UI containers and Server modules.
 *
 * Usage:
 *   node scripts/generate-dependency-graph.mjs
 *
 * Output:
 *   - public/data/dependency-graphs.json (contains all focused graphs)
 */

import { cruise } from 'dependency-cruiser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define UI containers and their entry points
const UI_CONTAINERS = [
  { name: 'about', path: 'src/ui/containers/about' },
  { name: 'architecture', path: 'src/ui/containers/architecture' },
  { name: 'blog', path: 'src/ui/containers/blog' },
  { name: 'experience', path: 'src/ui/containers/experience' },
  { name: 'projects', path: 'src/ui/containers/projects' },
  { name: 'status', path: 'src/ui/containers/status' },
];

// Define Server modules and their entry points
const SERVER_MODULES = [
  { name: 'about', path: 'src/server/modules/about' },
  { name: 'architecture', path: 'src/server/modules/architecture' },
  { name: 'auth', path: 'src/server/modules/auth' },
  { name: 'blog', path: 'src/server/modules/blog' },
  { name: 'experience', path: 'src/server/modules/experience' },
  { name: 'health', path: 'src/server/modules/health' },
  { name: 'projects', path: 'src/server/modules/projects' },
  { name: 'seeding', path: 'src/server/modules/seeding' },
];

async function generateFocusedGraph(targetPath, scope) {
  const cruiseOptions = {
    doNotFollow: {
      path: ['node_modules', 'dist', 'coverage', 'test-results'],
    },
    exclude: {
      path: ['\\.test\\.', '\\.spec\\.', '__mocks__', 'test-utils'],
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    outputType: 'json',
  };

  try {
    // Check if path exists
    if (!fs.existsSync(targetPath)) {
      console.log(`  Skipping ${targetPath} (does not exist)`);
      return null;
    }

    const result = await cruise([targetPath], cruiseOptions);
    const output = JSON.parse(result.output);

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    for (const module of output.modules || []) {
      const nodeId = normalizeModulePath(module.source);

      // Skip if not part of this scope
      if (!nodeId.startsWith(targetPath.replace(/\\/g, '/'))) {
        continue;
      }

      if (!nodeSet.has(nodeId)) {
        nodeSet.add(nodeId);
        nodes.push({
          id: nodeId,
          label: getModuleLabel(module.source),
          type: getModuleType(module.source),
        });
      }

      for (const dep of module.dependencies || []) {
        const targetId = normalizeModulePath(dep.resolved);

        // Include dependencies within src/ only
        if (
          targetId &&
          !targetId.startsWith('node_modules') &&
          targetId.startsWith('src/')
        ) {
          edges.push({
            source: nodeId,
            target: targetId,
            type: dep.dependencyTypes?.[0] || 'import',
          });

          if (!nodeSet.has(targetId)) {
            nodeSet.add(targetId);
            nodes.push({
              id: targetId,
              label: getModuleLabel(dep.resolved),
              type: getModuleType(dep.resolved),
            });
          }
        }
      }
    }

    return { nodes, edges };
  } catch (error) {
    console.error(`  Failed to analyze ${targetPath}:`, error.message);
    return null;
  }
}

async function generateAllGraphs() {
  console.log('Generating focused dependency graphs...\n');

  const result = {
    generatedAt: new Date().toISOString(),
    ui: {
      containers: [],
    },
    server: {
      modules: [],
    },
  };

  // Generate UI container graphs
  console.log('UI Containers:');
  for (const container of UI_CONTAINERS) {
    console.log(`  Processing ${container.name}...`);
    const graph = await generateFocusedGraph(container.path, 'ui');
    if (graph && graph.nodes.length > 0) {
      result.ui.containers.push({
        name: container.name,
        label: formatLabel(container.name),
        ...graph,
      });
      console.log(
        `    ✓ ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
      );
    }
  }

  // Generate Server module graphs
  console.log('\nServer Modules:');
  for (const module of SERVER_MODULES) {
    console.log(`  Processing ${module.name}...`);
    const graph = await generateFocusedGraph(module.path, 'server');
    if (graph && graph.nodes.length > 0) {
      result.server.modules.push({
        name: module.name,
        label: formatLabel(module.name),
        ...graph,
      });
      console.log(
        `    ✓ ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
      );
    }
  }

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write consolidated output
  const outputPath = path.join(dataDir, 'dependency-graphs.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`\n✓ Graphs written to ${outputPath}`);
  console.log(`  UI Containers: ${result.ui.containers.length}`);
  console.log(`  Server Modules: ${result.server.modules.length}`);
}

function normalizeModulePath(sourcePath) {
  if (!sourcePath) return '';
  return sourcePath
    .replace(/^\.\//, '')
    .replace(/\\/g, '/')
    .replace(/\.(tsx?|jsx?)$/, '');
}

function getModuleLabel(sourcePath) {
  const parts = sourcePath.split(/[/\\]/);
  return parts[parts.length - 1].replace(/\.(tsx?|jsx?)$/, '');
}

function getModuleType(sourcePath) {
  if (sourcePath.includes('/server/')) return 'server';
  if (sourcePath.includes('/ui/')) return 'ui';
  if (sourcePath.includes('/shared/')) return 'shared';
  return 'unknown';
}

function formatLabel(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

generateAllGraphs();
