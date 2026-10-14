import type { ComponentProps, ReactNode } from "react"

import { Icon, type IconName } from "@/components/Icon"
import { Button } from "@/components/ui/button"

type TextLinkProps = Omit<ComponentProps<"a">, "children"> &
  Pick<ComponentProps<typeof Button>, "variant" | "size"> & {
    children: ReactNode
    external?: boolean
    icon?: IconName
  }

export function TextLink({
  children,
  className,
  external = false,
  icon,
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
      {(external || icon) && <Icon name={external ? "external" : icon!} />}
    </Button>
  )
}
