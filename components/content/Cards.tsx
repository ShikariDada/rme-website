import Link from "next/link";
import Image from "next/image";
import type { Guide, Project } from "@/lib/types";

export function GuideCard({ guide, priority = false }: { guide: Guide; priority?: boolean }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/9] bg-surface-muted">
        {guide.heroImage && (
          <Image
            src={guide.heroImage.url}
            alt={guide.heroImage.alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-medium leading-snug">{guide.title}</h3>
        <p className="line-clamp-3 text-sm text-text-muted">{guide.excerpt}</p>
        <p className="mt-auto pt-2 text-xs text-text-muted">
          Updated {new Date(guide.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
    </Link>
  );
}

export function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-surface-muted">
        {project.images[0] && (
          <Image
            src={project.images[0].url}
            alt={project.images[0].alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {[project.projectType, project.locationLabel].filter(Boolean).join(" · ")}
        </p>
        <h3 className="mt-1 font-medium leading-snug">{project.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{project.summary}</p>
      </div>
    </Link>
  );
}
