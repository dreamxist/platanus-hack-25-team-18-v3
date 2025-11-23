import { Link } from "react-router-dom";

const AppNavbar = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-3 rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Volver al inicio"
        >
          <img
            src="/project-logo.png"
            alt="MiCandida.top"
            className="h-10 w-10 rounded-full border border-border/60 bg-background/80 shadow-sm transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
          <span className="text-base font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
          MiCandida.top
          </span>
        </Link>
      </div>
    </header>
  );
};

export default AppNavbar;

