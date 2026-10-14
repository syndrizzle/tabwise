import type { Offer, PenPlan } from "@/lib/catalog"
import { formatInr } from "@/lib/finder"

export function OfferCost({ offer, pen }: { offer: Offer; pen: PenPlan }) {
  return (
    <dl className="grid gap-2 text-muted-foreground">
      <div className="flex justify-between gap-3">
        <dt>
          {offer.bundlePriceInr === null
            ? offer.penIncluded
              ? "Tablet + included pen"
              : "Tablet"
            : "Priced bundle"}
        </dt>
        <dd className="shrink-0 tabular-nums">
          {formatInr(offer.purchasePriceInr)}
        </dd>
      </div>
      {pen !== "none" && offer.eligibility[pen] && (
        <div className="flex justify-between gap-3">
          <dt>
            {offer.penName}
            {pen === "later" && !offer.penIncluded ? " · buy later" : ""}
          </dt>
          <dd className="shrink-0 tabular-nums">
            {offer.penIncluded ? "Included" : formatInr(offer.penPriceInr!)}
          </dd>
        </div>
      )}
      {pen === "later" && !offer.penIncluded && (
        <div className="flex justify-between gap-3">
          <dt>Tablet + pen reference total</dt>
          <dd className="shrink-0 tabular-nums">
            {formatInr(offer.totalInr!)}
          </dd>
        </div>
      )}
    </dl>
  )
}
