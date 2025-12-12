import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { VoiceProvider } from "@/components/voice"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CDPShield - DeFi Position Monitor",
  description: "AI-powered voice assistant for monitoring DeFi CDP positions with real-time alerts on BASE chain",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CDPShield",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background bg-grid-pattern`}>
        <Providers>
          <VoiceProvider>
            {children}
          </VoiceProvider>
        </Providers>
      </body>
    </html>
  )
}
