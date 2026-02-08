# ADR-030: Colocated MDX Component Documentation

## Status

Proposed

## Date

2026-02-08

## Context

The Component Playground displays component metadata (props, examples, code) but lacks narrative documentation explaining usage guidelines, accessibility considerations, and design rationale. Components would benefit from rich documentation colocated with their source code.

## Decision

### File Structure

MDX documentation files are colocated next to their component source:

```
src/ui/containers/performance/components/
  VitalGauge.tsx
  VitalGauge.mdx          # Optional documentation
  VitalGauge.module.scss
```

### Optional Integration

The playground shows a "Docs" tab when an MDX file is detected for a component. Components without MDX files work normally — documentation is additive, not required.

### Deferred Implementation

The actual MDX serving endpoint and rendering pipeline is deferred to a follow-up. This ADR establishes the file structure convention so documentation can be authored ahead of the rendering infrastructure.

## Consequences

- Documentation lives next to the code it describes, improving discoverability
- No breaking changes — MDX files are optional
- Future MDX endpoint can discover files by convention (component name + `.mdx` extension)
- Authors can begin writing documentation before the rendering pipeline is built
