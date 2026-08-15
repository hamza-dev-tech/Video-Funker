/**
 * Which posts are "related", and in what order.
 *
 * The naive implementation — "the newest N posts in the same category, minus
 * this one" — has a failure mode that looks fine in review and destroys the
 * internal link graph in production. For any post that is not among the newest
 * few in its category, the "minus this one" filter removes nothing, so EVERY
 * article in that category renders the identical three cards. The whole
 * category then links to one hub and nowhere else, which is the opposite of
 * what a related-posts rail is for.
 *
 * So relatedness is scored:
 *
 *     score = 2 · sharedCategories + jaccard(tags)
 *
 * Category overlap dominates because sharing a section is a stronger topical
 * signal than sharing one tag, and Jaccard breaks ties INSIDE a category
 * without letting a post with thirty tags out-rank a focused one.
 *
 * The remaining problem is ties. With no tags anywhere, every candidate in the
 * category scores exactly 2, and a recency tie-break lands you straight back on
 * the identical-three-cards behaviour. So ties break on a stable pair hash: it
 * gives different articles different neighbours even at zero tag coverage, and
 * being a pure function of the two ids it stays constant across renders, so
 * cached HTML does not churn on every revalidation.
 */

/** Stable, symmetric-free pair hash. Deterministic across processes. */
export function rotation(currentId, candidateId) {
  return (Number(currentId) * 31 + Number(candidateId)) % 1000;
}

/**
 * @param {{id: number|string, categories: (number|string)[], tags: (number|string)[], rank: number}} current
 * @param {Array<{id: number|string, categories: (number|string)[], tags: (number|string)[], rank: number}>} candidates
 * @param {number} limit
 */
export function scoreRelated(current, candidates, limit) {
  const curCats = new Set(current.categories);
  const curTags = new Set(current.tags);

  return candidates
    .filter((row) => String(row.id) !== String(current.id))
    .map((row) => {
      const sharedCats = row.categories.filter((c) => curCats.has(c)).length;
      const sharedTags = row.tags.filter((t) => curTags.has(t)).length;
      const union = new Set([...curTags, ...row.tags]).size;
      // Guard the 0/0. A NaN reaching the comparator makes `b.score - a.score`
      // return NaN, and a comparator that returns NaN is INCONSISTENT — the
      // resulting order is implementation-defined garbage, not merely wrong.
      const jaccard = union === 0 ? 0 : sharedTags / union;
      return { row, score: 2 * sharedCats + jaccard };
    })
    // Require some real overlap. Padding the rail with unrelated posts to reach
    // `limit` is worse than showing two: it teaches readers the rail is noise.
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        rotation(current.id, a.row.id) - rotation(current.id, b.row.id) ||
        a.row.rank - b.row.rank
    )
    .slice(0, limit)
    .map((s) => s.row);
}

/** Page a list the way the WP REST API would, so both sources agree. */
export function paginate(items, page, perPage) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const start = (safePage - 1) * perPage;
  return { items: items.slice(start, start + perPage), total: items.length };
}
