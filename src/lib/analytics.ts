// Paste the GA4 Measurement ID (Admin > Data streams > Web) to turn analytics on.
export const gaMeasurementId = ""

type EventParams = Record<string, string | number>

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: EventParams) => void
  }
}

export type AnalyticsEvent = "finder_start" | "finder_complete" | "price_check"

export function track(event: AnalyticsEvent, params?: EventParams) {
  window.gtag?.("event", event, params)
}
