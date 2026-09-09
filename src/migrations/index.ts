import * as migration_20260714_135751 from './20260714_135751';
import * as migration_20260909_000000 from './20260909_000000';

export const migrations = [
  {
    up: migration_20260714_135751.up,
    down: migration_20260714_135751.down,
    name: '20260714_135751'
  },
  {
    up: migration_20260909_000000.up,
    down: migration_20260909_000000.down,
    name: '20260909_000000'
  },
];
