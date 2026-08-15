/**
 * Categories and their copy.
 *
 * The `description` is not decoration. It is what the category archive uses as
 * its own <h1> subtitle AND as its meta description, which is the difference
 * between an archive Google treats as a thin duplicate of the index and one it
 * treats as a page about something. WordPress stores exactly the same field on
 * a term, so when the CMS is switched on this file stops being the source and
 * nothing else changes.
 *
 * `parent` exists so /blog/topics can render a hub with sections. All three
 * categories are roots today; the field is here because the topic hub builds
 * children from it and adding the first sub-category should not need a schema
 * change.
 */
export const categories = [
  {
    id: 1,
    slug: 'strategy',
    name: 'Strategy',
    parent: 0,
    description:
      'Why founder-led video works, who it works for, and how to decide whether it belongs in your pipeline before you spend a month on it.',
  },
  {
    id: 2,
    slug: 'distribution',
    name: 'Distribution',
    parent: 0,
    description:
      'Getting the video in front of people. Feed mechanics, outreach sequences, and what actually moves reply rates.',
  },
  {
    id: 3,
    slug: 'production',
    name: 'Production',
    parent: 0,
    description:
      'Scripts, presenters, cameras and cost. The practical side of turning one intake call into a month of content.',
  },
];
