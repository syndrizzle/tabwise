import type { Offer, PenPlan, Tablet } from "@/lib/catalog"

export type StudyUse =
  "notes" | "pdfs" | "diagrams" | "reading" | "lectures" | "productivity"
export type SizePreference = "portable" | "roomy" | "balanced"
export type PlatformChoice = "any" | "android" | "ipados" | "desktop"
export type MinStorage = 0 | 128 | 256

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

export type Match = {
  tablet: Tablet
  offer: Offer
  costNow: number
  priority: number
  reasons: string[]
}

type UseSelection = Pick<Requirements, "primary" | "secondary">

export const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

export const selectedUses = (answers: UseSelection) => [
  ...new Set([
    answers.primary,
    ...(answers.secondary === "none" ? [] : [answers.secondary]),
  ]),
]

export const needsHandwriting = (answers: UseSelection) =>
  selectedUses(answers).some((use) => use === "notes" || use === "diagrams")

export const asksEssentials = (
  answers: UseSelection & Pick<Requirements, "pen" | "preference">
) =>
  answers.preference === "portable" ||
  selectedUses(answers).some(
    (use) =>
      use === "pdfs" ||
      use === "lectures" ||
      use === "productivity" ||
      (use === "diagrams" && answers.pen !== "none")
  )

export const costNow = (offer: Offer, pen: PenPlan) =>
  pen === "now" ? offer.totalInr : offer.purchasePriceInr

function applicableRequirements(requirements: Requirements): Requirements {
  const essentials =
    requirements.platform !== "desktop" && asksEssentials(requirements)

  return {
    ...requirements,
    cellular: essentials && requirements.cellular,
    minStorage: essentials ? requirements.minStorage : 0,
    pressure:
      essentials &&
      requirements.pen !== "none" &&
      selectedUses(requirements).includes("diagrams") &&
      requirements.pressure,
  }
}

function isValidRequirements(requirements: Requirements) {
  return (
    Number.isSafeInteger(requirements.budget) &&
    requirements.budget >= 1000 &&
    requirements.budget <= 200000 &&
    [
      "notes",
      "pdfs",
      "diagrams",
      "reading",
      "lectures",
      "productivity",
    ].includes(requirements.primary) &&
    (requirements.secondary === "none" ||
      [
        "notes",
        "pdfs",
        "diagrams",
        "reading",
        "lectures",
        "productivity",
      ].includes(requirements.secondary)) &&
    ["now", "later", "none"].includes(requirements.pen) &&
    ["any", "android", "ipados", "desktop"].includes(requirements.platform) &&
    ["portable", "roomy", "balanced"].includes(requirements.preference) &&
    [0, 128, 256].includes(requirements.minStorage) &&
    typeof requirements.cellular === "boolean" &&
    typeof requirements.pressure === "boolean" &&
    !(needsHandwriting(requirements) && requirements.pen === "none")
  )
}

function qualifyingOffers(tablet: Tablet, requirements: Requirements) {
  const needs = applicableRequirements(requirements)

  if (
    needs.platform === "desktop" ||
    (needs.platform !== "any" && tablet.platform !== needs.platform)
  ) {
    return []
  }

  return tablet.offers.filter((offer) => {
    const cost = costNow(offer, needs.pen)

    return (
      offer.eligibility[needs.pen] === true &&
      offer.availability !== "out-of-stock" &&
      Number.isSafeInteger(cost) &&
      cost! > 0 &&
      offer.storageGb >= needs.minStorage &&
      (!needs.cellular || /4G|5G|LTE|Cellular/i.test(offer.connectivity)) &&
      (!needs.pressure || offer.pressureSensitive === true)
    )
  })
}

export function recommend(
  tablets: Tablet[],
  requirements: Requirements
): Match[] {
  if (!isValidRequirements(requirements)) return []

  const needs = applicableRequirements(requirements)
  const matches: Match[] = []

  for (const tablet of tablets) {
    const offer = qualifyingOffers(tablet, needs)
      .filter((offer) => costNow(offer, needs.pen)! <= needs.budget)
      .sort(
        (a, b) =>
          costNow(a, needs.pen)! - costNow(b, needs.pen)! ||
          a.id.localeCompare(b.id)
      )[0]

    if (!offer) continue

    const cost = costNow(offer, needs.pen)!
    const roomy = tablet.screenInches >= 12
    const portable =
      tablet.weightUpperGrams !== null && tablet.weightUpperGrams <= 525
    let priority =
      (needs.preference === "roomy" && roomy) ||
      (needs.preference === "portable" && portable)
        ? 12
        : 0

    for (const use of selectedUses(needs)) {
      const weight = use === needs.primary ? 2 : 1

      if (use === "pdfs") priority += weight * Number(roomy) * 2
      if (use === "diagrams") {
        priority +=
          weight * (Number(roomy) + Number(offer.pressureSensitive === true))
      }
      if (use === "notes") {
        priority +=
          weight *
          (Number(portable) +
            Number(offer.penIncluded && offer.eligibility.now))
      }
      if (use === "reading") priority += weight * Number(portable)
      if (use === "lectures") {
        priority += weight * Number(tablet.screenInches >= 11)
      }
      if (use === "productivity") {
        priority +=
          weight *
          (Number(roomy) + Number(offer.ramGb !== null && offer.ramGb >= 8))
      }
    }

    const reasons = [
      cost === needs.budget
        ? "Fits your purchase budget exactly."
        : `${formatInr(needs.budget - cost)} left in your purchase budget.`,
    ]

    if (
      roomy &&
      (needs.preference === "roomy" ||
        selectedUses(needs).some((use) =>
          ["pdfs", "diagrams", "productivity"].includes(use)
        ))
    ) {
      reasons.push(
        `${tablet.screenInches.toFixed(1)}-inch screen gives documents and split views more room.`
      )
    } else if (
      portable &&
      (needs.preference === "portable" || needs.primary === "reading")
    ) {
      reasons.push(
        `Listed upper weight is ${tablet.weightUpperGrams}g or less, excluding accessories.`
      )
    }

    if (needs.cellular) {
      reasons.push(
        "This exact configuration includes mobile-data connectivity; a plan costs extra."
      )
    }
    if (needs.minStorage) {
      reasons.push(`${offer.storageGb}GB built-in storage meets your minimum.`)
    }
    if (needs.pressure) {
      reasons.push(
        "The named compatible pen has documented pressure sensitivity."
      )
    }
    if (needs.pen === "now") {
      reasons.push(
        offer.penIncluded
          ? "The verified compatible active pen is included."
          : "The purchase total counts the named compatible active pen."
      )
    }
    if (needs.pen === "later") {
      reasons.push(
        offer.penIncluded
          ? "The verified compatible pen already comes with this offer."
          : `A verified compatible pen can be bought later; ${formatInr(offer.penPriceInr!)} is separate from today's budget.`
      )
    }
    if (needs.pen === "none") {
      reasons.push(
        offer.penIncluded
          ? "The full listed purchase is counted, including its bundled accessory."
          : "No pen purchase is added to your budget."
      )
    }

    matches.push({ tablet, offer, costNow: cost, priority, reasons })
  }

  return matches
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        a.costNow - b.costNow ||
        a.tablet.id.localeCompare(b.tablet.id)
    )
    .slice(0, 3)
}

export function minimumCost(tablets: Tablet[], requirements: Requirements) {
  if (!isValidRequirements(requirements)) return null

  const costs = tablets.flatMap((tablet) =>
    qualifyingOffers(tablet, requirements).map((offer) =>
      costNow(offer, requirements.pen)!
    )
  )

  return costs.length ? Math.min(...costs) : null
}
