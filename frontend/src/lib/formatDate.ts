/**
 * Format an ISO date string as a localized Japanese date (yyyy/mm/dd).
 * Returns "—" for undefined/empty input.
 */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Format an ISO date string as a localized Japanese datetime (yyyy/mm/dd hh:mm).
 * Returns "—" for undefined/empty input.
 */
export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
