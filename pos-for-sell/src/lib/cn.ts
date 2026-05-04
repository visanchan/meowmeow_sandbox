// Tiny classnames helper — `cn("a", cond && "b", null, "c")` => "a c" or "a b c".

export function cn(
  ...args: Array<string | false | null | undefined | 0>
): string {
  return args.filter(Boolean).join(" ");
}
