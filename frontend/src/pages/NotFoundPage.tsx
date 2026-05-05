import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
        Page Not Found
      </h1>
      <p className="mt-6 max-w-md text-base text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          to="/"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Go Home
        </Link>
        <Link
          to="/dashboard"
          className="rounded-lg border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
