// Either a GA4 Measurement ID ("G-…") or a Google Tag Manager container ID ("GTM-…").
export const analyticsId = "G-3NV4WVWVNC"

export const usesTagManager = analyticsId.startsWith("GTM-")

type EventParams = Record<string, string | number>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: "event", name: string, params?: EventParams) => void
  }
}

export type AnalyticsEvent = "finder_start" | "finder_complete" | "price_check"

export function track(event: AnalyticsEvent, params?: EventParams) {
  if (usesTagManager) window.dataLayer?.push({ event, ...params })
  else window.gtag?.("event", event, params)
}
