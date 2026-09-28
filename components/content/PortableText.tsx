import Link from "next/link";
import type { PortableTextBlock } from "@/lib/types";
import { track } from "@/lib/analytics/track";

/**
 * Controlled renderer for the Portable Text subset (spec §27: never raw CMS
 * HTML). Renders only the block types defined in lib/types.ts.
 */
export function PortableText({ blocks }: { blocks?: PortableTextBlock[] }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="space-y-4 text-[16px] leading-relaxed">
      {blocks.map((block, i) => (
        <PortableBlock key={i} block={block} />
      ))}
    </div>
  );
}

function PortableBlock({ block }: { block: PortableTextBlock }) {
  switch (block._type) {
    case "block": {
      const text = <MarkedText children_={block.children} markDefs={block.markDefs} />;
      switch (block.style) {
        case "h2":
          return <h2 className="pt-2 font-display text-xl">{text}</h2>;
        case "h3":
          return <h3 className="pt-1 text-lg font-semibold">{text}</h3>;
        case "blockquote":
          return (
            <blockquote className="border-l-2 border-accent-soft pl-4 italic text-text-muted">
              {text}
            </blockquote>
          );
        default:
          return <p>{text}</p>;
      }
    }
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag className={`space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
          {block.items.map((item, i) => (
            <li key={i}>
              {item._type === "block" ? (
                <MarkedText children_={item.children} markDefs={item.markDefs} />
              ) : null}
            </li>
          ))}
        </ListTag>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} className="border-b-2 border-border px-3 py-2 text-left font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="odd:bg-surface even:bg-surface-muted/40">
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-border px-3 py-2 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            block.variant === "warn"
              ? "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5"
              : "border-accent/30 bg-accent-soft/40"
          }`}
        >
          {block.text}
        </div>
      );
    default:
      return null;
  }
}

function MarkedText({
  children_,
  markDefs,
}: {
  children_: { text: string; marks?: string[] }[];
  markDefs?: { _key: string; _type: "link"; href: string }[];
}) {
  return (
    <>
      {children_.map((child, i) => {
        if (!child.marks || child.marks.length === 0) return <span key={i}>{child.text}</span>;
        let node: React.ReactNode = child.text;
        for (const mark of child.marks) {
          if (mark === "strong") node = <strong>{node}</strong>;
          else if (mark === "em") node = <em>{node}</em>;
          else if (mark === "underline") node = <u>{node}</u>;
          else {
            const def = markDefs?.find((d) => d._key === mark);
            if (def && def._type === "link") {
              const isProductLink = def.href.startsWith("/product/");
              node = isProductLink ? (
                <Link
                  href={def.href}
                  className="text-accent underline underline-offset-2"
                  onClick={() => track("guide_to_product_click", { source_surface: "guide-body" })}
                >
                  {node}
                </Link>
              ) : (
                <a href={def.href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                  {node}
                </a>
              );
            }
          }
        }
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}
