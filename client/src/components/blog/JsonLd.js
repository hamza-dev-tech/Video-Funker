import { ldJson } from '@/lib/blog/schema';

/**
 * The only place structured data is written into the page.
 *
 * It exists so that `ldJson` cannot be forgotten. A bare
 * `JSON.stringify(graph)` looks identical in review and is an XSS hole the
 * moment any string in the graph contains `</script>` — and every graph on this
 * site carries a post title, which is CMS input. Routing all of it through one
 * component makes the unsafe version something you would have to write on
 * purpose.
 */
export default function JsonLd({ graph }) {
  if (!graph) return null;
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- escaped by ldJson, see above
      dangerouslySetInnerHTML={{ __html: ldJson(graph) }}
    />
  );
}
