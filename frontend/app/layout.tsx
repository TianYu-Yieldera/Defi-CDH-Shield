import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CDP Shield - DeFi Position Monitor",
  description: "Monitor and manage your CDP positions on BASE chain with real-time alerts",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background bg-grid-pattern`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
