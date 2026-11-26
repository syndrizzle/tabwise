import type { PenPlan } from "@/catalog/catalog"
import { formatInr } from "@/lib/format"

export type StudyUse =
  "notes" | "pdfs" | "diagrams" | "reading" | "lectures" | "productivity"
export type SizePreference = "portable" | "roomy" | "balanced"
export type PlatformChoice = "any" | "android" | "ipados" | "desktop"
export const minStorageOptions = [0, 128, 256] as const
export type MinStorage = (typeof minStorageOptions)[number]

export type Step =
  "study" | "pen" | "budget" | "size" | "platform" | "essentials"

export type Answers = {
  budget: string
  primary: StudyUse | ""
  secondary: StudyUse | "none"
  pen: PenPlan | ""
  preference: SizePreference | ""
  platform: PlatformChoice | ""
  cellular: boolean
  minStorage: MinStorage
  pressure: boolean
}

export type Requirements = Omit<
  Answers,
  "budget" | "primary" | "pen" | "preference" | "platform"
> & {
  budget: number
  primary: StudyUse
  pen: PenPlan
  preference: SizePreference
  platform: PlatformChoice
}

export const budgetLimits = { min: 1000, max: 200000 }

type UseSelection = Pick<Answers, "primary" | "secondary">

export const selectedUses = (
  answers: Pick<Requirements, "primary" | "secondary">
) => [
  ...new Set([
    answers.primary,
    ...(answers.secondary === "none" ? [] : [answers.secondary]),
  ]),
]

export const needsHandwriting = ({ primary, secondary }: UseSelection) =>
  [primary, secondary].some((use) => use === "notes" || use === "diagrams")

const usesDiagrams = ({ primary, secondary }: UseSelection) =>
  [primary, secondary].includes("diagrams")

export function asksEssentials(answers: Answers) {
  const withPen = answers.pen !== "" && answers.pen !== "none"

  return (
    answers.platform !== "desktop" &&
    (answers.preference === "portable" ||
      [answers.primary, answers.secondary].some(
        (use) =>
          use === "pdfs" ||
          use === "lectures" ||
          use === "productivity" ||
          (use === "diagrams" && withPen)
      ))
  )
}

export const asksPressure = (answers: Answers) =>
  answers.platform !== "desktop" &&
  answers.pen !== "none" &&
  usesDiagrams(answers)

export const stepsFor = (answers: Answers): Step[] => [
  "study",
  "pen",
  "budget",
  "size",
  "platform",
  ...(asksEssentials(answers) ? (["essentials"] as const) : []),
]

export function reconcile(answers: Answers): Answers {
  const next = { ...answers }

  if (next.secondary === next.primary) next.secondary = "none"
  if (next.pen === "none" && needsHandwriting(next)) next.pen = ""
  if (!asksEssentials(next)) {
    next.cellular = false
    next.minStorage = 0
  }
  if (!asksPressure(next)) next.pressure = false

  return next
}

export function stepError(step: Step, answers: Answers) {
  const budget = Number(answers.budget)

  if (step === "study" && !answers.primary) {
    return "Choose your main study use."
  }
  if (step === "pen" && !answers.pen) {
    return "Choose whether you want a pen now, later or not at all."
  }
  if (step === "pen" && answers.pen === "none" && needsHandwriting(answers)) {
    return "Handwriting needs a verified pen setup. Choose now or later, or change your study use."
  }
  if (
    step === "budget" &&
    (!answers.budget ||
      !Number.isSafeInteger(budget) ||
      budget < budgetLimits.min ||
      budget > budgetLimits.max)
  ) {
    return `Enter a whole-rupee budget between ${formatInr(budgetLimits.min)} and ${formatInr(budgetLimits.max)}.`
  }
  if (step === "size" && !answers.preference) {
    return "Choose a size preference."
  }
  if (step === "platform" && !answers.platform) {
    return "Choose a platform requirement, or no preference."
  }
  return ""
}

export function toRequirements(input: Answers): Requirements | null {
  const answers = reconcile(input)
  const { primary, pen, preference, platform } = answers

  if (
    !primary ||
    !pen ||
    !preference ||
    !platform ||
    stepsFor(answers).some((step) => stepError(step, answers))
  ) {
    return null
  }

  return {
    ...answers,
    budget: Number(answers.budget),
    primary,
    pen,
    preference,
    platform,
  }
}
