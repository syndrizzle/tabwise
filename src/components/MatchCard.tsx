import { useState } from "react"

import { Separator } from "@/components/ui/separator"
import { OfferCost } from "@/components/OfferCost"
import { Button } from "@/components/ui/button"
import { ReviewEvidence } from "@/components/ReviewEvidence"
import { Icon } from "@/components/Icon"
import { TextLink } from "@/components/TextLink"
import type { PenPlan } from "@/lib/catalog"
import { formatInr, type Match } from "@/lib/finder"

export function MatchCard({
  match,
  index,
  pen,
}: {
  match: Match
  index: number
  pen: PenPlan
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const { tablet, offer, costNow } = match
  const priceDate = new Date(`${offer.priceDate}T00:00:00Z`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  )
  const showPenPrice = pen !== "none" && !offer.penIncluded && offer.penPriceUrl

  return (
    <article
      className="grid min-w-0 items-start gap-3 md:row-span-5 md:grid-rows-subgrid"
      data-tablet={tablet.id}
      aria-labelledby={`result-${tablet.id}`}
    >
      <div className="pb-3" data-result-summary>
        {index > 0 && <Separator className="mb-8 md:hidden" />}
        <p className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">
          {index === 0
            ? "01 / Closest fit"
            : `0${index + 1} / Another good fit`}
        </p>
        <div className="mb-4 grid aspect-4/3 max-h-60 w-full place-items-center overflow-hidden rounded-2xl bg-[#ffffff] p-4 md:max-h-[190px]">
          {imageFailed ? (
            <span className="text-center text-xs text-[#52525b]">
              Product image unavailable
            </span>
          ) : (
            <img
              src={tablet.image.url}
              width={tablet.image.width}
              height={tablet.image.height}
              alt={tablet.image.alt}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              className="size-full min-h-0 object-contain"
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <h2
          id={`result-${tablet.id}`}
          className="text-lg font-semibold tracking-tight"
        >
          {tablet.brand === "Lenovo" ? `Lenovo ${tablet.name}` : tablet.name}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {tablet.screenInches.toFixed(1)}″ display · {tablet.weightLabel} ·{" "}
          {tablet.platform === "ipados" ? "iPadOS" : "Android"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {offer.ramGb === null ? "" : `${offer.ramGb}GB RAM · `}
          {offer.storageGb}GB · {offer.connectivity}
        </p>
        <div className="mt-5 grid gap-5 text-xs leading-relaxed">
          <div>
            <p className="mb-3 flex flex-wrap items-baseline gap-2">
              <strong className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatInr(costNow)}
              </strong>
              <span className="text-muted-foreground">
                {pen === "now" ? "total with pen" : "to buy now"}
              </span>
            </p>
            <OfferCost offer={offer} pen={pen} />
            {pen === "later" && !offer.penIncluded && (
              <p className="mt-2 text-muted-foreground">
                Pen cost is separate from today’s budget. Its future price and
                availability may change.
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-2 font-medium">Why it fits</h3>
            <ul className="list-disc space-y-2 pl-4">
              {match.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Keep in mind</h3>
            <p className="text-muted-foreground">{tablet.tradeoff}</p>
            {!offer.eligibility.now && (
              <p className="mt-2 text-muted-foreground">
                {tablet.penCaveat ??
                  "This offer’s bundled pen is not verified as a compatible active pen. Do not buy this configuration for handwriting."}
              </p>
            )}
          </div>
        </div>
      </div>
      <Button
        nativeButton={false}
        role="link"
        variant="outline"
        size="lg"
        data-result-price
        render={
          <a href={offer.priceUrl} target="_blank" rel="noopener noreferrer" />
        }
      >
        Check purchase price
        <Icon name="external" />
      </Button>
      <div
        className={showPenPrice ? "grid" : "hidden md:block"}
        data-result-pen
      >
        {showPenPrice && (
          <TextLink href={offer.penPriceUrl!} external>
            {pen === "later" ? "See future pen cost" : "Check pen price"}
          </TextLink>
        )}
      </div>
      <p
        className="text-[0.625rem] leading-relaxed text-muted-foreground"
        data-result-reference
      >
        Reference prices · {priceDate}.{" "}
        {offer.availability === "unknown"
          ? "Stock not verified; check with the seller."
          : "Listed in stock when checked; confirm current delivery."}
      </p>
      <ReviewEvidence
        notes={tablet.reviewNotes}
        productUrl={tablet.productUrl}
      />
    </article>
  )
}
