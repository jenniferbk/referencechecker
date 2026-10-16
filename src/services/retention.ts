// Deletes saved reference text older than RETENTION_DAYS (see supabase/migrations/003_retention.sql).
// Runs once at startup and then daily.
export const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: any; error: any }> };

export async function purgeOldReferenceData(client: RpcClient): Promise<void> {
  const { data, error } = await client.rpc('purge_old_reference_data', { p_days: RETENTION_DAYS });
  if (error) {
    console.error('[retention] purge failed:', error.message || error);
    return;
  }
  const row = Array.isArray(data) ? data[0] : data;
  console.log(`[retention] purged ${row?.jobs_deleted ?? 0} jobs, scrubbed ${row?.transactions_scrubbed ?? 0} transactions, deleted ${row?.error_logs_deleted ?? 0} error logs`);
}

export function scheduleRetention(client: RpcClient): NodeJS.Timeout {
  void purgeOldReferenceData(client);
  const timer = setInterval(() => { void purgeOldReferenceData(client); }, DAY_MS);
  timer.unref();
  return timer;
}
