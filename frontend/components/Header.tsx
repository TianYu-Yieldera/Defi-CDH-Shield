"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import { Shield } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">CDP Shield</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/portfolio"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Portfolio
            </Link>
            <Link
              href="/monitor"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Monitor
            </Link>
          </nav>
        </div>
        <ConnectButton />
      </div>
    </header>
  )
}
