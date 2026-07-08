import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors duration-200">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border transition-colors duration-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-fg hover:text-accent transition-colors duration-150"
          >
            Context Relay
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors duration-150 ${
                location.pathname === "/" ? "text-accent" : "text-muted-fg hover:text-fg"
              }`}
            >
              Projects
            </Link>
            <Link
              to="/history"
              className={`text-sm font-medium transition-colors duration-150 ${
                location.pathname === "/history"
                  ? "text-accent"
                  : "text-muted-fg hover:text-fg"
              }`}
            >
              History
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-fg hover:text-fg hover:bg-muted transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                /* Sun icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                /* Moon icon */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="pt-14 min-h-screen">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}