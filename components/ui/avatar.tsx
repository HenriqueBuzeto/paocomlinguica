import * as React from "react";

import { cn } from "@/lib/utils";

function getInitials(name?: string | null) {
  const safe = (name ?? "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Avatar({
  className,
  name,
  src,
  alt,
}: {
  className?: string;
  name?: string | null;
  src?: string | null;
  alt?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border bg-white text-sm font-semibold text-zinc-900 shadow-sm",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? name ?? "Avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="select-none">{getInitials(name)}</span>
      )}
    </div>
  );
}

export { Avatar };
