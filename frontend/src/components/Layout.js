import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { SapWindowTaskbar, SapWindowTaskbarProvider } from "./SapWindowTaskbarContext";
import "../styles/sidebar.css";

const Layout = () => {
  const location = useLocation();

  return (
    <SapWindowTaskbarProvider>
      <div className="app-shell">

        <Sidebar />

        <div className="app-shell__main">

          <Header />

          <div className="app-shell__content" key={location.pathname}>
            <Outlet />
          </div>

          <div className="app-shell__taskbar">
            <SapWindowTaskbar />
          </div>
        </div>
      </div>
    </SapWindowTaskbarProvider>
  );
};

export default Layout;
