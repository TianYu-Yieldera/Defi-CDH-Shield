"use client"

import { useEnsName, useEnsAvatar } from "wagmi"
import { base } from "wagmi/chains"
import { formatAddress } from "@/lib/utils"

interface BaseNameDisplayProps {
  address: `0x${string}`
  showFullAddress?: boolean
}

export function BaseNameDisplay({
  address,
  showFullAddress = false,
}: BaseNameDisplayProps) {
  const { data: baseName } = useEnsName({
    address,
    chainId: base.id,
  })

  const { data: avatar } = useEnsAvatar({
    name: baseName || undefined,
    chainId: base.id,
  })

  return (
    <div className="flex items-center gap-2">
      {avatar && (
        <img
          src={avatar}
          alt="Avatar"
          className="h-8 w-8 rounded-full"
        />
      )}
      <div>
        {baseName ? (
          <>
            <p className="font-medium">{baseName}</p>
            {showFullAddress && (
              <p className="text-xs text-muted-foreground">
                {formatAddress(address)}
              </p>
            )}
          </>
        ) : (
          <p className="font-medium">{formatAddress(address)}</p>
        )}
      </div>
    </div>
  )
}
