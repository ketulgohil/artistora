export default function ArtistPlaceholder({
  name,
  size = 'md',
  className = '',
}: {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initial = name?.charAt(0)?.toUpperCase() || 'A'

  const sizeClasses = {
    sm: 'h-16 w-16 rounded-full text-xl',
    md: 'h-full w-full rounded-[1.7rem] text-5xl',
    lg: 'h-full w-full rounded-[1.7rem] text-7xl',
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-brand/10 via-cream to-brand/20 ${sizeClasses[size]} ${className}`}
    >
      <span className="font-display font-semibold text-brand/40">{initial}</span>
    </div>
  )
}
