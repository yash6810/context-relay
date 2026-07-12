import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user, syncing, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg transition-colors duration-200">
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
          <nav className="flex items-center gap-3">
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

            {/* Sync indicator */}
            {syncing && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent-light/50 text-xs text-accent">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Syncing
              </div>
            )}
            {!syncing && user && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-xs text-success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Synced
              </div>
            )}

            {/* Auth button */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-muted-fg max-w-[100px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-xs font-medium text-muted-fg hover:text-destructive transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent"
              >
                Sign in
              </Link>
            )}

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
      <main className="pt-14 flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center text-xs text-muted-fg">
          &copy; {new Date().getFullYear()} Context Relay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}