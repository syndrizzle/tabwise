import { useEffect, useRef, useState, type SubmitEvent } from "react"

import {
  reconcile,
  stepError,
  stepsFor,
  studyUses,
  toRequirements,
  useLabel,
  type Choice,
} from "@/lib/questions"
import {
  formatInr,
  minimumCost,
  recommend,
  selectedUses,
  type Answers,
  type MinStorage,
  type PlatformChoice,
  type SizePreference,
} from "@/lib/finder"
import { defaultAnswers } from "@/lib/finder-defaults"
import type { Tablet } from "@/lib/catalog"
import { MatchCard } from "@/components/MatchCard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Disclosure } from "@/components/Disclosure"
import { Icon } from "@/components/Icon"

export type FinderPanelProps = {
  tablets: Tablet[]
  initialAnswers: Answers
  onHome: (answers: Answers) => void
}

const headingClass =
  "font-heading text-[clamp(1.8rem,4vw,2.65rem)] leading-tight tracking-tight text-balance outline-none"

const sizeChoices: Choice<SizePreference>[] = [
  {
    value: "portable",
    title: "Easy to carry",
    description:
      "Favor a listed upper weight of 525g or less, without accessories.",
  },
  {
    value: "roomy",
    title: "More screen space",
    description:
      "Favor screens of at least 12 inches for documents and split views.",
  },
  {
    value: "balanced",
    title: "A good balance",
    description: "Go with my main study use, then the purchase price.",
  },
]

const platformChoices: Choice<PlatformChoice>[] = [
  {
    value: "any",
    title: "No platform requirement",
    description: "I can choose tablet apps to suit the device.",
  },
  {
    value: "android",
    title: "I need Android",
    description: "My required course app is available on Android.",
  },
  {
    value: "ipados",
    title: "I need iPadOS",
    description: "My required app needs an iPad.",
  },
  {
    value: "desktop",
    title: "I need Windows or macOS software",
    description:
      "Full desktop apps, local development tools or course-specific desktop software.",
  },
]

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string
  options: Choice<T>[]
  value: T | ""
  onChange: (value: T) => void
  error: string
}) {
  return (
    <FieldSet className="mt-8 text-left">
      <FieldLegend className="sr-only">{label}</FieldLegend>
      <RadioGroup
        aria-label={label}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next as T)
        }}
        aria-invalid={!!error}
        aria-describedby={error ? "finder-error" : undefined}
      >
        {options.map((option) => (
          <FieldLabel key={option.value} htmlFor={`choice-${option.value}`}>
            <Field orientation="horizontal" data-invalid={!!error}>
              <FieldContent>
                <FieldTitle>{option.title}</FieldTitle>
                <FieldDescription>{option.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem
                id={`choice-${option.value}`}
                value={option.value}
                disabled={option.disabled}
              />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

export function FinderPanel({
  tablets,
  initialAnswers,
  onHome,
}: FinderPanelProps) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [stepIndex, setStepIndex] = useState(0)
  const [view, setView] = useState<"questions" | "results">("questions")
  const [error, setError] = useState("")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const steps = stepsFor(answers)
  const step = steps[stepIndex]
  const requirements = toRequirements(answers)
  const matches = requirements ? recommend(tablets, requirements) : []
  const minimum = requirements ? minimumCost(tablets, requirements) : null
  const handwriting = [answers.primary, answers.secondary].some(
    (use) => use === "notes" || use === "diagrams"
  )
  const drawsWithPen =
    [answers.primary, answers.secondary].includes("diagrams") &&
    answers.pen !== "none"

  const headings = {
    study: "What will you mainly use it for?",
    pen: "Will you use an active pen?",
    budget:
      answers.pen === "now"
        ? "What’s your total setup budget?"
        : "What’s your tablet purchase budget?",
    size: "Room to work, or room in your bag?",
    platform: "Does a particular app decide the platform?",
    essentials: "Anything else you need?",
  }

  const descriptions = {
    study: "Choose your main use. You can add one secondary use below.",
    pen: handwriting
      ? "Handwritten notes and drawings need a verified compatible pen. Choose when to buy it."
      : "A pen is optional for reading, lectures, browsing and typed work.",
    budget:
      answers.pen === "now"
        ? "The tablet and its named compatible active pen, together."
        : answers.pen === "later"
          ? "Count the tablet purchase now. We’ll show the compatible pen’s reference cost separately."
          : "Count the full listed purchase, including any unavoidable bundle. No separate pen is added.",
    size: "This is a preference, not a hard filter. Any size compromise will be labelled.",
    platform:
      "Check your course’s exact app first. A platform match does not guarantee every app version or feature.",
    essentials:
      "Optional hard requirements. Leave these off if you’re flexible.",
  }

  useEffect(() => {
    const main = document.getElementById("main")
    if (main) main.dataset.view = view
    window.scrollTo({ top: 0, behavior: "auto" })
    headingRef.current?.focus({ preventScroll: true })
  }, [view, step])

  function update(changes: Partial<Answers>) {
    setAnswers((current) => reconcile({ ...current, ...changes }))
    setError("")
  }

  function goTo(index: number) {
    setError("")
    setStepIndex(index)
    setView("questions")
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = stepError(step, answers)
    if (message) {
      setError(message)
      formRef.current
        ?.querySelector<HTMLElement>(
          step === "budget" ? "#finder-budget" : "[role=radio]"
        )
        ?.focus()
      return
    }

    if (stepIndex < steps.length - 1) goTo(stepIndex + 1)
    else if (requirements) setView("results")
  }

  const sizeFallback =
    requirements &&
    matches.length &&
    requirements.preference === "roomy" &&
    matches.every((match) => match.tablet.screenInches < 12)
      ? "No 12-inch option meets these requirements and budget. These smaller options do."
      : requirements &&
          matches.length &&
          requirements.preference === "portable" &&
          matches.every(
            (match) =>
              match.tablet.weightUpperGrams === null ||
              match.tablet.weightUpperGrams > 525
          )
        ? "No option with a listed upper weight of 525g or less meets these requirements and budget. These heavier options do."
        : ""

  return (
    <section className="w-full" aria-label="Student tablet finder">
      <div className="mx-auto mb-8 flex max-w-xl items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-finder-home
          onClick={() => onHome(answers)}
        >
          <Icon name="back" />
          Home
        </Button>
        <p
          className="text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {view === "results"
            ? "Your matches"
            : `Question ${stepIndex + 1} of ${steps.length}`}
        </p>
      </div>

      {view === "questions" ? (
        <form
          ref={formRef}
          id="finder-form"
          className="mx-auto max-w-xl"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="min-h-96 text-center" data-question={step}>
            <p className="mb-4 text-xs text-muted-foreground">
              {step === "essentials"
                ? "Only what matters to your study day."
                : "A little clarity, one choice at a time."}
            </p>
            <h1 ref={headingRef} className={headingClass} tabIndex={-1}>
              {headings[step]}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {descriptions[step]}
            </p>

            {step === "study" && (
              <>
                <ChoiceGroup
                  label="Main study use"
                  options={studyUses}
                  value={answers.primary}
                  onChange={(primary) => update({ primary })}
                  error={error}
                />
                <Field className="mt-6 text-left">
                  <FieldLabel htmlFor="secondary-use">
                    Optional secondary use
                  </FieldLabel>
                  <Select
                    items={[
                      { value: "none", label: "No secondary use" },
                      ...studyUses
                        .filter((use) => use.value !== answers.primary)
                        .map((use) => ({ value: use.value, label: use.title })),
                    ]}
                    value={answers.secondary}
                    onValueChange={(secondary) => {
                      if (secondary) update({ secondary })
                    }}
                  >
                    <SelectTrigger id="secondary-use">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No secondary use</SelectItem>
                      {studyUses
                        .filter((use) => use.value !== answers.primary)
                        .map((use) => (
                          <SelectItem key={use.value} value={use.value}>
                            {use.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {step === "pen" && (
              <ChoiceGroup
                label="Pen purchase"
                value={answers.pen}
                onChange={(pen) => update({ pen })}
                error={error}
                options={[
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
                ]}
              />
            )}

            {step === "budget" && (
              <Field data-invalid={!!error} className="mx-auto mt-10 max-w-sm">
                <FieldLabel htmlFor="finder-budget">
                  Your budget in rupees
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon aria-hidden="true">₹</InputGroupAddon>
                  <InputGroupInput
                    id="finder-budget"
                    name="budget"
                    type="number"
                    min={1000}
                    max={200000}
                    step={1}
                    inputMode="numeric"
                    required
                    value={answers.budget}
                    onChange={(event) => update({ budget: event.target.value })}
                    aria-invalid={!!error}
                    aria-describedby={`budget-help${error ? " finder-error" : ""}`}
                  />
                </InputGroup>
                <div
                  className="grid grid-cols-2 gap-2 min-[375px]:grid-cols-4"
                  aria-label="Suggested budgets"
                >
                  {[10000, 20000, 30000, 50000].map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant={
                        Number(answers.budget) === amount
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      aria-pressed={Number(answers.budget) === amount}
                      onClick={() => update({ budget: String(amount) })}
                    >
                      {formatInr(amount)}
                    </Button>
                  ))}
                </div>
                <FieldDescription id="budget-help">
                  Choose a starting point, or enter your own amount.
                </FieldDescription>
              </Field>
            )}

            {step === "size" && (
              <ChoiceGroup
                label="Size and portability preference"
                options={sizeChoices}
                value={answers.preference}
                onChange={(preference) => update({ preference })}
                error={error}
              />
            )}

            {step === "platform" && (
              <ChoiceGroup
                label="Required platform"
                options={platformChoices}
                value={answers.platform}
                onChange={(platform) => update({ platform })}
                error={error}
              />
            )}

            {step === "essentials" && (
              <div className="mt-8 text-left">
                <FieldGroup>
                  <FieldLabel htmlFor="needs-cellular">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Built-in mobile data</FieldTitle>
                        <FieldDescription>
                          Only exact 4G/LTE/5G configurations. A SIM/eSIM plan
                          costs extra; Wi-Fi models won’t qualify.
                        </FieldDescription>
                      </FieldContent>
                      <Checkbox
                        id="needs-cellular"
                        checked={answers.cellular}
                        onCheckedChange={(cellular) => update({ cellular })}
                      />
                    </Field>
                  </FieldLabel>
                  <FieldSet>
                    <FieldLegend variant="label">
                      Minimum built-in storage
                    </FieldLegend>
                    <RadioGroup
                      aria-label="Minimum built-in storage"
                      value={String(answers.minStorage)}
                      onValueChange={(minStorage) => {
                        if (minStorage !== null) {
                          update({
                            minStorage: Number(minStorage) as MinStorage,
                          })
                        }
                      }}
                    >
                      {[
                        { value: 0, title: "No minimum" },
                        { value: 128, title: "At least 128GB" },
                        { value: 256, title: "At least 256GB" },
                      ].map((option) => (
                        <Field key={option.value} orientation="horizontal">
                          <RadioGroupItem
                            id={`storage-${option.value}`}
                            value={String(option.value)}
                          />
                          <FieldLabel htmlFor={`storage-${option.value}`}>
                            {option.title}
                          </FieldLabel>
                        </Field>
                      ))}
                    </RadioGroup>
                  </FieldSet>
                  {drawsWithPen && (
                    <FieldLabel htmlFor="needs-pressure">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>
                            Pressure-sensitive drawing pen
                          </FieldTitle>
                          <FieldDescription>
                            Require documented pressure sensitivity for the
                            named pen. Unknowns won’t qualify.
                          </FieldDescription>
                        </FieldContent>
                        <Checkbox
                          id="needs-pressure"
                          checked={answers.pressure}
                          onCheckedChange={(pressure) => update({ pressure })}
                        />
                      </Field>
                    </FieldLabel>
                  )}
                </FieldGroup>
              </div>
            )}
          </div>

          <div className="min-h-10 pt-3">
            <FieldError id="finder-error">{error}</FieldError>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1 pt-3">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goTo(stepIndex - 1)}
              >
                <Icon name="back" />
                Back
              </Button>
            )}
            <div className="col-start-2 hidden w-24 justify-self-center sm:block">
              <Progress
                value={((stepIndex + 1) / steps.length) * 100}
                aria-label="Question progress"
                aria-valuetext={`Question ${stepIndex + 1} of ${steps.length}`}
              />
            </div>
            <Button type="submit" size="lg" className="col-start-3" data-next>
              {stepIndex === steps.length - 1 ? "Show my matches" : "Continue"}
              <Icon name="forward" />
            </Button>
          </div>
        </form>
      ) : (
        requirements && (
          <section aria-labelledby="results-title">
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <p className="mb-3 text-xs text-muted-foreground">
                {matches.length
                  ? "A few good places to start."
                  : "Let’s adjust the search."}
              </p>
              <h1
                ref={headingRef}
                id="results-title"
                className={headingClass}
                tabIndex={-1}
              >
                {matches.length ? "Your shortlist." : "No matches yet."}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                For {selectedUses(requirements).map(useLabel).join(" and ")},
                within {formatInr(requirements.budget)}{" "}
                {requirements.pen === "now"
                  ? "including a compatible pen"
                  : requirements.pen === "later"
                    ? "for today’s tablet purchase; a separate pen is priced for later"
                    : "without adding a separate pen"}
                .
              </p>
              {sizeFallback && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {sizeFallback}
                </p>
              )}
              <Button
                type="button"
                variant="link"
                className="mt-2"
                onClick={() => goTo(0)}
              >
                Edit your answers
                <Icon name="forward" />
              </Button>
            </div>

            {matches.length ? (
              <div
                className="mx-auto grid max-w-md gap-9 text-left md:max-w-none md:grid-cols-3 md:gap-y-3"
                id="result-grid"
              >
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.tablet.id}
                    match={match}
                    index={index}
                    pen={requirements.pen}
                  />
                ))}
              </div>
            ) : (
              <Empty className="mx-auto max-w-xl">
                <EmptyHeader>
                  <EmptyTitle>
                    <h2>
                      {requirements.platform === "desktop"
                        ? "These tablets aren’t a desktop-software replacement."
                        : "No verified purchase meets all these requirements."}
                    </h2>
                  </EmptyTitle>
                  <EmptyDescription>
                    {requirements.platform === "desktop"
                      ? "This catalog covers Android and iPadOS tablets, not local Windows or macOS software. Check a laptop or confirm that your course offers a supported tablet app."
                      : minimum
                        ? `The lowest documented purchase meeting these requirements is ${formatInr(minimum)}. We haven’t raised your budget or relaxed your requirements.`
                        : "No current priced offer in this catalog meets that combination of pen, platform, storage and mobile-data requirements. Unknowns are not treated as matches."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goTo(0)}
                  >
                    <Icon name="back" />
                    Edit requirements
                  </Button>
                </EmptyContent>
              </Empty>
            )}

            <div className="mx-auto mt-10 max-w-2xl text-center">
              <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
                {requirements.pen === "none"
                  ? "Tablet-only matches do not imply active-pen or palm-rejection support. Check the exact app and seller before buying."
                  : "Pen matches require documented compatibility and palm rejection. App behavior, accessory stock and future prices can vary."}
              </p>
              <Disclosure title="How we choose">
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  We filter exact new-India offers by your selected purchase
                  path, budget and hard requirements. We then favor your size
                  preference and main study use; a secondary use has less
                  influence, and lower cost breaks ties. PDFs favor roomy
                  screens, reading favors lower listed weight, lectures favor at
                  least 11 inches, and typed work favors screen space and
                  documented 8GB-or-more RAM. These are simple preference rules,
                  not measured quality scores. Unavailable and historical-only
                  offers stay excluded. We never silently change your
                  requirements.
                </p>
              </Disclosure>
              <Button
                type="button"
                variant="ghost"
                className="mt-5"
                onClick={() => {
                  setAnswers(defaultAnswers())
                  goTo(0)
                }}
              >
                Start again
              </Button>
            </div>
          </section>
        )
      )}
    </section>
  )
}
