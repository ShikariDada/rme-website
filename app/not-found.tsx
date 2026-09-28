import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="font-display text-6xl text-accent-soft">404</p>
      <h1 className="mt-4 text-2xl">This page has moved or never existed</h1>
      <p className="mx-auto mt-3 max-w-md text-text-muted">
        The catalogue is the fastest way back — or WhatsApp us and we will find
        what you were looking for.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <ButtonLink href="/products">Browse products</ButtonLink>
        <Link href="/" className="text-accent underline underline-offset-2">
          Back to home
        </Link>
      </div>
    </Container>
  );
}
