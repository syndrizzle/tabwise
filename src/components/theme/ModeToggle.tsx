import { useSyncExternalStore } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isTheme, themeEvents, type Theme } from "@/components/theme/theme"

function subscribe(onChange: () => void) {
  window.addEventListener(themeEvents.change, onChange)
  return () => window.removeEventListener(themeEvents.change, onChange)
}

function getTheme(): Theme {
  const theme = document.documentElement.dataset.theme
  return isTheme(theme) ? theme : "system"
}

function getServerTheme(): Theme {
  return "system"
}

function setTheme(value: string) {
  if (!isTheme(value)) return
  window.dispatchEvent(new CustomEvent(themeEvents.set, { detail: value }))
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerIcon },
] as const

export function ModeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)
  const icon = themeOptions.find((option) => option.value === theme)!.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Change theme" />
        }
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {themeOptions.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="cursor-pointer"
                closeOnClick
              >
                <HugeiconsIcon
                  icon={option.icon}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
