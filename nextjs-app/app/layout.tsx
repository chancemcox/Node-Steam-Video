import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Streaming App',
  description: 'Upload and stream videos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
