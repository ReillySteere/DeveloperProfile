/**
 * All migrations in chronological order.
 * This is the SINGLE SOURCE OF TRUTH for migration registration.
 *
 * When adding a new migration:
 * 1. Create the migration file
 * 2. Import and add it to this array
 * 3. The migration test will automatically verify all entities have tables
 */
import { InitialSchema1769265232408 } from './1769265232408-InitialSchema';
import { FixProjectsTableName1769267844749 } from './1769267844749-FixProjectsTableName';
import { CreateRequestTraceTable1769293753892 } from './1769293753892-CreateRequestTraceTable';
import { CreateRateLimitTable1769489275619 } from './1769489275619-CreateRateLimitTable';
import { CreateAlertHistoryTable1769489440468 } from './1769489440468-CreateAlertHistoryTable';
import { AddAlertHistoryResolvedAtColumn1769489440469 } from './1769489440469-AddAlertHistoryResolvedAtColumn';
import { CreateCaseStudiesTable1769489440470 } from './1769489440470-CreateCaseStudiesTable';
import { CreatePerformanceTables1770483419016 } from './1770483419016-CreatePerformanceTables';

export const ALL_MIGRATIONS = [
  InitialSchema1769265232408,
  FixProjectsTableName1769267844749,
  CreateRequestTraceTable1769293753892,
  CreateRateLimitTable1769489275619,
  CreateAlertHistoryTable1769489440468,
  AddAlertHistoryResolvedAtColumn1769489440469,
  CreateCaseStudiesTable1769489440470,
  CreatePerformanceTables1770483419016,
];
