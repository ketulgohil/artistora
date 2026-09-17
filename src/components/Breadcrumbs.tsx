interface BreadcrumbItem {
  label: string
  href?: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.artistora.com' },
      ...items.map((item, i) => ({
        '@type': 'ListItem' as const,
        position: i + 2,
        name: item.label,
        ...(item.href ? { item: `https://www.artistora.com${item.href}` } : {}),
      })),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl! px-4! pt-4! pb-0 md:px-6!">
        <ol className="flex flex-wrap items-center gap-1.5! text-sm text-ink-muted">
          <li>
            <a href="/" className="transition-colors hover:text-brand">Home</a>
          </li>
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5!">
              <span aria-hidden="true" className="text-ink-muted/50">/</span>
              {item.href ? (
                <a href={item.href} className="transition-colors hover:text-brand">{item.label}</a>
              ) : (
                <span className="text-ink-soft">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
