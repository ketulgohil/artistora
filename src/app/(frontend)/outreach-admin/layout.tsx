import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Outreach Admin | Artistora',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OutreachAdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
