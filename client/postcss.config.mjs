/**
 * Declaring a PostCSS config replaces Next's built-in pipeline, so autoprefixer
 * is listed explicitly — Next was running it for the marketing stylesheet
 * before this file existed, and dropping it would silently un-prefix 1,700
 * lines of hand-written CSS.
 *
 * Tailwind runs over every stylesheet in the app, but only one of them has
 * `@tailwind` directives in it (app/(product)/product.css). For the marketing
 * sheets it is a pass-through.
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
