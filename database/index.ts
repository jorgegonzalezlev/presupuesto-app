import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { schema } from './schema';
import { seedIfEmpty } from './seed';

const db = new DatabaseSync(join(process.cwd(), 'database', 'presupuesto.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(schema);

seedIfEmpty(db);

export default db;
