import dotenv from 'dotenv'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

dotenv.config({ path: '.env' })

const endpoint = process.env.PAYLOAD_S3_ENDPOINT
const bucket = process.env.PAYLOAD_S3_BUCKET
const region = process.env.PAYLOAD_S3_REGION || 'us-east-1'
const accessKeyId = process.env.PAYLOAD_S3_ACCESS_KEY_ID
const secretAccessKey = process.env.PAYLOAD_S3_SECRET_ACCESS_KEY

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  throw new Error('Missing PAYLOAD_S3_ENDPOINT, PAYLOAD_S3_BUCKET, or S3 credentials in .env')
}

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

async function getFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await getFiles(fullPath)))
    else files.push(fullPath)
  }

  return files
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
})

const mediaDirectory = path.resolve('media')
const files = await getFiles(mediaDirectory)

for (const filePath of files) {
  const key = path.relative(mediaDirectory, filePath).split(path.sep).join('/')
  const extension = path.extname(filePath).toLowerCase()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: await fs.readFile(filePath),
      ContentType: contentTypes[extension] || 'application/octet-stream',
    }),
  )

  console.log(`Uploaded ${key}`)
}

console.log(`Uploaded ${files.length} media files to ${bucket}`)
