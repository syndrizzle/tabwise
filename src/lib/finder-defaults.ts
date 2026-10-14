import type { Answers } from "@/lib/finder"

export const defaultAnswers = (): Answers => ({
  budget: "30000",
  primary: "",
  secondary: "none",
  pen: "",
  preference: "",
  platform: "",
  cellular: false,
  minStorage: 0,
  pressure: false,
})
