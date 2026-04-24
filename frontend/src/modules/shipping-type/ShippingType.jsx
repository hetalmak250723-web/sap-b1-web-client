import React, { useState, useCallback } from "react";
import "../item-master/styles/itemMaster.css";
import {
  createShippingType, getShippingType, updateShippingType,
} from "../../api/shippingTypeApi";

const MODES = { ADD: "add", FIND: "find", UPDATE: "update" };

const EMPTY_FORM = {
  // SAP B1 /ShippingTypes — exact Service Layer field names
  Code:    "",   // integer key — SAP-assigned on create
  Name:    "",   // required
  Website: "",   // URL of the shipping company's tracking site
};

function buildPayload(form) {
  const p = {};
  p.Name = form.Name;
  if (form.Website && form.Website.trim()) {
    p.Website = form.Website.trim();
  }
  return p;
}

export default function ShippingTypeModule() {
  const [mode, setMode]       = useState(MODES.ADD);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(false);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setAlert(null); };

  const handleAdd = async () => {
    if (!form.Name.trim()) { showAlert("error", "Name is required."); return; }
    setLoading(true);
    try {
      const result = await createShippingType(buildPayload(form));
      setForm((prev) => ({ ...prev, Code: result.Code ?? prev.Code }));
      showAlert("success", `Shipping Type "${form.Name}" created successfully.`);
      setMode(MODES.UPDATE);
    } catch (err) {
      showAlert("error", err.response?.data?.message || err.message || "Failed to create.");
    } finally { setLoading(false); }
  };

  const handleFind = async () => {
    const key = form.Code?.toString().trim();
    if (!key) { showAlert("error", "Enter a Code to search."); return; }
    setLoading(true);
    try {
      const data = await getShippingType(key);
      setForm({ ...EMPTY_FORM, ...data });
      setMode(MODES.UPDATE);
      showAlert("success", `"${data.Name}" loaded.`);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Shipping Type not found.");
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    const key = form.Code?.toString().trim();
    if (!key) return;
    setLoading(true);
    try {
      await updateShippingType(key, buildPayload(form));
      showAlert("success", `"${form.Name}" updated successfully.`);
    } catch (err) {
      showAlert("error", err.response?.data?.message || err.message || "Failed to update.");
    } finally { setLoading(false); }
  };

  const handleSave = () => {
    if (mode === MODES.ADD)    return handleAdd();
    if (mode === MODES.UPDATE) return handleUpdate();
    if (mode === MODES.FIND)   return handleFind();
  };

  return (
    <div className="im-page">
      {/* Toolbar */}
      <div className="im-toolbar">
        <span className="im-toolbar__title">Shipping Types</span>
        <span className={`im-mode-badge im-mode-badge--${mode}`}>
          {mode === MODES.ADD ? "Add Mode" : mode === MODES.FIND ? "Find Mode" : "Update Mode"}
        </span>
        <button className="im-btn im-btn--primary" onClick={handleSave} disabled={loading}>
          {loading ? "..." : mode === MODES.FIND ? "Find" : "Save"}
        </button>
        <button className="im-btn" onClick={() => { setMode(MODES.ADD); resetForm(); }}>New</button>
        <button className="im-btn" onClick={() => { setMode(MODES.FIND); resetForm(); }}>Find</button>
        {mode === MODES.UPDATE && (
          <button className="im-btn im-btn--danger" onClick={resetForm}>Cancel</button>
        )}
      </div>

      {alert && <div className={`im-alert im-alert--${alert.type}`}>{alert.msg}</div>}

      {/* Single card — no tabs needed, ShippingTypes is a flat entity */}
      <div className="im-header-card" style={{ marginTop: 10 }}>
        <div className="im-section-title">Shipping Type Details</div>
        <div className="im-field-grid">

          <div className="im-field">
            <label className="im-field__label">Code</label>
            {/* Code: SAP-assigned integer key */}
            <input
              className="im-field__input"
              name="Code"
              value={form.Code}
              onChange={handleChange}
              readOnly={mode === MODES.UPDATE}
              placeholder={mode === MODES.ADD ? "Assigned by SAP" : ""}
              style={mode === MODES.ADD ? { background: "#f0f2f5", color: "#888" } : {}}
              autoFocus
              tabIndex={1}
            />
          </div>

          <div className="im-field">
            <label className="im-field__label">Name</label>
            <input
              className="im-field__input"
              name="Name"
              value={form.Name}
              onChange={handleChange}
              tabIndex={2}
              placeholder="e.g. FedEx, DHL, UPS Ground"
            />
          </div>

          <div className="im-field">
            <label className="im-field__label">Website</label>
            {/* Website: tracking URL for this carrier */}
            <input
              className="im-field__input"
              name="Website"
              value={form.Website}
              onChange={handleChange}
              tabIndex={3}
              placeholder="https://www.fedex.com/tracking"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
