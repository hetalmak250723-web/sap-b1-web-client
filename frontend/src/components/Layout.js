import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../styles/sidebar.css";

const Layout = ({ children }) => {
  return (
    <div className="app-shell">

      <Sidebar />

      <div className="app-shell__main">

        <Header />

        <div className="app-shell__content">
          {children}
        </div>

      </div>

    </div>
  );
};

export default Layout;
