import fs from 'fs'
import path from 'path'

const PROGRESS_FILE = path.join(process.cwd(), 'scraper-progress.json')

const QUERIES = [
  'mehndi artist',
  'mehndi designer',
  'henna artist',
  'bridal mehndi',
  'mehndi class',
]

const AREAS = [
  'Ahmedabad',
  'SG Highway Ahmedabad',
  'Vastrapur Ahmedabad',
  'Maninagar Ahmedabad',
  'Satellite Ahmedabad',
  'Paldi Ahmedabad',
  'Bopal Ahmedabad',
  'Nikol Ahmedabad',
  'Gota Ahmedabad',
  'Thaltej Ahmedabad',
  'Memnagar Ahmedabad',
  'Navrangpura Ahmedabad',
  'Ashram Road Ahmedabad',
  'CG Road Ahmedabad',
  'Science City Road Ahmedabad',
  'Sola Ahmedabad',
  'Ghatlodia Ahmedabad',
  'Chandkheda Ahmedabad',
  'Motera Ahmedabad',
  'Jodhpur Ahmedabad',
  'Makarba Ahmedabad',
  'Sarkhej Ahmedabad',
  'Vastral Ahmedabad',
  'Amraiwadi Ahmedabad',
  'Kankaria Ahmedabad',
]

// How many jobs to run per invocation (pass as argument: npx tsx src/run-scraper.ts 10)
const BATCH_SIZE = parseInt(process.argv[2] || '10')

function loadProgress(): string[] {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function saveProgress(completed: string[]) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(completed, null, 2))
}

function getAllJobs(): Array<{ query: string; area: string }> {
  const jobs: Array<{ query: string; area: string }> = []
  for (const area of AREAS) {
    for (const query of QUERIES) {
      jobs.push({ query, area })
    }
  }
  return jobs
}

async function runBatch() {
  const allJobs = getAllJobs()
  const completed = loadProgress()
  const remaining = allJobs.filter(
    (j) => !completed.includes(`${j.query}|${j.area}`)
  )

  console.log(`\n========================================`)
  console.log(`[Scraper] Total: ${allJobs.length} | Done: ${completed.length} | Remaining: ${remaining.length}`)
  console.log(`[Scraper] Running batch of ${Math.min(BATCH_SIZE, remaining.length)}...`)
  console.log(`========================================\n`)

  if (remaining.length === 0) {
    console.log('[Scraper] All done! No more jobs to run.')
    return
  }

  const batch = remaining.slice(0, BATCH_SIZE)

  for (let i = 0; i < batch.length; i++) {
    const { query, area } = batch[i]
    const jobKey = `${query}|${area}`
    const jobNum = completed.length + i + 1
    const total = allJobs.length

    console.log(`\n[Scraper] (${jobNum}/${total}) "${query}" in "${area}"`)

    try {
      const res = await fetch('http://localhost:3000/api/outreach/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'google_maps',
          query,
          city: area,
          maxResults: 50,
        }),
      })

      const data = await res.json()
      if (data.jobId) {
        console.log(`[Scraper] Job ${data.jobId} started, waiting...`)
        await waitForJob(String(data.jobId))
        completed.push(jobKey)
        saveProgress(completed)
        console.log(`[Scraper] Progress saved (${completed.length}/${total})`)
      }
    } catch (err) {
      console.log(`[Scraper] Error: ${err}`)
    }

    // Delay between jobs
    await new Promise((r) => setTimeout(r, 2000))
  }

  const stillRemaining = allJobs.length - completed.length
  console.log(`\n========================================`)
  console.log(`[Scraper] Batch done! ${completed.length}/${allJobs.length} completed.`)
  if (stillRemaining > 0) {
    console.log(`[Scraper] ${stillRemaining} remaining. Run again: npx tsx src/run-scraper.ts`)
  } else {
    console.log(`[Scraper] All done! 🎉`)
  }
  console.log(`========================================\n`)
}

async function waitForJob(jobId: string) {
  const maxWait = 15 * 60 * 1000
  const interval = 15000
  const start = Date.now()

  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch('http://localhost:3000/api/outreach/scrape?page=1')
      const data = await res.json()
      const job = data.docs?.find((j: any) => String(j.id) === jobId)
      if (job && (job.status === 'completed' || job.status === 'failed')) {
        console.log(
          `[Scraper] Job ${jobId}: ${job.status} — ${job.resultsFound || 0} found, ${job.newArtists || 0} new`
        )
        return
      }
    } catch {}
    await new Promise((r) => setTimeout(r, interval))
  }
  console.log(`[Scraper] Job ${jobId} timed out`)
}

runBatch().catch(console.error)
