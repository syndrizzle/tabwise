import type { PenPlan } from "@/catalog/catalog"
import { portableGrams, roomyInches } from "@/finder/recommend"
import {
  minStorageOptions,
  needsHandwriting,
  type Answers,
  type PlatformChoice,
  type SizePreference,
  type Step,
  type StudyUse,
} from "@/finder/rules"

export type Choice<T extends string> = {
  value: T
  title: string
  description?: string
  disabled?: boolean
}

export const studyUses: Choice<StudyUse>[] = [
  { value: "notes", title: "Handwritten notes" },
  { value: "pdfs", title: "PDFs & textbooks" },
  { value: "reading", title: "Reading & browsing" },
  { value: "lectures", title: "Lectures & video calls" },
  { value: "productivity", title: "Typed work & multitasking" },
  { value: "diagrams", title: "Drawing & diagrams" },
]

export const useLabel = (use: StudyUse) =>
  studyUses.find((choice) => choice.value === use)!.title.toLowerCase()

export const sizeChoices: Choice<SizePreference>[] = [
  {
    value: "portable",
    title: "Easy to carry",
    description: `Favor a listed upper weight of ${portableGrams}g or less, without accessories.`,
  },
  {
    value: "roomy",
    title: "More screen space",
    description: `Favor screens of at least ${roomyInches} inches for documents and split views.`,
  },
  {
    value: "balanced",
    title: "A good balance",
    description: "Go with my main study use, then the purchase price.",
  },
]

export const platformChoices: Choice<PlatformChoice>[] = [
  { value: "any", title: "No platform requirement" },
  { value: "android", title: "I need Android" },
  { value: "ipados", title: "I need iPadOS" },
  {
    value: "desktop",
    title: "I need Windows or macOS software",
    description:
      "Full desktop apps, local development tools or course-specific desktop software.",
  },
]

export const storageChoices = minStorageOptions.map((value) => ({
  value,
  title: value ? `At least ${value}GB` : "No minimum",
}))

export const suggestedBudgets = [10000, 20000, 30000, 50000]

export const penChoices = (answers: Answers): Choice<PenPlan>[] => {
  const handwriting = needsHandwriting(answers)

  return [
    {
      value: "now",
      title: "Buy a pen now",
      description:
        "Only verified compatible active pens with documented palm rejection. Count the full setup cost.",
    },
    {
      value: "later",
      title: "Keep the option for later",
      description:
        "Verify the pen setup now, but keep a separate pen’s cost outside today’s budget.",
    },
    {
      value: "none",
      title: "No pen needed",
      description: handwriting
        ? "Change your study use first if you don’t need handwriting."
        : "Use touch, reading and typed apps. Pen suitability is not required.",
      disabled: handwriting,
    },
  ]
}

export function questionCopy(step: Step, answers: Answers) {
  switch (step) {
    case "study":
      return { heading: "What will you mainly use it for?" }
    case "pen":
      return {
        heading: "Will you use an active pen?",
        description: needsHandwriting(answers)
          ? "Handwritten notes and drawings need a verified compatible pen."
          : "A pen is optional for reading, lectures, browsing and typed work.",
      }
    case "budget":
      return answers.pen === "now"
        ? {
            heading: "What’s your total setup budget?",
            description:
              "The tablet and its named compatible active pen, together.",
          }
        : {
            heading: "What’s your tablet purchase budget?",
            description:
              answers.pen === "later"
                ? "Count the tablet purchase now. We’ll show the compatible pen’s reference cost separately."
                : "Count the full listed purchase, including any unavoidable bundle. No separate pen is added.",
          }
    case "size":
      return {
        heading: "Room to work, or room in your bag?",
        description:
          "This is a preference, not a hard filter. Any size compromise will be labelled.",
      }
    case "platform":
      return {
        heading: "Does a particular app decide the platform?",
        description:
          "Check your course’s exact app first. A platform match does not guarantee every app version or feature.",
      }
    case "essentials":
      return {
        heading: "Anything else you need?",
        description: "Optional hard requirements.",
      }
  }
}
