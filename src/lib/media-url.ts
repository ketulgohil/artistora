/** Build a browser-loadable URL for a known Payload media filename. */
export function mediaFileUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.PAYLOAD_S3_BUCKET
  const useSupabaseStorage =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_ENABLED === 'true'

  if (useSupabaseStorage && supabaseUrl && bucket) {
    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${filename
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`
  }

  return `/api/media/file/${filename}`
}
