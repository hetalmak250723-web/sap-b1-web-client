import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { normalizePath } from '../auth/routeUtils';
import '../styles/sidebar.css';

<<<<<<< HEAD
const DASHBOARD_PATH = '/dashboard';
const STATIC_DASHBOARD_MENU = {
  menuId: 'dashboard-static',
  menuName: 'Dashboard',
  menuPath: DASHBOARD_PATH,
  parentId: null,
  icon: 'dashboard',
  sortOrder: -1,
  children: [],
};
=======
const masterItems = [
  { to: "/item-master",      label: "Item Master",       shortLabel: "IM" },
  { to: "/business-partner", label: "Business Partner",  shortLabel: "BP" },
  { to: "/warehouse",        label: "Warehouses",         shortLabel: "WH" },
  { to: "/price-list",       label: "Price Lists",        shortLabel: "PL" },
  { to: "/tax-code",         label: "Tax Codes",           shortLabel: "TC" },
  { to: "/uom-group",        label: "UoM Groups",           shortLabel: "UG" },
  { to: "/payment-terms",    label: "Payment Terms",        shortLabel: "PT" },
  { to: "/shipping-type",    label: "Shipping Types",       shortLabel: "ST" },
  { to: "/branch",           label: "Branches",             shortLabel: "BR" },
];
>>>>>>> test

const TOP_LEVEL_MENU_PRIORITY = new Map([
  ['dashboard', 0],
  ['sales', 1],
  ['sales a r', 1],
  ['purchase', 2],
  ['purchase a p', 2],
  ['purchasing', 2],
  ['purchasing a p', 2],
  ['master', 3],
  ['production', 4],
  ['inventory', 5],
  ['reports', 6],
  ['report layout manager', 7],
]);

const buildShortLabel = (label, fallback = 'MN') => {
  const words = String(label || '')
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getDisplayMenuName = (menu) => {
  const normalized = String(menu?.menuName || '').trim().toLowerCase();
  if (normalized === 'sales' && !menu?.parentId) {
    return 'Sales - A/R';
  }

<<<<<<< HEAD
  return menu?.menuName;
};

const normalizeMenuPriorityName = (menuName) =>
  String(menuName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const isDashboardMenu = (menu) => {
  const menuPath = menu?.menuPath ? normalizePath(menu.menuPath) : '';
  return menuPath === DASHBOARD_PATH || normalizeMenuPriorityName(menu?.menuName) === 'dashboard';
};

const extractDashboardMenu = (menus = []) => {
  let dashboardMenu = null;

  const stripDashboard = (items) =>
    items.reduce((nextItems, item) => {
      const nextChildren = item.children?.length ? stripDashboard(item.children) : item.children;

      if (isDashboardMenu(item)) {
        if (!dashboardMenu) {
          dashboardMenu = {
            ...item,
            parentId: null,
            menuPath: DASHBOARD_PATH,
            children: [],
          };
        }
        return nextItems;
      }

      nextItems.push(
        nextChildren === item.children
          ? item
          : {
              ...item,
              children: nextChildren,
            },
      );
      return nextItems;
    }, []);

  return {
    dashboardMenu: dashboardMenu || STATIC_DASHBOARD_MENU,
    remainingMenus: stripDashboard(menus),
  };
};

const sortTopLevelMenus = (menus = []) =>
  [...menus].sort((a, b) => {
    const priorityA = TOP_LEVEL_MENU_PRIORITY.get(normalizeMenuPriorityName(a.menuName)) ?? Number.MAX_SAFE_INTEGER;
    const priorityB = TOP_LEVEL_MENU_PRIORITY.get(normalizeMenuPriorityName(b.menuName)) ?? Number.MAX_SAFE_INTEGER;

    if (priorityA !== priorityB) return priorityA - priorityB;
    if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return String(a.menuId).localeCompare(String(b.menuId), undefined, { numeric: true });
  });

const buildSidebarMenus = (menus = []) => {
  const { dashboardMenu, remainingMenus } = extractDashboardMenu(menus);
  return [dashboardMenu, ...sortTopLevelMenus(remainingMenus)];
};

const hasActiveChild = (menu, pathname) => {
  const menuPath = menu.menuPath ? normalizePath(menu.menuPath) : '';
  if (menuPath && (pathname === menuPath || pathname.startsWith(`${menuPath}/`))) {
    return true;
  }

  return menu.children?.some((child) => hasActiveChild(child, pathname));
};

const SidebarMenuNode = ({ menu, collapsed, openState, setOpenState, pathname }) => {
  const hasChildren = Boolean(menu.children?.length);
  const menuPath = menu.menuPath ? normalizePath(menu.menuPath) : '';
  const isOpen = openState[menu.menuId] ?? hasActiveChild(menu, pathname);
  const displayMenuName = getDisplayMenuName(menu);
  const shortLabel = buildShortLabel(displayMenuName, buildShortLabel(menu.icon, 'MN'));

  if (hasChildren) {
=======
const reportItems = [
  { to: "/reports/sales-analysis", label: "Sales Analysis Report", shortLabel: "SA" },
  { to: "/reports/purchase-analysis", label: "Purchase Analysis Report", shortLabel: "PA" },
];

function SidebarLink({ item, collapsed }) {
  if (!item.to) {
>>>>>>> test
    return (
      <div className="sidebar__section">
        <button
          type="button"
          className={`sidebar__section-toggle${isOpen ? ' is-open' : ''}`}
          onClick={() => setOpenState((current) => ({ ...current, [menu.menuId]: !isOpen }))}
          title={collapsed ? displayMenuName : undefined}
        >
          <span className="sidebar__section-title">
            {collapsed ? shortLabel : displayMenuName}
          </span>
        </button>

        {isOpen ? (
          <div className={`sidebar__section-body${collapsed ? ' is-collapsed' : ''}`}>
            {menu.children.map((child) => (
              <SidebarMenuNode
                key={child.menuId}
                menu={child}
                collapsed={collapsed}
                openState={openState}
                setOpenState={setOpenState}
                pathname={pathname}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!menuPath) {
    return null;
  }

  return (
    <NavLink
      to={menuPath}
      end={menuPath === DASHBOARD_PATH}
      className={({ isActive }) =>
        `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
      }
      title={collapsed ? displayMenuName : undefined}
    >
      <span className="sidebar__link-icon">{shortLabel}</span>
      {!collapsed ? <span className="sidebar__link-text">{displayMenuName}</span> : null}
    </NavLink>
  );
};

export default function Sidebar() {
  const location = useLocation();
  const { menus, company } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
<<<<<<< HEAD
  const [openState, setOpenState] = useState({});
  const sidebarMenus = useMemo(() => buildSidebarMenus(menus), [menus]);
=======
  const [masterOpen, setMasterOpen] = useState(true);
  const [productionOpen, setProductionOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);
  const [purchasingOpen, setPurchasingOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);
>>>>>>> test

  return (
    <aside className={`sidebar-shell${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar">
        <div className="sidebar__top">
          <button
            type="button"
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="sidebar__collapse-icon">{collapsed ? '>' : '<'}</span>
          </button>

          {!collapsed ? (
            <div className="sidebar__brand">
              <div className="sidebar__brand-mark">SB</div>
              <div>
                <div className="sidebar__brand-title">SAP Client</div>
                <div className="sidebar__brand-subtitle">{company?.dbName || 'Business One'}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="sidebar__content">
          <nav className="sidebar__nav">
<<<<<<< HEAD
            {sidebarMenus.length ? (
              sidebarMenus.map((menu) => (
                <SidebarMenuNode
                  key={menu.menuId}
                  menu={menu}
                  collapsed={collapsed}
                  openState={openState}
                  setOpenState={setOpenState}
                  pathname={location.pathname}
                />
              ))
            ) : (
              <div className="sidebar__empty">
                No menus are available for this role.
              </div>
            )}
=======
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `sidebar__link sidebar__link--primary${isActive ? " sidebar__link--active" : ""}`
              }
              title={collapsed ? "Dashboard" : undefined}
            >
              <span className="sidebar__link-icon">DB</span>
              {!collapsed && <span className="sidebar__link-text">Dashboard</span>}
            </NavLink>

            <SidebarSection
              title="Master"
              shortTitle="M"
              items={masterItems}
              open={masterOpen}
              onToggle={() => setMasterOpen((prev) => !prev)}
              collapsed={collapsed}
            />

            <SidebarSection
              title="Production"
              shortTitle="PR"
              items={productionItems}
              open={productionOpen}
              onToggle={() => setProductionOpen((prev) => !prev)}
              collapsed={collapsed}
            />

            <SidebarSection
              title="Inventory"
              shortTitle="IN"
              items={inventoryItems}
              open={inventoryOpen}
              onToggle={() => setInventoryOpen((prev) => !prev)}
              collapsed={collapsed}
            />

            <SidebarSection
              title="Sales - A/R"
              shortTitle="SA"
              items={salesArItems}
              open={salesOpen}
              onToggle={() => setSalesOpen((prev) => !prev)}
              collapsed={collapsed}
            />

            <SidebarSection
              title="Purchasing - A/P"
              shortTitle="PA"
              items={purchasingApItems}
              open={purchasingOpen}
              onToggle={() => setPurchasingOpen((prev) => !prev)}
              collapsed={collapsed}
            />

            <SidebarSection
              title="Reports"
              shortTitle="RP"
              items={reportItems}
              open={reportsOpen}
              onToggle={() => setReportsOpen((prev) => !prev)}
              collapsed={collapsed}
            />
>>>>>>> test
          </nav>
        </div>
      </div>
    </aside>
  );
}
