// Build-time iCalendar export: one .ics file per guide that has at least one
// parseable day card. Mirrors src/pages/og/[slug].png.ts. Each day card becomes
// an all-day VEVENT (the `days` schema has a date string but no structured
// times, so all-day is honest, not invented). Output: dist/guides/<slug>.ics.
import { getCollection } from "astro:content";
import { buildIcs, collectDayEvents } from "../../lib/exports";

export async function getStaticPaths() {
  const guides = await getCollection("guides");
  return guides
    .filter((g) => collectDayEvents(g.data).length > 0)
    .map((g) => ({ params: { slug: g.id }, props: { data: g.data } }));
}

export async function GET({ props, params }: { props: { data: any }; params: { slug: string } }) {
  const body = buildIcs(props.data, params.slug);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.slug}.ics"`,
    },
  });
}
