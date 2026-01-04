import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBlog1704153600002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "blog_post" (
        "id" varchar PRIMARY KEY NOT NULL,
        "slug" varchar NOT NULL,
        "title" varchar NOT NULL,
        "metaDescription" varchar NOT NULL,
        "publishedAt" varchar NOT NULL,
        "tags" text NOT NULL,
        "markdownContent" text NOT NULL,
        "documentContent" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_blog_post_slug" UNIQUE ("slug")
      )`,
    );
    const markdownContent = `
# Hello World

This is a sample blog post to demonstrate **Markdown** rendering.

## Features

- GFM Support
- Syntax Highlighting
- Mermaid Diagrams

### Code Example

\`\`\`typescript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

### Mermaid Diagram

\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
\`\`\`

### Table

| Feature | Status |
| :--- | :--- |
| Markdown | ✅ |
| Mermaid | ✅ |
| Syntax Highlighting | ✅ |
`;

    await queryRunner.query(
      `INSERT INTO "blog_post" (id, slug, title, metaDescription, publishedAt, tags, markdownContent, documentContent, createdAt, updatedAt) VALUES 
      ('1', 'hello-world', 'Hello World: A Guide to Markdown', 'A sample post demonstrating Markdown rendering capabilities.', '${new Date().toISOString()}', '["markdown", "guide", "demo"]', ?, NULL, datetime('now'), datetime('now'))`,
      [markdownContent],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "blog_post" WHERE slug = 'hello-world'`,
    );
  }
}
