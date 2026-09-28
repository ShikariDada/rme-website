import { Checkbox } from "@/components/ui/Input";
import type { FilterOption } from "@/lib/types";

/** Facet keys managed by the filter sheet (mirrors URL param names). */
export type FacetKey =
  | "brand"
  | "room"
  | "size"
  | "finish"
  | "look"
  | "color"
  | "availability"
  | "priceBand";

export interface FilterGroupDef {
  key: FacetKey;
  title: string;
  options: FilterOption[];
}

export function FilterGroup({
  group,
  selected,
  onToggle,
}: {
  group: FilterGroupDef;
  selected: string[];
  onToggle: (key: FacetKey, value: string, checked: boolean) => void;
}) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold">{group.title}</legend>
      <ul className="space-y-0.5">
        {group.options.map((option) => {
          const id = `facet-${group.key}-${option.value}`;
          const checked = selected.includes(option.value);
          return (
            <li key={option.value}>
              <label
                htmlFor={id}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-1.5 text-[15px] hover:bg-surface-muted/70"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onChange={(e) => onToggle(group.key, option.value, e.target.checked)}
                />
                <span className="flex-1">{option.label}</span>
                <span className="text-xs tabular-nums text-text-muted">{option.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
