import {
  asksEssentials,
  needsHandwriting,
  type Answers,
  type Requirements,
  type StudyUse,
} from "@/lib/finder"

export type Step =
  "study" | "pen" | "budget" | "size" | "platform" | "essentials"

export type Choice<T extends string> = {
  value: T
  title: string
  description: string
  disabled?: boolean
}

export const studyUses: Choice<StudyUse>[] = [
  {
    value: "notes",
    title: "Handwritten notes",
    description: "Write lecture notes, formulas and ideas with a pen.",
  },
  {
    value: "pdfs",
    title: "PDFs & textbooks",
    description: "Read and highlight course material.",
  },
  {
    value: "reading",
    title: "Reading & browsing",
    description: "E-books, research and everyday browsing.",
  },
  {
    value: "lectures",
    title: "Lectures & video calls",
    description: "Recorded classes, live lessons and calls.",
  },
  {
    value: "productivity",
    title: "Typed work & multitasking",
    description: "Documents, slides and light tablet-based work.",
  },
  {
    value: "diagrams",
    title: "Drawing & diagrams",
    description: "Handwritten sketches, figures and visual thinking.",
  },
]

export const useLabel = (use: StudyUse) =>
  studyUses.find((choice) => choice.value === use)!.title.toLowerCase()

const withFallbacks = (answers: Answers) => ({
  ...answers,
  primary: answers.primary || "reading",
  pen: answers.pen || "none",
  preference: answers.preference || "balanced",
})

export const stepsFor = (answers: Answers): Step[] => [
  "study",
  "pen",
  "budget",
  "size",
  "platform",
  ...(answers.platform !== "desktop" && asksEssentials(withFallbacks(answers))
    ? (["essentials"] as const)
    : []),
]

export function reconcile(answers: Answers): Answers {
  const next = { ...answers }

  if (next.secondary === next.primary) next.secondary = "none"
  if (next.pen === "none" && needsHandwriting(withFallbacks(next))) {
    next.pen = ""
  }
  if (next.platform === "desktop" || !asksEssentials(withFallbacks(next))) {
    next.cellular = false
    next.minStorage = 0
  }
  if (
    next.platform === "desktop" ||
    next.pen === "none" ||
    ![next.primary, next.secondary].includes("diagrams")
  ) {
    next.pressure = false
  }

  return next
}

export function stepError(step: Step, answers: Answers) {
  if (step === "study" && !answers.primary) {
    return "Choose your main study use."
  }
  if (step === "pen" && !answers.pen) {
    return "Choose whether you want a pen now, later or not at all."
  }
  if (
    step === "pen" &&
    answers.pen === "none" &&
    needsHandwriting(withFallbacks(answers))
  ) {
    return "Handwriting needs a verified pen setup. Choose now or later, or change your study use."
  }
  if (
    step === "budget" &&
    (!answers.budget ||
      !Number.isSafeInteger(Number(answers.budget)) ||
      Number(answers.budget) < 1000 ||
      Number(answers.budget) > 200000)
  ) {
    return "Enter a whole-rupee budget between ₹1,000 and ₹2,00,000."
  }
  if (step === "size" && !answers.preference) {
    return "Choose a size preference."
  }
  if (step === "platform" && !answers.platform) {
    return "Choose a platform requirement, or no preference."
  }
  return ""
}

export function toRequirements(answers: Answers): Requirements | null {
  if (
    !answers.primary ||
    !answers.pen ||
    !answers.preference ||
    !answers.platform ||
    stepsFor(answers).some((step) => stepError(step, answers))
  ) {
    return null
  }

  return {
    ...answers,
    budget: Number(answers.budget),
    primary: answers.primary,
    pen: answers.pen,
    preference: answers.preference,
    platform: answers.platform,
  }
}
