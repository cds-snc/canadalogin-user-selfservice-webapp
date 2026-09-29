import type { KeyboardEvent } from "react";

interface LinkButtonKeyDownOptions {
  keys?: readonly string[];
}

export function handleLinkButtonKeyDown(
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
  options?: LinkButtonKeyDownOptions,
) {
  const keys = options?.keys ?? ["Enter", " "];

  if (!keys.includes(event.key)) {
    return;
  }

  event.preventDefault();
  action();
}
