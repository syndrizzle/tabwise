import type { ComponentProps, ReactNode } from "react"

import { Icon } from "@/components/Icon"
import { Button } from "@/components/ui/button"

type TextLinkProps = Omit<ComponentProps<"a">, "children"> &
  Pick<ComponentProps<typeof Button>, "variant" | "size"> & {
    children: ReactNode
    external?: boolean
  }

export function TextLink({
  children,
  className,
  external = false,
  variant = "link",
  size = "sm",
  ...props
}: TextLinkProps) {
  return (
    <Button
      nativeButton={false}
      role="link"
      variant={variant}
      size={size}
      className={className}
      render={
        <a
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          {...props}
        />
      }
    >
      {children}
      {external && <Icon name="external" />}
    </Button>
  )
}
