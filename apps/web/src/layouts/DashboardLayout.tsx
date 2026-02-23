import { NavLink, Outlet } from "react-router";

const NAV = [
  { label: "Overview", to: "/" },
  { label: "System Map", to: "/system" },
  { section: "Pipeline" },
  { label: "Pipeline Runs", to: "/pipeline" },
  { label: "Triggers", to: "/triggers" },
  { section: "Agents" },
  { label: "SCIENTIST", to: "/agents/SCIENTIST" },
  { label: "NUTRITIONIST", to: "/agents/NUTRITIONIST" },
  { label: "DIETITIAN", to: "/agents/DIETITIAN" },
  { label: "CHEF", to: "/agents/CHEF" },
  { label: "COACH", to: "/agents/COACH" },
  { label: "PHYSICIAN", to: "/agents/PHYSICIAN" },
  { section: "Data" },
  { label: "Data Explorer", to: "/explorer" },
  { label: "Stats & Costs", to: "/stats" },
] as const;

export function DashboardLayout() {
  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-title">MO Admin</div>
        {NAV.map((item, i) =>
          "section" in item ? (
            <div key={i} className="sidebar-section">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => isActive ? "active" : ""}
            >
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </>
  );
}
