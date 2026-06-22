import type { ComponentPropsWithoutRef } from "react";

type SeparatorProps = ComponentPropsWithoutRef<"div">;

export default function Separator({ className, ...props }: SeparatorProps) {
  const mergedClassName = ["separator", className].filter(Boolean).join(" ");
  return <div className={mergedClassName} {...props} />;
}
