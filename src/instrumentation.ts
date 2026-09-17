export async function register() {
  // Only run on server start, not on edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getPayload } = await import('payload')
      const config = (await import('@payload-config')).default
      const payload = await getPayload({ config })

      // Mark any stuck "running" scrape jobs as failed on startup
      const stuckJobs = await payload.find({
        collection: 'scrape-jobs',
        where: { status: { equals: 'running' } },
        limit: 100,
      })

      if (stuckJobs.docs.length > 0) {
        console.log(
          `[Startup] Found ${stuckJobs.docs.length} stuck scrape job(s), marking as failed`
        )
        for (const job of stuckJobs.docs) {
          await payload.update({
            collection: 'scrape-jobs',
            id: job.id,
            data: {
              status: 'failed',
              completedAt: new Date().toISOString(),
              errorMessage: 'Server restarted while job was running',
            },
          })
        }
      }
    } catch (error) {
      // Don't crash the server if cleanup fails — log and continue
      console.error('[Startup] Failed to clean up stuck scrape jobs:', error)
    }
  }
}
