import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/types.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!NIGHT.test(night) || !existsSync(join(config.runsDir, `${night}.jsonl`))) {
      return c.json({ error: 'night not found' }, 404);
    }
    const rows = readNight(config.runsDir, night).toSorted((a, b) => a.job.localeCompare(b.job));
    return c.json(rows);
  });

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  return app;
}
