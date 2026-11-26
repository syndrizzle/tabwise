import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const icons = {
  expand: ArrowDown01Icon,
  collapse: ArrowUp01Icon,
  external: ArrowUpRight01Icon,
}

type IconName = keyof typeof icons

type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon"> & {
  name: IconName
}

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      strokeWidth={2}
      aria-hidden="true"
      className={cn("block size-4 shrink-0", className)}
      {...props}
    />
  )
}
