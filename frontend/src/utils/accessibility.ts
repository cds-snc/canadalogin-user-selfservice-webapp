import type { KeyboardEvent } from "react";

export function handleLinkButtonKeyDown(
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  action();
}
