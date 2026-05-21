import type { ReactNode } from 'react'

interface FullscreenLayoutProps {
  children: ReactNode
}

export default function FullscreenLayout({ children }: FullscreenLayoutProps) {
  return (
    <div className="fullscreen-app bg-bg text-text min-h-screen w-full">
      {children}
    </div>
  )
}