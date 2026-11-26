import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { defaultAnswers } from "@/finder/defaults"
import { pageIds, type FinderView } from "@/finder/page"
import type { FinderPanelProps } from "@/finder/FinderPanel"
import type { Tablet } from "@/catalog/catalog"
import type { Answers } from "@/finder/rules"

const subscribe = () => () => {}
const getFinderRoot = () => document.getElementById(pageIds.root)
const getServerFinderRoot = () => null

export function FinderLauncher() {
  const finderRoot = useSyncExternalStore(
    subscribe,
    getFinderRoot,
    getServerFinderRoot
  )
  const [Panel, setPanel] = useState<ComponentType<FinderPanelProps> | null>(
    null
  )
  const [tablets, setTablets] = useState<Tablet[]>([])
  const [answers, setAnswers] = useState<Answers>(defaultAnswers)
  const [view, setView] = useState<FinderView>("home")
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const launchRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const open = view !== "home"

  useEffect(() => {
    const hero = document.getElementById(pageIds.hero)
    const main = document.getElementById(pageIds.main)
    if (!hero || !main) return

    hero.hidden = open
    main.dataset.view = view
    if (!open && wasOpen.current) {
      window.scrollTo({ top: 0, behavior: "auto" })
      launchRef.current?.focus({ preventScroll: true })
    }
    wasOpen.current = open
  }, [open, view])

  async function openFinder() {
    setLoading(true)
    setFailed(false)

    try {
      if (!Panel) {
        const module = await import("@/finder/FinderPanel")
        const catalog = document.getElementById(pageIds.catalog)?.textContent
        if (!catalog) throw new Error("Finder catalog is missing")

        setTablets(JSON.parse(catalog))
        setPanel(() => module.FinderPanel)
      }
      setView("questions")
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        ref={launchRef}
        type="button"
        size="lg"
        className="mt-6"
        disabled={!finderRoot || loading}
        aria-busy={loading}
        onClick={failed ? () => window.location.reload() : openFinder}
      >
        {loading
          ? "Opening finder…"
          : failed
            ? "Reload and try again"
            : "Find my tablet"}
      </Button>
      {failed && (
        <Alert variant="destructive" className="mt-4 max-w-sm">
          <AlertDescription>
            The finder couldn’t load. Reload the page to try again.
          </AlertDescription>
        </Alert>
      )}
      {Panel &&
        finderRoot &&
        open &&
        createPortal(
          <Panel
            tablets={tablets}
            initialAnswers={answers}
            onHome={(latest) => {
              setAnswers(latest)
              setView("home")
            }}
            onViewChange={setView}
          />,
          finderRoot
        )}
    </>
  )
}
