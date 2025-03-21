import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Detailed description of your app',
  keywords: 'relevant, keywords, here',
  authors: [{ name: 'Your Company' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: 'Your App Name',
    title: 'Your App Name',
    description: 'Detailed description of your app',
    images: [{
      url: 'https://your-domain.com/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Your App Name'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your App Name',
    description: 'Detailed description of your app',
    images: ['https://your-domain.com/twitter-image.jpg'],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}

