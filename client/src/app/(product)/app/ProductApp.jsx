'use client';

import dynamic from 'next/dynamic';

/**
 * The client boundary between Next and the product SPA.
 *
 * `ssr: false` is not an optimisation here, it is a requirement. The app below
 * is a react-router application: BrowserRouter reads `window.location` at
 * construction time, `useAuth` reads the JWT out of localStorage on its first
 * render, and the campaign store rehydrates from localStorage through zustand's
 * persist middleware. None of those exist on the server. Rendering the tree
 * there would either throw or — worse — succeed by producing markup for a
 * signed-out user at a URL the signed-in user asked for, and hydration would
 * then have to blow it away.
 *
 * `next/dynamic` with `ssr: false` is only legal inside a client component,
 * which is what this file is for: the route's page.js stays a server component
 * so it can still export `metadata`.
 *
 * The fallback deliberately paints nothing but the page background. The app
 * decides between the login screen and the workspace by reading a token, and a
 * spinner that resolves into "please log in" reads as a failure; empty space
 * for the same few hundred milliseconds does not.
 */
const App = dynamic(() => import('@product/App'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh' }} />,
});

export default function ProductApp() {
  return <App />;
}
