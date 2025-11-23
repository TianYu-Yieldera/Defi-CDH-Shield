"use client"

import { Header } from "@/components/Header"
import { AddressSearch } from "@/components/base/AddressSearch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { Bell, BellOff, Mail } from "lucide-react"
import { useState } from "react"

export default function MonitorPage() {
  const { isConnected } = useAccount()
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const [email, setEmail] = useState("")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <p className="text-muted-foreground">
              Connect your wallet to set up monitoring
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Monitor Settings</h1>
              <p className="text-muted-foreground">
                Configure alerts and monitoring for your positions
              </p>
            </div>

            <AddressSearch />

            <Card>
              <CardHeader>
                <CardTitle>Alert Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when your positions are at risk
                    </p>
                  </div>
                  <Button
                    variant={alertsEnabled ? "default" : "outline"}
                    onClick={() => setAlertsEnabled(!alertsEnabled)}
                  >
                    {alertsEnabled ? (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 mr-2" />
                        Disabled
                      </>
                    )}
                  </Button>
                </div>

                {alertsEnabled && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Health Factor Threshold
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        defaultValue="1.5"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when health factor drops below this value
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Price Change Threshold (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        defaultValue="10"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert on significant price changes
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email Notifications
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Receive email alerts for critical events
                      </p>
                    </div>

                    <Button className="w-full">Save Alert Settings</Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">Active Monitors</p>
                      <p className="text-sm text-muted-foreground">
                        Tracking your positions 24/7
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-green-500">2</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">Alerts Sent (24h)</p>
                      <p className="text-sm text-muted-foreground">
                        Recent notifications
                      </p>
                    </div>
                    <span className="text-2xl font-bold">0</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">Next Check</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic monitoring interval
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      In 5 minutes
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
