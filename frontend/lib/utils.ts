import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatNumber(
  value: number | string,
  decimals: number = 2,
  prefix: string = ""
): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "0"
  return `${prefix}${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatUSD(value: number | string): string {
  return formatNumber(value, 2, "$")
}

export function formatPercentage(value: number | string): string {
  return formatNumber(value, 2, "") + "%"
}

export function calculateHealthFactor(
  collateralValue: number,
  borrowedValue: number,
  liquidationThreshold: number = 0.8
): number {
  if (borrowedValue === 0) return Infinity
  return (collateralValue * liquidationThreshold) / borrowedValue
}

export function getRiskLevel(healthFactor: number): {
  level: "safe" | "warning" | "danger" | "critical"
  color: string
  label: string
} {
  if (healthFactor >= 2.0) {
    return { level: "safe", color: "text-green-500", label: "Safe" }
  } else if (healthFactor >= 1.5) {
    return { level: "warning", color: "text-yellow-500", label: "Warning" }
  } else if (healthFactor >= 1.2) {
    return { level: "danger", color: "text-orange-500", label: "Danger" }
  } else {
    return { level: "critical", color: "text-red-500", label: "Critical" }
  }
}
