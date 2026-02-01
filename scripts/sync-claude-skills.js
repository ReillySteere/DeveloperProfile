#!/usr/bin/env node
// Syncs .github/prompts/*.prompt.md to .claude/skills/*/SKILL.md
// Run: npm run sync:claude-skills

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '..', '.github', 'prompts');
const SKILLS_DIR = path.join(__dirname, '..', '.claude', 'skills');

// Ensure skills directory exists
if (!fs.existsSync(SKILLS_DIR)) {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

// Get all prompt files
const promptFiles = fs
  .readdirSync(PROMPTS_DIR)
  .filter((f) => f.endsWith('.prompt.md'));

let synced = 0;
let skipped = 0;

for (const promptFile of promptFiles) {
  const skillName = promptFile.replace('.prompt.md', '');
  const promptPath = path.join(PROMPTS_DIR, promptFile);
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillPath = path.join(skillDir, 'SKILL.md');

  // Create skill directory if needed
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  // Check if sync needed (compare content)
  const promptContent = fs.readFileSync(promptPath, 'utf8');
  const skillExists = fs.existsSync(skillPath);
  const skillContent = skillExists ? fs.readFileSync(skillPath, 'utf8') : '';

  if (promptContent !== skillContent) {
    fs.writeFileSync(skillPath, promptContent);
    console.log('Synced: ' + skillName);
    synced++;
  } else {
    skipped++;
  }
}

console.log(
  '\nSync complete: ' + synced + ' updated, ' + skipped + ' already in sync',
);
