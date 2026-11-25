import type { Locator } from "@playwright/test";

/** Dispatch composed input/change events without recording the field value in a step. */
export async function fillGcdsInput(input: Locator, value: string) {
  await input.focus();
  await input.evaluate((element, text) => {
    const field = element as HTMLInputElement;
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    field.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }, value);
}
