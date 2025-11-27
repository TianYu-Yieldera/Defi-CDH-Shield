"use client"

import { useEnsName, useEnsAvatar } from "wagmi"
import { base } from "wagmi/chains"
import { formatAddress } from "@/lib/utils"
import { baseNameCache } from "@/lib/baseNameCache"
import { useEffect } from "react"

interface BaseNameDisplayProps {
  address: `0x${string}`
  showFullAddress?: boolean
}

export function BaseNameDisplay({
  address,
  showFullAddress = false,
}: BaseNameDisplayProps) {
  // Check cache first
  const cachedName = baseNameCache.getName(address);
  const shouldFetchName = cachedName === undefined;

  const { data: baseName } = useEnsName({
    address,
    chainId: base.id,
    query: {
      enabled: shouldFetchName,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  })

  // Check avatar cache
  const cachedAvatar = baseName ? baseNameCache.getAvatar(baseName) : undefined;
  const shouldFetchAvatar = cachedAvatar === undefined && !!baseName;

  const { data: avatar } = useEnsAvatar({
    name: baseName || undefined,
    chainId: base.id,
    query: {
      enabled: shouldFetchAvatar,
      staleTime: 5 * 60 * 1000,
    },
  })

  // Update cache when data is fetched
  useEffect(() => {
    if (baseName !== undefined) {
      baseNameCache.setName(address, baseName);
    }
  }, [address, baseName]);

  useEffect(() => {
    if (baseName && avatar !== undefined) {
      baseNameCache.setAvatar(baseName, avatar);
    }
  }, [baseName, avatar]);

  // Use cached data if available, otherwise use fresh data
  const displayName = cachedName !== undefined ? cachedName : baseName;
  const displayAvatar = cachedAvatar !== undefined ? cachedAvatar : avatar;

  return (
    <div className="flex items-center gap-2">
      {displayAvatar && (
        <img
          src={displayAvatar}
          alt="Avatar"
          className="h-8 w-8 rounded-full"
        />
      )}
      <div>
        {displayName ? (
          <>
            <p className="font-medium">{displayName}</p>
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
