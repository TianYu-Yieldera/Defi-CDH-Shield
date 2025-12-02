"use client"

import { Header } from "@/components/Header"
import { AddressSearch } from "@/components/base/AddressSearch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { Bell, BellOff, Mail, Trash2, AlertTriangle, Check } from "lucide-react"
import { useState } from "react"
import { useAlertStore } from "@/store/alertStore"
import { useCDPStore } from "@/store/cdpStore"

export default function MonitorPage() {
  const { isConnected } = useAccount()
  const [email, setEmail] = useState("")
  const [healthThreshold, setHealthThreshold] = useState(1.5)
  const [priceThreshold, setPriceThreshold] = useState(10)

  const { configs, activeAlerts, addConfig, removeConfig, toggleConfig, acknowledgeAlert, clearAlert } = useAlertStore()
  const { positions } = useCDPStore()

  const alertsEnabled = configs.length > 0 && configs.some(c => c.enabled)

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

            {activeAlerts.filter(a => !a.acknowledged).length > 0 && (
              <div className="space-y-3">
                {activeAlerts.filter(a => !a.acknowledged).map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg p-4 border ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : alert.severity === 'warning'
                        ? 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        : 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical'
                          ? 'text-red-600 dark:text-red-400'
                          : alert.severity === 'warning'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold capitalize">
                          {alert.type.replace('_', ' ')} Alert
                        </h3>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Acknowledge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearAlert(alert.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                  <div className="flex items-center gap-2">
                    {alertsEnabled ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BellOff className="h-4 w-4" />
                        <span className="text-sm font-medium">Inactive</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Health Factor Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={healthThreshold}
                    onChange={(e) => setHealthThreshold(parseFloat(e.target.value))}
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
                    value={priceThreshold}
                    onChange={(e) => setPriceThreshold(parseFloat(e.target.value))}
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

                <Button
                  className="w-full"
                  onClick={() => {
                    // Add alert config for all positions
                    positions.forEach(position => {
                      addConfig({
                        positionId: position.id,
                        type: 'health_factor',
                        threshold: healthThreshold,
                        enabled: true,
                      });
                    });
                  }}
                  disabled={positions.length === 0}
                >
                  {positions.length === 0 ? 'No Positions Available' : 'Save Alert Settings'}
                </Button>
              </CardContent>
            </Card>

            {configs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Alert Configurations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {configs.map((config) => {
                      const position = positions.find(p => p.id === config.positionId);
                      return (
                        <div key={config.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex-1">
                            <p className="font-medium capitalize">
                              {config.type.replace('_', ' ')} - {position?.protocol || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Threshold: {config.threshold} | Created: {new Date(config.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleConfig(config.id)}
                              className={config.enabled ? 'text-green-500' : 'text-muted-foreground'}
                            >
                              {config.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeConfig(config.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <span className="text-2xl font-bold text-green-500">
                      {configs.filter(c => c.enabled).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">Active Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Unacknowledged notifications
                      </p>
                    </div>
                    <span className={`text-2xl font-bold ${
                      activeAlerts.filter(a => !a.acknowledged).length > 0
                        ? 'text-orange-500'
                        : 'text-green-500'
                    }`}>
                      {activeAlerts.filter(a => !a.acknowledged).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">Alerts Sent (24h)</p>
                      <p className="text-sm text-muted-foreground">
                        Total alerts in last 24 hours
                      </p>
                    </div>
                    <span className="text-2xl font-bold">
                      {activeAlerts.filter(a =>
                        Date.now() - a.triggeredAt < 24 * 60 * 60 * 1000
                      ).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">Next Check</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic monitoring interval
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      In 30 seconds
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
