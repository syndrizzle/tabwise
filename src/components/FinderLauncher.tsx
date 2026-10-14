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
import { defaultAnswers } from "@/lib/finder-defaults"
import type { FinderPanelProps } from "@/components/FinderPanel"
import type { Tablet } from "@/lib/catalog"
import type { Answers } from "@/lib/finder"

const subscribe = () => () => {}
const getFinderRoot = () => document.getElementById("tablet-finder")
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
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const launchRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    const hero = document.getElementById("home-hero")
    const main = document.getElementById("main")
    if (!hero || !main) return

    hero.hidden = open
    if (!open) {
      main.dataset.view = "home"
      if (wasOpen.current) {
        window.scrollTo({ top: 0, behavior: "auto" })
        launchRef.current?.focus({ preventScroll: true })
      }
    }
    wasOpen.current = open
  }, [open])

  async function openFinder() {
    setLoading(true)
    setFailed(false)

    try {
      if (!Panel) {
        const module = await import("@/components/FinderPanel")
        const catalog = document.getElementById("finder-data")?.textContent
        if (!catalog) throw new Error("Finder catalog is missing")

        setTablets(JSON.parse(catalog))
        setPanel(() => module.FinderPanel)
      }
      setOpen(true)
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
        data-chooser-launch
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
              setOpen(false)
            }}
          />,
          finderRoot
        )}
    </>
  )
}
