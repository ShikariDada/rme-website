import Image from "next/image";
import Link from "next/link";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

export const metadata = pageMetadata({
  title: "Browse by room",
  description:
    "Bathroom, kitchen, living room, bedroom, outdoor and elevation — materials picked for each space with honest pricing.",
  path: "/room",
});

export default async function RoomsPage() {
  const [applications, products] = await Promise.all([
    contentSource.getApplications(),
    contentSource.getProducts(),
  ]);
  const active = products.filter((p) => p.status === "active");

  return (
    <Container className="py-10 md:py-14">
      <SectionHeader
        title="Browse by room"
        description="Every space fails differently — we stock materials for how each one is actually used."
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {applications.map((room) => {
          const count = active.filter((p) => p.applicationSlugs.includes(room.slug)).length;
          return (
            <Link
              key={room.slug}
              href={`/room/${room.slug}`}
              className="group overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-surface-muted">
                {room.image && (
                  <Image
                    src={room.image.url}
                    alt={room.image.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-medium">{room.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-text-muted">{room.description}</p>
                {count > 0 && <p className="mt-2 text-xs text-text-muted">{count} products</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
