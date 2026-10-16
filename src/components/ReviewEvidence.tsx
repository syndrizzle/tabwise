import { Disclosure } from "@/components/Disclosure"
import { TextLink } from "@/components/TextLink"
import type { ReviewNote } from "@/lib/catalog"

export function ReviewEvidence({
  notes,
  productUrl,
  title = "Sources & review notes",
}: {
  notes: ReviewNote[]
  productUrl?: string
  title?: string
}) {
  return (
    <Disclosure title={title}>
      <div className="mt-3 grid max-w-3xl gap-4 text-left text-xs leading-relaxed">
        <p className="text-muted-foreground">
          Documentation-based guidance; we haven’t tested these tablets
          ourselves.
        </p>
        {!notes.length && (
          <p className="text-muted-foreground">
            No independent usage review has been collected for this model.
            Guidance here is based on the cited specifications, compatibility
            and price documentation.
          </p>
        )}
        {productUrl && (
          <TextLink href={productUrl} external size="xs">
            Manufacturer specifications
          </TextLink>
        )}
        <div className="grid gap-5">
          {notes.map((note, index) => (
            <div key={`${note.url}-${index}`}>
              <p>{note.summary}</p>
              <p className="mt-2 text-muted-foreground">
                Tested: {note.configuration}
                {note.limitation && ` · ${note.limitation}`}
              </p>
              <p className="mt-2 text-muted-foreground">{note.title}</p>
              <TextLink href={note.url} external size="xs">
                Read the review
              </TextLink>
            </div>
          ))}
        </div>
      </div>
    </Disclosure>
  )
}
