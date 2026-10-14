export type Platform = "android" | "ipados"
export type PenPlan = "now" | "later" | "none"
export type Availability = "in-stock" | "out-of-stock" | "unknown"

export type Offer = {
  id: string
  ramGb: number | null
  storageGb: number
  connectivity: string
  purchasePriceInr: number
  totalInr: number | null
  eligibility: Record<PenPlan, boolean>
  tabletPriceInr: number | null
  bundlePriceInr: number | null
  penPriceInr: number | null
  penName: string | null
  penIncluded: boolean
  pressureSensitive: boolean | null
  priceDate: string
  availability: Availability
  priceUrl: string
  penPriceUrl: string | null
}

export type ReviewNote = {
  summary: string
  configuration: string
  limitation: string | null
  url: string
  title: string
}

export type ProductImage = {
  url: string
  width: number
  height: number
  alt: string
  checkedAt: string
  contentType: string
  cacheControl: string
  contentBytes: number
  originalUrl?: string
  sourceUrl: string
}

export type Tablet = {
  id: string
  name: string
  brand: string
  platform: Platform
  screenInches: number
  weightUpperGrams: number | null
  weightLabel: string
  image: ProductImage
  offers: Offer[]
  productUrl: string
  tradeoff: string
  penCaveat: string | null
  reviewNotes: ReviewNote[]
}
