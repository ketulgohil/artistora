export default function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mx-auto mb-10! max-w-3xl! text-center md:mb-14!">
      {subtitle && (
        <p className="mb-4! flex items-center justify-center gap-3! text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-brand">
          <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-transparent to-brand/60" />
          {subtitle}
          <span aria-hidden="true" className="h-px w-9 bg-gradient-to-l from-transparent to-brand/60" />
        </p>
      )}
      <h2 className="font-display text-3xl! leading-tight font-semibold text-ink md:text-[2.6rem]!">
        {title}
      </h2>
      <div
        aria-hidden="true"
        className="mx-auto mt-5! flex items-center justify-center gap-2! text-brand"
      >
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-brand/70" />
        <svg width="10" height="10" viewBox="0 0 10 10" className="rotate-45 text-brand" fill="currentColor">
          <rect x="0" y="0" width="10" height="10" rx="1" />
        </svg>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-brand/70" />
      </div>
    </div>
  )
}
