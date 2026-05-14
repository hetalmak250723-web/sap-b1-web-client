import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { flattenMenuTree, normalizePath } from "../auth/routeUtils";
import useFloatingWindow from "./reports/useFloatingWindow";
import { useSapWindowTaskbarActions } from "./SapWindowTaskbarContext";

const DASHBOARD_PATH = "/dashboard";
const WINDOW_FRAME_EXCLUDED_PATHS = new Set([
  "/dashboard",
  "/reports/sales/analysis",
  "/reports/purchasing/analysis",
  "/reports/purchase-analysis",
  "/reports/purchase/analysis",
  "/reports/purchasing/purchase-request-report",
]);

const normalizeMenuName = (menuName = "") =>
  String(menuName || "")
    .trim()
    .toLowerCase();

const getDisplayMenuName = (menuName = "") => {
  const normalized = normalizeMenuName(menuName);
  if (normalized === "report studio") {
    return "Report Layout Manager";
  }

  if (normalized === "sales") {
    return "Sales - A/R";
  }

  if (normalized === "purchase") {
    return "Purchase - A/P";
  }

  return menuName;
};

const prettifyPathTitle = (pathname = "") => {
  const cleaned = String(pathname || "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\d+$/.test(segment));

  if (!cleaned.length) {
    return "Workspace";
  }

  return cleaned
    .map((segment) =>
      segment
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" / ");
};

function PageWindowFrame({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { menus, menuPaths } = useAuth();
  const { closeActiveAndRestorePrevious } = useSapWindowTaskbarActions();
  const normalizedPath = normalizePath(location.pathname);
  const isExcludedPath = WINDOW_FRAME_EXCLUDED_PATHS.has(normalizedPath);

  const flattenedMenus = useMemo(
    () => flattenMenuTree(menus).filter((menu) => menu?.menuPath),
    [menus],
  );

  const currentMenu = useMemo(() => {
    const exactMatch = flattenedMenus.find(
      (menu) => normalizePath(menu.menuPath) === normalizedPath,
    );
    if (exactMatch) {
      return exactMatch;
    }

    return flattenedMenus
      .filter((menu) => normalizedPath.startsWith(`${normalizePath(menu.menuPath)}/`))
      .sort((left, right) => normalizePath(right.menuPath).length - normalizePath(left.menuPath).length)[0] || null;
  }, [flattenedMenus, normalizedPath]);

  const pageTitle = currentMenu?.menuName
    ? getDisplayMenuName(currentMenu.menuName)
    : prettifyPathTitle(normalizedPath);

  const availablePaths = useMemo(
    () => Array.from(new Set((menuPaths || []).map(normalizePath).filter(Boolean))),
    [menuPaths],
  );

  const getFallbackPath = () => {
    const nonCurrentPaths = availablePaths.filter((path) => path !== normalizedPath);
    if (normalizedPath === DASHBOARD_PATH) {
      return nonCurrentPaths[0] || DASHBOARD_PATH;
    }

    if (availablePaths.includes(DASHBOARD_PATH)) {
      return DASHBOARD_PATH;
    }

    return nonCurrentPaths[0] || normalizedPath;
  };

  const windowFrame = useFloatingWindow({
    isOpen: !isExcludedPath,
    defaultTop: 10,
    resetOnClose: false,
    taskId: `page-window:${normalizedPath}`,
    taskPath: normalizedPath,
    taskTitle: pageTitle,
  });

  if (isExcludedPath) {
    return children;
  }

  const handleMinimize = () => {
    windowFrame.toggleMinimize();
    const nextPath = getFallbackPath();
    if (nextPath && nextPath !== normalizedPath) {
      navigate(nextPath);
    }
  };

  const handleClose = () => {
    if (closeActiveAndRestorePrevious()) {
      return;
    }

    const nextPath = getFallbackPath();
    if (nextPath && nextPath !== normalizedPath) {
      navigate(nextPath);
    }
  };

  if (windowFrame.isMinimized) {
    return null;
  }

  return (
    <section
      className={`page-window-frame${windowFrame.isMaximized ? " is-maximized" : ""}`}
      {...windowFrame.windowProps}
    >
      <header
        className="page-window-frame__titlebar"
        aria-label={`${pageTitle} window controls`}
        {...windowFrame.titleBarProps}
      >
        <div className="page-window-frame__controls">
          <button
            type="button"
            aria-label={windowFrame.isMinimized ? "Restore" : "Minimize"}
            onClick={handleMinimize}
          >
            {windowFrame.isMinimized ? "□" : "-"}
          </button>
          <button
            type="button"
            aria-label={windowFrame.isMaximized ? "Restore Down" : "Maximize"}
            onClick={windowFrame.toggleMaximize}
          >
            []
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
          >
            x
          </button>
        </div>
      </header>

      <div className="page-window-frame__body">
        {children}
      </div>
    </section>
  );
}

export default PageWindowFrame;
