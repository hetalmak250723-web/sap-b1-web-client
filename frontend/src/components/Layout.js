import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AdminWorkspaceShell from "./admin/AdminWorkspaceShell";
import PageWindowFrame from "./PageWindowFrame";
import { SapWindowTaskbar, SapWindowTaskbarProvider } from "./SapWindowTaskbarContext";
import "../styles/sidebar.css";

const Layout = () => {
  const location = useLocation();
  const isAdminWorkspace = location.pathname === "/admin" || location.pathname.startsWith("/admin/");

  return (
    <SapWindowTaskbarProvider>
      {isAdminWorkspace ? (
        <AdminWorkspaceShell>
          <div className="admin-standalone-shell__inner" key={location.pathname}>
            <Outlet />
          </div>
        </AdminWorkspaceShell>
      ) : (
        <div className="app-shell">
          <Sidebar />

          <div className="app-shell__main">
            <Header />

            <div className="app-shell__content" key={location.pathname}>
              <PageWindowFrame>
                <Outlet />
              </PageWindowFrame>
            </div>

            <div className="app-shell__taskbar">
              <SapWindowTaskbar />
            </div>
          </div>
        </div>
      )}
    </SapWindowTaskbarProvider>
  );
};

export default Layout;
