import type { ReactNode } from 'react'

interface FullscreenLayoutProps {
  children: ReactNode
}

export default function FullscreenLayout({ children }: FullscreenLayoutProps) {
  return (
    <div className="fullscreen-app">
      {children}
    </div>
  )
}