export const pageIds = {
  hero: "home-hero",
  main: "main",
  root: "tablet-finder",
  catalog: "finder-data",
} as const

export type FinderView = "home" | "questions" | "results"
