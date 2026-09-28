import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { getActiveAnnouncement } from "@/lib/data";

/** Conditional announcement bar (spec §9.1) — renders only when configured. */
export async function AnnouncementBar() {
  const announcement = await getActiveAnnouncement();
  if (!announcement) return null;
  return (
    <div className="bg-accent text-white">
      <Container className="py-2 text-center text-sm">
        {announcement.href ? (
          <Link href={announcement.href} className="underline-offset-2 hover:underline">
            {announcement.text}
          </Link>
        ) : (
          announcement.text
        )}
      </Container>
    </div>
  );
}
