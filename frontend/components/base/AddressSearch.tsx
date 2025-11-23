"use client"

import { useState } from "react"
import { useEnsAddress } from "wagmi"
import { base } from "wagmi/chains"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export function AddressSearch() {
  const [input, setInput] = useState("")

  const { data: resolvedAddress, isLoading } = useEnsAddress({
    name: input.endsWith(".base.eth") ? input : undefined,
    chainId: base.id,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search by Base Name</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter address or Base Name (e.g., vitalik.base.eth)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {resolvedAddress && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Resolved to:</p>
            <p className="font-mono text-sm">{resolvedAddress}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
