/**
 * Not a bar — just the count, floated over the top-right of the globe.
 * Kept as a component (and named SiteHeader) so page.tsx owns the layout, not this.
 */
export function SiteHeader({ dreamCount }: { dreamCount: number }) {
  return (
    <span className="meta pointer-events-none absolute right-6 top-6 z-10">
      {dreamCount} dreams for sale
    </span>
  );
}
