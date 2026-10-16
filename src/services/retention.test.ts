import { test } from 'node:test';
import assert from 'node:assert/strict';
import { purgeOldReferenceData, RETENTION_DAYS } from './retention.js';

test('purgeOldReferenceData calls the purge function with a 30-day window', async () => {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const client = {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      calls.push({ fn, args });
      return { data: [{ jobs_deleted: 2, transactions_scrubbed: 5, error_logs_deleted: 1 }], error: null };
    },
  };
  await purgeOldReferenceData(client);
  assert.equal(RETENTION_DAYS, 30);
  assert.deepEqual(calls, [{ fn: 'purge_old_reference_data', args: { p_days: 30 } }]);
});

test('purgeOldReferenceData logs and survives a database error', async () => {
  const client = { rpc: async () => ({ data: null, error: { message: 'function does not exist' } }) };
  await assert.doesNotReject(purgeOldReferenceData(client));
});
