#!/usr/bin/env node
// Syncs AI instructions to Claude Code skills directory
// Sources:
//   1. .github/prompts/*.prompt.md -> .claude/skills/*/SKILL.md
//   2. .github/skills/*/SKILL.md   -> .claude/skills/*/SKILL.md
//
// Run: npm run sync:claude-skills
// See: ADR-014 (AI Tooling Architecture)

const fs = require('fs');
const path = require('path');

const GITHUB_PROMPTS_DIR = path.join(__dirname, '..', '.github', 'prompts');
const GITHUB_SKILLS_DIR = path.join(__dirname, '..', '.github', 'skills');
const CLAUDE_SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');

// Ensure Claude skills directory exists
if (!fs.existsSync(CLAUDE_SKILLS_DIR)) {
  fs.mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
}

let synced = 0;
let skipped = 0;

/**
 * Sync a single file to Claude skills directory
 * @param {string} sourcePath - Path to source file
 * @param {string} skillName - Name of the skill (used for directory)
 * @param {string} sourceType - Type of source ('prompt' or 'skill')
 */
function syncSkill(sourcePath, skillName, sourceType) {
  const skillDir = path.join(CLAUDE_SKILLS_DIR, skillName);
  const skillPath = path.join(skillDir, 'SKILL.md');

  // Create skill directory if needed
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  // Read source content
  const sourceContent = fs.readFileSync(sourcePath, 'utf8');

  // Check if sync needed (compare content)
  const skillExists = fs.existsSync(skillPath);
  const existingContent = skillExists ? fs.readFileSync(skillPath, 'utf8') : '';

  if (sourceContent !== existingContent) {
    fs.writeFileSync(skillPath, sourceContent);
    console.log(`  [${sourceType}] ${skillName}`);
    synced++;
  } else {
    skipped++;
  }
}

// ============================================================
// 1. Sync GitHub Prompts (.github/prompts/*.prompt.md)
// ============================================================
console.log('\nSyncing GitHub Prompts...');

if (fs.existsSync(GITHUB_PROMPTS_DIR)) {
  const promptFiles = fs
    .readdirSync(GITHUB_PROMPTS_DIR)
    .filter((f) => f.endsWith('.prompt.md'));

  for (const promptFile of promptFiles) {
    const skillName = promptFile.replace('.prompt.md', '');
    const promptPath = path.join(GITHUB_PROMPTS_DIR, promptFile);
    syncSkill(promptPath, skillName, 'prompt');
  }
} else {
  console.log('  No prompts directory found');
}

// ============================================================
// 2. Sync GitHub Skills (.github/skills/*/SKILL.md)
// ============================================================
console.log('\nSyncing GitHub Skills...');

if (fs.existsSync(GITHUB_SKILLS_DIR)) {
  const skillDirs = fs
    .readdirSync(GITHUB_SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const skillName of skillDirs) {
    const skillMdPath = path.join(GITHUB_SKILLS_DIR, skillName, 'SKILL.md');

    if (fs.existsSync(skillMdPath)) {
      syncSkill(skillMdPath, skillName, 'skill');
    }
  }
} else {
  console.log('  No skills directory found');
}

// ============================================================
// Summary
// ============================================================
console.log(
  '\nSync complete: ' + synced + ' updated, ' + skipped + ' already in sync',
);

// List all Claude skills
console.log('\nClaude skills directory contents:');
if (fs.existsSync(CLAUDE_SKILLS_DIR)) {
  const claudeSkills = fs
    .readdirSync(CLAUDE_SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const skill of claudeSkills) {
    console.log(`  - ${skill}`);
  }
  console.log(
    `\nTotal: ${claudeSkills.length} skills available in Claude Code`,
  );
}
