import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/diagnosis", label: "Diagnosis" },
  { to: "/results", label: "Results" },
];

export function AppHeader() {
  return (
    <header className="header border-b border-border px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="ds-label rounded-full border border-border px-3 py-1">
          Studyond
        </span>
        <span className="ds-small text-muted-foreground">Thesis GPS</span>
      </div>
      <nav className="flex items-center gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                "rounded-full px-4 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
              ].join(" ")
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
