'use client'

import { GlobalVideoProvider } from './utils/GlobalVideoContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GlobalVideoProvider>{children}</GlobalVideoProvider>
}
