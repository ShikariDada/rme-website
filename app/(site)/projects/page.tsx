import { Container, SectionHeader } from "@/components/ui/Primitives";
import { ProjectCard } from "@/components/content/Cards";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

export const metadata = pageMetadata({
  title: "Projects & showroom displays",
  description:
    "See materials laid at full scale — showroom displays and installation examples from our Mathura showroom.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await contentSource.getProjects();
  return (
    <Container className="py-10 md:py-14">
      <SectionHeader
        title="Displays & installations"
        description="Materials shown the way they actually lay — walk on them in the showroom before you decide."
      />
      {projects.length === 0 ? (
        <p className="text-text-muted">
          Project photos are coming soon — visit the showroom to see current displays.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} priority={i < 3} />
          ))}
        </div>
      )}
    </Container>
  );
}
