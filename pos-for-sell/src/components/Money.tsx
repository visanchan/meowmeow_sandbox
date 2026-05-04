import { formatTHB } from "@/lib/money/format";
import { cn } from "@/lib/cn";

/**
 * <Money satang={89000} /> → "890 THB" (tabular-nums, accent color).
 *
 * Defaults to bold accent-strong text. Override with `className`.
 */
export function Money({
  satang,
  withUnit = true,
  className,
}: {
  satang: number;
  withUnit?: boolean;
  className?: string;
}) {
  const formatted = formatTHB(satang);
  return (
    <span className={cn("num font-extrabold text-accent-strong", className)}>
      {formatted}
      {withUnit && " THB"}
    </span>
  );
}
