import { useState, useSyncExternalStore, type ReactNode } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/Icon"

const subscribe = () => () => {}
const getHydrated = () => true
const getServerHydrated = () => false

export function Disclosure({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const hydrated = useSyncExternalStore(
    subscribe,
    getHydrated,
    getServerHydrated
  )

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        disabled={!hydrated}
        render={<Button variant="ghost" size="sm" className="-mx-3" />}
      >
        {title}
        <Icon name={open ? "collapse" : "expand"} />
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted>{children}</CollapsibleContent>
    </Collapsible>
  )
}
