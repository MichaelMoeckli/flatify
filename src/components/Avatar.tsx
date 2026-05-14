import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-500 text-white",
  amber: "bg-amber-500 text-white",
};

export function Avatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sizeClass =
    size === "sm" ? "h-6 w-6 text-xs" : size === "lg" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        sizeClass,
        colorMap[color] ?? colorMap.indigo,
      )}
      aria-label={name}
      title={name}
    >
      {initial}
    </span>
  );
}
