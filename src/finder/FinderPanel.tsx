import { useEffect, useRef, useState, type SubmitEvent } from "react"

import {
  budgetLimits,
  minStorageOptions,
  asksPressure,
  reconcile,
  selectedUses,
  stepError,
  stepsFor,
  toRequirements,
  type Answers,
} from "@/finder/rules"
import {
  penChoices,
  platformChoices,
  questionCopy,
  sizeChoices,
  storageChoices,
  studyUses,
  suggestedBudgets,
  useLabel,
  type Choice,
} from "@/finder/questions"
import { minimumCost, recommend, sizeCompromise } from "@/finder/recommend"
import { defaultAnswers } from "@/finder/defaults"
import type { FinderView } from "@/finder/page"
import type { Tablet } from "@/catalog/catalog"
import { formatInr } from "@/lib/format"
import { track } from "@/lib/analytics"
import { MatchCard } from "@/finder/MatchCard"
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

export type FinderPanelProps = {
  tablets: Tablet[]
  initialAnswers: Answers
  onHome: (answers: Answers) => void
  onViewChange: (view: Exclude<FinderView, "home">) => void
}

const headingClass =
  "font-heading text-[clamp(1.8rem,4vw,2.65rem)] leading-tight tracking-tight text-balance outline-none"

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
                {option.description && (
                  <FieldDescription>{option.description}</FieldDescription>
                )}
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
  onViewChange,
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
  const copy = questionCopy(step, answers)
  const compromise = requirements ? sizeCompromise(requirements, matches) : ""

  useEffect(() => {
    onViewChange(view)
    window.scrollTo({ top: 0, behavior: "auto" })
    headingRef.current?.focus({ preventScroll: true })
  }, [view, step, onViewChange])

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
    else if (requirements) {
      setView("results")
      track("finder_complete", { match_count: matches.length })
    }
  }

  return (
    <section className="w-full" aria-label="Student tablet finder">
      <div className="mx-auto mb-8 flex max-w-xl items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onHome(answers)}
        >
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
          className="mx-auto max-w-xl"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="min-h-96 text-center">
            <h1 ref={headingRef} className={headingClass} tabIndex={-1}>
              {copy.heading}
            </h1>
            {copy.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {copy.description}
              </p>
            )}

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
                options={penChoices(answers)}
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
                    min={budgetLimits.min}
                    max={budgetLimits.max}
                    step={1}
                    inputMode="numeric"
                    required
                    value={answers.budget}
                    onChange={(event) => update({ budget: event.target.value })}
                    aria-invalid={!!error}
                    aria-describedby={error ? "finder-error" : undefined}
                  />
                </InputGroup>
                <div
                  className="grid grid-cols-2 gap-2 min-[375px]:grid-cols-4"
                  aria-label="Suggested budgets"
                >
                  {suggestedBudgets.map((amount) => (
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
                      onValueChange={(value) => {
                        const minStorage = minStorageOptions.find(
                          (option) => String(option) === value
                        )
                        if (minStorage !== undefined) update({ minStorage })
                      }}
                    >
                      {storageChoices.map((option) => (
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
                  {asksPressure(answers) && (
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
            <Button type="submit" size="lg" className="col-start-3">
              {stepIndex === steps.length - 1 ? "Show my matches" : "Continue"}
            </Button>
          </div>
        </form>
      ) : (
        requirements && (
          <section aria-labelledby="results-title">
            <div className="mx-auto mb-6 max-w-2xl text-center">
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
              {compromise && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {compromise}
                </p>
              )}
              <Button
                type="button"
                variant="link"
                className="mt-2"
                onClick={() => goTo(0)}
              >
                Edit your answers
              </Button>
            </div>

            {matches.length ? (
              <div className="mx-auto grid max-w-md gap-9 text-left md:max-w-none md:grid-cols-3 md:gap-y-3">
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
