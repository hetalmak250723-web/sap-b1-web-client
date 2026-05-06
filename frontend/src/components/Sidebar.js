import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css";

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

const productionItems = [
  { to: "/bom",                    label: "Bill of Materials",      shortLabel: "BM" },
  { to: "/production-order",       label: "Production Order",       shortLabel: "PO" },
  { to: "/issue-for-production",   label: "Issue for Production",   shortLabel: "IP" },
  { to: "/receipt-from-production",label: "Receipt from Production",shortLabel: "RP" },
];

const inventoryItems = [
  { to: "/goods-receipt", label: "Goods Receipt", shortLabel: "GR" },
  { to: "/goods-issue", label: "Goods Issue", shortLabel: "GI" },
  { to: "/inventory-transfer-request", label: "Inventory Transfer Request", shortLabel: "IR" },
  { to: "/inventory-transfer", label: "Inventory Transfer", shortLabel: "IT" },
];

const salesArItems = [
  { label: "Sales Blanket Agreement", shortLabel: "SB" },
  { to: "/sales-quotation", label: "Sales Quotation", shortLabel: "SQ" },
  { to: "/sales-order", label: "Sales Order", shortLabel: "SO" },
  { to: "/delivery", label: "Delivery", shortLabel: "DL" },
  { label: "Return Request", shortLabel: "RR" },
  { label: "Return", shortLabel: "RT" },
  { label: "A/R Down Payment Request", shortLabel: "DR" },
  { label: "A/R Down Payment Invoice", shortLabel: "DI" },
  { to: "/ar-invoice", label: "A/R Invoice", shortLabel: "AI" },
  { label: "A/R Invoice + Payment", shortLabel: "AP" },
  { to: "/ar-credit-memo", label: "A/R Credit Memo", shortLabel: "CM" },
  { label: "Document Generation Wizard", shortLabel: "DG" },
  { label: "Recurring Transactions", shortLabel: "RC" },
  { label: "Recurring Transaction Templates", shortLabel: "RT" },
  { label: "Document Printing", shortLabel: "DP" },
  { label: "Dunning Wizard", shortLabel: "DW" },
  { label: "Form No. Batch Update", shortLabel: "FB" },
  { label: "Sales Reports", shortLabel: "SR" },
];

const purchasingApItems = [
  { label: "Purchase Blanket Agreement", shortLabel: "PB" },
  { to: "/purchase-request", label: "Purchase Request", shortLabel: "PR" },
  { to: "/purchase-quotation", label: "Purchase Quotation", shortLabel: "PQ" },
  { to: "/purchase-order", label: "Purchase Order", shortLabel: "PO" },
  // { to: "/purchase-request/find", label: "Purchase Request List", shortLabel: "RL" },
  { to: "/grpo", label: "Goods Receipt PO", shortLabel: "GR" },
  { label: "Goods Return Request", shortLabel: "GQ" },
  { label: "Goods Return", shortLabel: "GT" },
  { label: "A/P Down Payment Request", shortLabel: "AR" },
  { label: "A/P Down Payment Invoice", shortLabel: "AD" },
  { to: "/ap-invoice", label: "A/P Invoice", shortLabel: "PI" },
  { to: "/ap-credit-memo", label: "A/P Credit Memo", shortLabel: "PC" },
  { label: "Recurring Transactions", shortLabel: "RC" },
  { label: "Recurring Transaction Templates", shortLabel: "RT" },
  { label: "Landed Costs", shortLabel: "LC" },
  { label: "Input Service Distribution - ISD", shortLabel: "IS" },
  { label: "Procurement Confirmation Wizard", shortLabel: "PW" },
  { label: "Purchase Quotation Generation Wizard", shortLabel: "QW" },
  { label: "Electronic Document Import Wizard", shortLabel: "EW" },
  { label: "Document Printing", shortLabel: "DP" },
  { label: "Form No. Batch Update", shortLabel: "FB" },
  { label: "Attachment", shortLabel: "AT" },
];

const reportItems = [
  { to: "/reports/sales-analysis", label: "Sales Analysis Report", shortLabel: "SA" },
  { to: "/reports/purchase-analysis", label: "Purchase Analysis Report", shortLabel: "PA" },
];

function SidebarLink({ item, collapsed }) {
  if (!item.to) {
    return (
      <div
        className="sidebar__link sidebar__link--placeholder"
        title={collapsed ? item.label : undefined}
      >
        <span className="sidebar__link-icon">{item.shortLabel}</span>
        {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `sidebar__link${isActive ? " sidebar__link--active" : ""}`
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar__link-icon">{item.shortLabel}</span>
      {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
    </NavLink>
  );
}

function SidebarSection({ title, shortTitle, items, open, onToggle, collapsed }) {
  return (
    <div className="sidebar__section">
      <button
        type="button"
        className={`sidebar__section-toggle${open ? " is-open" : ""}`}
        onClick={onToggle}
        title={collapsed ? title : undefined}
      >
        <span className="sidebar__section-title">
          {collapsed ? shortTitle : title}
        </span>
        <span className="sidebar__section-arrow">{open ? "v" : ">"}</span>
      </button>

      {open && (
        <div className={`sidebar__section-body${collapsed ? " is-collapsed" : ""}`}>
          {items.map((item, idx) => (
            <SidebarLink key={item.to || `${item.label}-${idx}`} item={item} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [masterOpen, setMasterOpen] = useState(true);
  const [productionOpen, setProductionOpen] = useState(true);
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);
  const [purchasingOpen, setPurchasingOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);

  return (
    <aside className={`sidebar-shell${collapsed ? " is-collapsed" : ""}`}>
      <div className="sidebar">
        <div className="sidebar__top">
          <button
            type="button"
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="sidebar__collapse-icon">{collapsed ? ">" : "<"}</span>
          </button>

          {!collapsed && (
            <div className="sidebar__brand">
              <div className="sidebar__brand-mark">SB</div>
              <div>
                <div className="sidebar__brand-title">SAP Client</div>
                <div className="sidebar__brand-subtitle">Business One</div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar__content">
          <nav className="sidebar__nav">
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
          </nav>
        </div>
      </div>
    </aside>
  );
}
