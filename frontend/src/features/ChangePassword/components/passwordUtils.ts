export function isExamplePasswordUsed(candidatePassword: string): boolean {
  const normalized = candidatePassword.replace(/\s+/g, "").toLowerCase();
  return normalized === "pillowmoosedish";
}
