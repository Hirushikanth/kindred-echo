/** Split comma-separated user input → trimmed nonempty strings */

export function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 80);
}

export function parseLineList(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 120);
}
