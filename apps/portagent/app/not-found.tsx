import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-4">Page not found</p>
      <Link href="/" className="text-primary underline">
        Back to home
      </Link>
    </main>
  );
}
