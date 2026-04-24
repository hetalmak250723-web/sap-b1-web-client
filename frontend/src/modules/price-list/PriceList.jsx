import React, { useState, useCallback } from "react";
import "../item-master/styles/itemMaster.css";
import GeneralTab  from "./components/GeneralTab";
import DetailsTab  from "./components/DetailsTab";
import LookupField from "../item-master/components/LookupField";
import {
  createPriceList, getPriceList, updatePriceList,
  fetchBasePriceLists, fetchPLCurrencies,
} from "../../api/priceListApi";

const TABS  = ["General", "Details"];
const MODES = { ADD: "add", FIND: "find", UPDATE: "update" };

const EMPTY_FORM = {
  // SAP B1 /PriceLists fields — exact field names from Service Layer
  PriceListNo:       "",   // read-only key (assigned by SAP on create)
  PriceListName:     "",   // required

  // General tab
  // RoundingMethod: BoRoundingMethod enum
  RoundingMethod:    "borm_NoRounding",
  // Active: BoYesNoEnum
  Active:            "tYES",
  // IsGrossPrice: BoYesNoEnum — price includes tax
  IsGrossPrice:      "tNO",
  // BasePriceList: integer — source price list for factor-based pricing
  BasePriceList:     "",
  BasePriceListName: "",
  // Factor: multiplier applied to base price list
  Factor:            "1",
  // PriceListCurrency: currency code (blank = all currencies)
  PriceListCurrency: "",
  PriceListCurrencyName: "",
  // ValidFrom / ValidTo: date range
  ValidFrom:         "",
  ValidTo:           "",
};

function buildPayload(form) {
  const opt = (v) => v !== "" && v != null;
  const num = (v) => v !== "" && v != null && !isNaN(v) ? Number(v) : undefined;

  const p = {};

  // Required
  p.PriceListName = form.PriceListName;

  // General
  // RoundingMethod: BoRoundingMethod — borm_NoRounding | borm_Ceiling | borm_Commercial | borm_Floor | borm_HalfDown | borm_HalfUp
  if (opt(form.RoundingMethod))  p.RoundingMethod  = form.RoundingMethod;
  // Active: BoYesNoEnum
  p.Active       = form.Active       || "tYES";
  // IsGrossPrice: BoYesNoEnum
  p.IsGrossPrice = form.IsGrossPrice || "tNO";
  // BasePriceList: integer key
  if (num(form.BasePriceList) != null) p.BasePriceList = num(form.BasePriceList);
  // Factor: decimal
  if (num(form.Factor) != null)        p.Factor        = num(form.Factor);
  // Currency
  if (opt(form.PriceListCurrency))     p.PriceListCurrency = form.PriceListCurrency;
  // Validity dates
  if (opt(form.ValidFrom)) p.ValidFrom = form.ValidFrom;
  if (opt(form.ValidTo))   p.ValidTo   = form.ValidTo;

  return p;
}

export default function PriceListModule() {
  const [mode, setMode]       = useState(MODES.ADD);
  const [tab, setTab]         = useState(0);
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

  const resetForm = () => { setForm(EMPTY_FORM); setTab(0); setAlert(null); };

  const handleAdd = async () => {
    if (!form.PriceListName.trim()) { showAlert("error", "Price List Name is required."); return; }
    setLoading(true);
    try {
      const result = await createPriceList(buildPayload(form));
      // SAP returns the assigned PriceListNo — load it back
      setForm((prev) => ({ ...prev, PriceListNo: result.PriceListNo ?? prev.PriceListNo }));
      showAlert("success", `Price List "${form.PriceListName}" created successfully.`);
      setMode(MODES.UPDATE);
    } catch (err) {
      showAlert("error", err.response?.data?.message || err.message || "Failed to create.");
    } finally { setLoading(false); }
  };

  const handleFind = async () => {
    const no = form.PriceListNo?.toString().trim();
    if (!no) { showAlert("error", "Enter a Price List No. to search."); return; }
    setLoading(true);
    try {
      const data = await getPriceList(no);
      setForm({ ...EMPTY_FORM, ...data });
      setMode(MODES.UPDATE);
      showAlert("success", `"${data.PriceListName}" loaded.`);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Price List not found.");
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    const no = form.PriceListNo?.toString().trim();
    if (!no) return;
    setLoading(true);
    try {
      await updatePriceList(no, buildPayload(form));
      showAlert("success", `"${form.PriceListName}" updated successfully.`);
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
        <span className="im-toolbar__title">Price List</span>
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

      {/* Header card */}
      <div className="im-header-card">
        <div className="im-field-grid">

          <div className="im-field">
            <label className="im-field__label">Price List No.</label>
            {/* PriceListNo is SAP-assigned integer key — editable only in Find mode */}
            <input
              className="im-field__input"
              name="PriceListNo"
              value={form.PriceListNo}
              onChange={handleChange}
              readOnly={mode === MODES.UPDATE}
              placeholder={mode === MODES.ADD ? "Assigned by SAP" : ""}
              style={mode === MODES.ADD ? { background: "#f0f2f5", color: "#888" } : {}}
              tabIndex={1}
            />
          </div>

          <div className="im-field">
            <label className="im-field__label">Price List Name</label>
            <input
              className="im-field__input"
              name="PriceListName"
              value={form.PriceListName}
              onChange={handleChange}
              autoFocus
              tabIndex={2}
            />
          </div>

          <div className="im-field">
            <label className="im-field__label">Active</label>
            {/* BoYesNoEnum: tYES | tNO */}
            <select
              className="im-field__select"
              name="Active"
              value={form.Active}
              onChange={handleChange}
              tabIndex={3}
            >
              <option value="tYES">Yes</option>
              <option value="tNO">No</option>
            </select>
          </div>

          <div className="im-field">
            <label className="im-field__label">Currency</label>
            <LookupField
              name="PriceListCurrency"
              value={form.PriceListCurrency}
              displayValue={form.PriceListCurrencyName}
              onChange={handleChange}
              onSelect={(row) =>
                setForm((p) => ({ ...p, PriceListCurrency: row.code, PriceListCurrencyName: row.name }))
              }
              fetchOptions={fetchPLCurrencies}
              placeholder="Currency"
            />
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="im-tabs">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            className={`im-tab${tab === i ? " im-tab--active" : ""}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="im-tab-panel">
        {tab === 0 && (
          <GeneralTab
            form={form}
            onChange={handleChange}
            setForm={setForm}
            fetchBasePriceLists={fetchBasePriceLists}
          />
        )}
        {tab === 1 && <DetailsTab form={form} onChange={handleChange} />}
      </div>
    </div>
  );
}
