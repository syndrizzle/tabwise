import type { Offer, PenPlan, Tablet } from "@/catalog/catalog"
import { formatInr } from "@/lib/format"
import { selectedUses, type Requirements } from "@/finder/rules"

export const roomyInches = 12
export const portableGrams = 525

export const isRoomy = (tablet: Tablet) => tablet.screenInches >= roomyInches

export const isPortable = (tablet: Tablet) =>
  tablet.weightUpperGrams !== null && tablet.weightUpperGrams <= portableGrams

export type Match = {
  tablet: Tablet
  offer: Offer
  costNow: number
  priority: number
  reasons: string[]
}

type PricedOffer = { offer: Offer; cost: number }

const costNow = (offer: Offer, pen: PenPlan) =>
  pen === "now" ? offer.totalInr : offer.purchasePriceInr

function qualifyingOffers(tablet: Tablet, needs: Requirements): PricedOffer[] {
  if (
    needs.platform === "desktop" ||
    (needs.platform !== "any" && tablet.platform !== needs.platform)
  ) {
    return []
  }

  return tablet.offers.flatMap((offer) => {
    const cost = costNow(offer, needs.pen)
    const qualifies =
      offer.eligibility[needs.pen] === true &&
      offer.availability !== "out-of-stock" &&
      cost !== null &&
      Number.isSafeInteger(cost) &&
      cost > 0 &&
      offer.storageGb >= needs.minStorage &&
      (!needs.cellular || /4G|5G|LTE|Cellular/i.test(offer.connectivity)) &&
      (!needs.pressure || offer.pressureSensitive === true)

    return qualifies ? [{ offer, cost }] : []
  })
}

function priorityFor(tablet: Tablet, offer: Offer, needs: Requirements) {
  const roomy = isRoomy(tablet)
  const portable = isPortable(tablet)
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
        (Number(portable) + Number(offer.penIncluded && offer.eligibility.now))
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

  return priority
}

function reasonsFor(
  tablet: Tablet,
  { offer, cost }: PricedOffer,
  needs: Requirements
) {
  const reasons = [
    cost === needs.budget
      ? "Fits your purchase budget exactly."
      : `${formatInr(needs.budget - cost)} left in your purchase budget.`,
  ]

  if (
    isRoomy(tablet) &&
    (needs.preference === "roomy" ||
      selectedUses(needs).some((use) =>
        ["pdfs", "diagrams", "productivity"].includes(use)
      ))
  ) {
    reasons.push(
      `${tablet.screenInches.toFixed(1)}-inch screen gives documents and split views more room.`
    )
  } else if (
    isPortable(tablet) &&
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

  return reasons
}

export function recommend(tablets: Tablet[], needs: Requirements): Match[] {
  const matches: Match[] = []

  for (const tablet of tablets) {
    const cheapest = qualifyingOffers(tablet, needs)
      .filter(({ cost }) => cost <= needs.budget)
      .sort(
        (a, b) => a.cost - b.cost || a.offer.id.localeCompare(b.offer.id)
      )[0]

    if (!cheapest) continue

    matches.push({
      tablet,
      offer: cheapest.offer,
      costNow: cheapest.cost,
      priority: priorityFor(tablet, cheapest.offer, needs),
      reasons: reasonsFor(tablet, cheapest, needs),
    })
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

export function minimumCost(tablets: Tablet[], needs: Requirements) {
  const costs = tablets.flatMap((tablet) =>
    qualifyingOffers(tablet, needs).map(({ cost }) => cost)
  )

  return costs.length ? Math.min(...costs) : null
}

export function sizeCompromise(needs: Requirements, matches: Match[]) {
  if (!matches.length) return ""
  if (
    needs.preference === "roomy" &&
    !matches.some((match) => isRoomy(match.tablet))
  ) {
    return `No ${roomyInches}-inch option meets these requirements and budget. These smaller options do.`
  }
  if (
    needs.preference === "portable" &&
    !matches.some((match) => isPortable(match.tablet))
  ) {
    return `No option with a listed upper weight of ${portableGrams}g or less meets these requirements and budget. These heavier options do.`
  }
  return ""
}
