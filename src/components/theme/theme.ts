export const themes = ["light", "dark", "system"] as const
export type Theme = (typeof themes)[number]

export const themeStorageKey = "theme"
export const themeEvents = {
  set: "tabwise:set-theme",
  change: "tabwise:theme-change",
}

export const isTheme = (value: unknown): value is Theme =>
  themes.includes(value as Theme)
