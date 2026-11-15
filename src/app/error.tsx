"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

/** Shown when a page fails to load. The header and footer stay in place. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex justify-center py-20">
      <div className="card max-w-md p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-600">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-stone-600">
          This page didn&rsquo;t load properly. It&rsquo;s usually temporary, often a weak connection. Please try again.
        </p>
        {error.digest && <p className="mt-2 text-xs text-stone-500">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link href="/" className="btn btn-outline">
            Go to the home page
          </Link>
        </div>
      </div>
    </div>
  );
}
