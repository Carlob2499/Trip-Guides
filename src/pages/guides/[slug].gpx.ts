// Build-time GPX export: one .gpx file per guide that has at least one waypoint.
// Mirrors src/pages/og/[slug].png.ts — getStaticPaths + GET returning a Response.
// Output lands at dist/guides/<slug>.gpx and is linked from the guide's Share modal.
import { getCollection } from "astro:content";
import { buildGpx, collectWaypoints } from "../../lib/exports";

export async function getStaticPaths() {
  const guides = await getCollection("guides");
  // Only guides with at least one waypoint get a file (and, in turn, a link).
  return guides
    .filter((g) => collectWaypoints(g.data).length > 0)
    .map((g) => ({ params: { slug: g.id }, props: { data: g.data } }));
}

export async function GET({ props, params }: { props: { data: any }; params: { slug: string } }) {
  const body = buildGpx(props.data);
  return new Response(body, {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.slug}.gpx"`,
    },
  });
}
