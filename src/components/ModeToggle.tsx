import { useSyncExternalStore } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Theme = "light" | "dark" | "system"

function subscribe(onChange: () => void) {
  window.addEventListener("tabwise:theme-change", onChange)
  return () => window.removeEventListener("tabwise:theme-change", onChange)
}

function getTheme(): Theme {
  const theme = document.documentElement.dataset.theme
  return theme === "light" || theme === "dark" ? theme : "system"
}

function getServerTheme(): Theme {
  return "system"
}

function setTheme(value: string) {
  if (value !== "light" && value !== "dark" && value !== "system") return
  window.dispatchEvent(new CustomEvent("tabwise:set-theme", { detail: value }))
}

const themes = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerIcon },
] as const

export function ModeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)
  const icon = themes.find((option) => option.value === theme)!.icon

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
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {themes.map((option) => (
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
