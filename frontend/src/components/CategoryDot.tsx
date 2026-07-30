import type { FestivalCategory } from "@/lib/festivals";

export function CategoryDot({ category }: { category: FestivalCategory }) {
  return <span className={`dot ${category}`} />;
}
