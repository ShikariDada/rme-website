import type { BusinessHours } from "@/lib/types";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function dayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/** Hours table (spec §9.11): accurate or nothing. */
export function HoursTable({ hours }: { hours: BusinessHours[] }) {
  const sorted = [...hours].sort(
    (a, b) => DAY_ORDER.indexOf(a.day.toLowerCase()) - DAY_ORDER.indexOf(b.day.toLowerCase())
  );
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  return (
    <table className="mt-2 w-full text-sm">
      <caption className="sr-only">Showroom opening hours</caption>
      <tbody>
        {sorted.map((h) => (
          <tr key={h.day} className={h.day.toLowerCase() === today ? "font-semibold" : undefined}>
            <th scope="row" className="py-1.5 text-left font-normal">
              {dayLabel(h.day)}
              {h.day.toLowerCase() === today && (
                <span className="ml-2 text-xs text-accent">today</span>
              )}
            </th>
            <td className="py-1.5 text-right">
              {h.closed ? (
                <span className="text-text-muted">Closed</span>
              ) : (
                `${h.opens}–${h.closes}`
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
