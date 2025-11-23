"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function WalletButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading"
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated")

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                    size="default"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Connect Wallet</span>
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    size="default"
                  >
                    Wrong network
                  </Button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  {/* Chain Selector */}
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center gap-1.5 px-3 h-9 border-border/40 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    {chain.hasIcon && (
                      <div
                        className="w-3.5 h-3.5 rounded-full overflow-hidden ring-1 ring-border/50"
                        style={{
                          background: chain.iconBackground,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            className="w-3.5 h-3.5"
                          />
                        )}
                      </div>
                    )}
                    <span className="text-xs font-medium text-foreground/90">{chain.name}</span>
                  </Button>

                  {/* Account Button */}
                  <div className="relative group">
                    <Button
                      onClick={openAccountModal}
                      variant="outline"
                      size="default"
                      className="relative h-9 px-3 border-primary/20 bg-gradient-to-r from-primary/[0.08] to-primary/[0.05] hover:from-primary/[0.12] hover:to-primary/[0.08] hover:border-primary/30 transition-all font-mono shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                        <span className="text-sm font-medium text-foreground">
                          {account.displayName}
                        </span>
                        {account.displayBalance && (
                          <span className="hidden lg:inline text-xs text-muted-foreground/80 ml-0.5 font-normal">
                            {account.displayBalance}
                          </span>
                        )}
                      </div>
                    </Button>

                    {/* Dropdown on hover */}
                    <div className="absolute right-0 top-full mt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-lg shadow-2xl shadow-black/50 p-4 space-y-3">
                        <div className="flex items-center justify-between px-3 py-2 bg-primary/[0.08] rounded-md border border-primary/10">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Address
                          </span>
                          <button
                            onClick={() => handleCopy(account.address)}
                            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-medium"
                          >
                            <Copy className="h-3 w-3" />
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <div className="px-3 py-2.5 font-mono text-xs break-all text-foreground/90 bg-background/50 rounded-md border border-border/30">
                          {account.address}
                        </div>
                        {account.displayBalance && (
                          <div className="px-3 py-2.5 bg-secondary/40 rounded-md border border-border/30">
                            <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">
                              Balance
                            </div>
                            <div className="text-base font-bold text-number text-foreground">
                              {account.displayBalance}
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border/60 space-y-1">
                          <button
                            onClick={openAccountModal}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-foreground/90 hover:bg-primary/10 hover:text-foreground rounded-md transition-all hover:shadow-sm"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            Account Details
                          </button>
                          <button
                            onClick={openAccountModal}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-destructive/90 hover:bg-destructive/15 hover:text-destructive rounded-md transition-all"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
