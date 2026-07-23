import { NavLink } from "react-router";

const TABS = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/meals", label: "Meals", icon: "◍" },
  { to: "/training", label: "Training", icon: "▲" },
  { to: "/checkin", label: "Check-in", icon: "✓" },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
