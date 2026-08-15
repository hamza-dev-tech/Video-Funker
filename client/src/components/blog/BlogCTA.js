import { appLinks, c, font, type } from '@/config/site';

/**
 * The conversion block under an article.
 *
 * Its copy is a prop rather than a constant because the same component sits
 * under an article, under a category archive and at the bottom of the index,
 * and the same sentence in all three positions is what makes a blog read as
 * generated. Each caller says something specific to what was just read.
 */
export default function BlogCTA({
  heading = 'Want a month of video without a month of filming?',
  body = 'One intake call turns into feed-ready video, scripts and outreach. The first one is free.',
  cta = 'Start free',
}) {
  return (
    <section className="vf-blogcta" aria-labelledby="vf-blogcta-heading">
      <div>
        <h2
          id="vf-blogcta-heading"
          style={{ font: `800 ${type.h3}/1.12 ${font.display}`, color: c.white, letterSpacing: '-0.02em' }}
        >
          {heading}
        </h2>
        <p style={{ font: `400 17px/1.6 ${font.body}`, color: c.blueText, marginTop: 14, maxWidth: '34em' }}>
          {body}
        </p>
      </div>
      <a href={appLinks.signup} className="vf-btn-cta vf-press">
        {cta}
      </a>
    </section>
  );
}
