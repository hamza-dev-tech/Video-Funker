import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/*
          <Link>, not <a href="/">. The app is mounted under a basename now, so
          a raw root-relative anchor leaves the product entirely and drops the
          user on the marketing homepage — the 404 inside the app became the
          way out of it. Link resolves through the router and lands on /app.
        */}
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to dashboard
        </Link>
        {/*
          The deliberate exit, spelled out. A full-page anchor because the
          marketing site is a different route family with its own stylesheet;
          routing to it through react-router would find nothing.
        */}
        <p className="mt-3 text-[14px] text-muted-foreground">
          or go to the{" "}
          <a href="/" className="underline hover:text-foreground">
            Video Funker site
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
