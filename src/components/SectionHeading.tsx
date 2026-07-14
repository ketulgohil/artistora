export default function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="text-center mb-8 md:mb-12">
      <div className="divider" />
      <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mt-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--color-text-muted)] text-sm mt-2">{subtitle}</p>
      )}
    </div>
  )
}
