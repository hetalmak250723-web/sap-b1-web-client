import React, { useState, useCallback, useEffect } from "react";
import "../item-master/styles/itemMaster.css";
import "./styles/businessPartner.css";
import GeneralTab    from "./components/GeneralTab";
import PaymentTab    from "./components/PaymentTab";
import PaymentRunTab from "./components/PaymentRunTab";
import AccountingTab from "./components/AccountingTab";
import AddressTab    from "./components/AddressTab";
import ContactTab    from "./components/ContactTab";
import PropertiesTab from "./components/PropertiesTab";
import RemarksTab    from "./components/RemarksTab";
import {
  createBP, getBP, updateBP, searchBP,
  fetchBPGroups, fetchBPPriceLists, fetchPaymentTerms, fetchCurrencies,
  fetchSalesPersons, fetchNumberingSeries, getNextSeriesNumber,
} from "../../api/businessPartnerApi";
import { searchShippingTypes } from "../../api/shippingTypeApi";
import { searchAccounts }      from "../../api/chartOfAccountsApi";

const TABS  = ["General", "Contact Persons", "Addresses", "Payment Terms", "Payment Run", "Accounting", "Properties", "Remarks"];
const MODES = { ADD: "add", FIND: "find", UPDATE: "update" };

const buildInitialProps = () => {
  const p = {};
  for (let i = 1; i <= 64; i++) p[`Properties${i}`] = "tNO";
  return p;
};

const normalizeBP = (data) => {
  const d = { ...data };
  const bools = ["Valid","Frozen","BlockSendingMarketingContent","PartialDelivery","BackOrder",
    "SinglePayment","EndorsableChecksFromBP","AcceptsEndorsedChecks","PaymentBlock",
    "CollectionAuthorization","Affiliate"];
  bools.forEach((f) => {
    if (d[f] === true  || d[f] === "Y") d[f] = "tYES";
    if (d[f] === false || d[f] === "N") d[f] = "tNO";
  });
  if (!["apNo","apInterestAndFee","apInterestOnly","apFeeOnly"].includes(d.AutomaticPosting))
    d.AutomaticPosting = "apNo";
  if (!d.BPAddresses)      d.BPAddresses      = [];
  if (!d.ContactEmployees) d.ContactEmployees = [];
  for (let i = 1; i <= 64; i++) {
    const k = `Properties${i}`;
    if (d[k] === true || d[k] === "Y") d[k] = "tYES";
    else if (!d[k] || d[k] === false || d[k] === "N") d[k] = "tNO";
  }
  return d;
};

const EMPTY_FORM = {
  Series: "", CardCode: "", CardType: "cCustomer",
  CardName: "", CardForeignName: "",
  GroupCode: "", GroupName: "",
  Currency: "", CurrencyName: "Local Currency",
  // General
  Phone1: "", Phone2: "", Cellular: "", Fax: "",
  EmailAddress: "", Website: "",
  ShippingType: "", ShippingTypeName: "",
  SalesPersonCode: "", SalesEmployeeName: "",
  PeymentMethodCode: "", ProjectCode: "", Indicator: "",
  CompanyPrivate: "cCompany",
  ContactPerson: "", FreeText: "",
  ChannelBP: "", Territory: "", LanguageCode: "",
  GTSRegNo: "", BlockSendingMarketingContent: "tNO",
  AliasName: "", BranchAssignment: "Active",
  Valid: "tYES", ValidFrom: "", ValidTo: "",
  Frozen: "tNO", FrozenFrom: "", FrozenTo: "",
  // Payment Terms
  PayTermsGrpCode: "", PayTermsName: "",
  IntrestRatePercent: "", PriceListNum: "", PriceListName: "",
  DiscountPercent: "", CreditLimit: "", MaxCommitment: "",
  DunningTerm: "", AutomaticPosting: "apNo",
  EffectiveDiscount: "dgrLowestDiscount", EffectivePrice: "epDefaultPriority",
  CreditCardCode: "", CreditCardNum: "", CreditCardExpiration: "",
  AvarageLate: "", Priority: "",
  PartialDelivery: "tNO", BackOrder: "tNO", SinglePayment: "tNO",
  EndorsableChecksFromBP: "tNO", AcceptsEndorsedChecks: "tNO",
  // Payment Run
  HouseBankCountry: "", HouseBank: "", HouseBankAccount: "",
  HouseBankBranch: "", HouseBankIBAN: "", HouseBankSwift: "", HouseBankControlKey: "",
  PaymentBlock: "tNO", CollectionAuthorization: "tNO", BankChargesAllocationCode: "",
  BPPaymentMethods: [],
  // Accounting
  ConsolidationType: "PaymentConsolidation", ConsolidatingBP: "",
  DebitorAccount: "", DebitorAccountName: "",
  DownPaymentClearAct: "", DownPaymentClearActName: "",
  DownPaymentInterimAccount: "", DownPaymentInterimAccountName: "",
  PlanningGroup: "", Affiliate: "tNO",
  // Remarks
  Notes: "",
  // Arrays
  BPAddresses: [], ContactEmployees: [],
  ...buildInitialProps(),
};

function buildPayload(form) {
  const opt = (v) => v !== "" && v != null;
  const num = (v) => (v !== "" && v != null && !isNaN(v) ? Number(v) : undefined);
  const p = {};

  p.CardCode = form.CardCode;
  p.CardName = form.CardName;
  p.CardType = form.CardType || "cCustomer";

  if (opt(form.Series))         { const v = num(form.Series); if (v != null) p.Series = v; }
  if (opt(form.CardForeignName)) p.CardForeignName = form.CardForeignName;
  if (opt(form.GroupCode))      { const v = num(form.GroupCode); if (v != null) p.GroupCode = v; }
  if (opt(form.Currency))        p.Currency = form.Currency;

  if (opt(form.Phone1))          p.Phone1 = form.Phone1;
  if (opt(form.Phone2))          p.Phone2 = form.Phone2;
  if (opt(form.Cellular))        p.Cellular = form.Cellular;
  if (opt(form.Fax))             p.Fax = form.Fax;
  if (opt(form.EmailAddress))    p.EmailAddress = form.EmailAddress;
  if (opt(form.Website))         p.Website = form.Website;
  if (opt(form.ShippingType))   { const v = num(form.ShippingType); if (v != null) p.ShippingType = v; }
  if (opt(form.SalesPersonCode)){ const v = num(form.SalesPersonCode); if (v != null) p.SalesPersonCode = v; }
  if (opt(form.PeymentMethodCode)) p.PeymentMethodCode = form.PeymentMethodCode;
  if (opt(form.ProjectCode))     p.ProjectCode = form.ProjectCode;
  if (opt(form.Indicator))       p.Indicator = form.Indicator;
  p.CompanyPrivate = form.CompanyPrivate || "cCompany";
  if (opt(form.ContactPerson))   p.ContactPerson = form.ContactPerson;
  if (opt(form.FreeText))        p.FreeText = form.FreeText;
  if (opt(form.ChannelBP))       p.ChannelBP = form.ChannelBP;
  if (opt(form.Territory))      { const v = num(form.Territory); if (v != null) p.Territory = v; }
  if (opt(form.LanguageCode))   { const v = num(form.LanguageCode); if (v != null) p.LanguageCode = v; }
  if (opt(form.GTSRegNo))        p.GTSRegNo = form.GTSRegNo;
  p.BlockSendingMarketingContent = form.BlockSendingMarketingContent || "tNO";
  if (opt(form.AliasName))       p.AliasName = form.AliasName;
  p.Valid  = form.Valid  || "tYES";
  if (opt(form.ValidFrom))       p.ValidFrom = form.ValidFrom;
  if (opt(form.ValidTo))         p.ValidTo   = form.ValidTo;
  p.Frozen = form.Frozen || "tNO";
  if (opt(form.FrozenFrom))      p.FrozenFrom = form.FrozenFrom;
  if (opt(form.FrozenTo))        p.FrozenTo   = form.FrozenTo;

  if (opt(form.PayTermsGrpCode)){ const v = num(form.PayTermsGrpCode); if (v != null) p.PayTermsGrpCode = v; }
  if (num(form.IntrestRatePercent) != null) p.IntrestRatePercent = num(form.IntrestRatePercent);
  if (opt(form.PriceListNum))   { const v = num(form.PriceListNum); if (v != null) p.PriceListNum = v; }
  if (num(form.DiscountPercent) != null) p.DiscountPercent = num(form.DiscountPercent);
  if (num(form.CreditLimit)     != null) p.CreditLimit     = num(form.CreditLimit);
  if (num(form.MaxCommitment)   != null) p.MaxCommitment   = num(form.MaxCommitment);
  if (opt(form.DunningTerm))     p.DunningTerm = form.DunningTerm;
  p.AutomaticPosting = form.AutomaticPosting || "apNo";
  if (opt(form.EffectiveDiscount)) p.EffectiveDiscount = form.EffectiveDiscount;
  if (opt(form.EffectivePrice))    p.EffectivePrice    = form.EffectivePrice;
  if (opt(form.CreditCardCode)) { const v = num(form.CreditCardCode); if (v != null) p.CreditCardCode = v; }
  if (opt(form.CreditCardNum))   p.CreditCardNum = form.CreditCardNum;
  if (opt(form.CreditCardExpiration)) p.CreditCardExpiration = form.CreditCardExpiration;
  if (opt(form.Priority))       { const v = num(form.Priority); if (v != null) p.Priority = v; }
  p.PartialDelivery        = form.PartialDelivery        || "tNO";
  p.BackOrder              = form.BackOrder              || "tNO";
  p.SinglePayment          = form.SinglePayment          || "tNO";
  p.EndorsableChecksFromBP = form.EndorsableChecksFromBP || "tNO";
  p.AcceptsEndorsedChecks  = form.AcceptsEndorsedChecks  || "tNO";

  if (opt(form.HouseBankCountry))       p.HouseBankCountry       = form.HouseBankCountry;
  if (opt(form.HouseBank))              p.HouseBank              = form.HouseBank;
  if (opt(form.HouseBankAccount))       p.HouseBankAccount       = form.HouseBankAccount;
  if (opt(form.HouseBankBranch))        p.HouseBankBranch        = form.HouseBankBranch;
  if (opt(form.HouseBankIBAN))          p.HouseBankIBAN          = form.HouseBankIBAN;
  if (opt(form.HouseBankSwift))         p.HouseBankSwift         = form.HouseBankSwift;
  p.PaymentBlock           = form.PaymentBlock           || "tNO";
  p.CollectionAuthorization= form.CollectionAuthorization|| "tNO";
  if (opt(form.BankChargesAllocationCode)) p.BankChargesAllocationCode = form.BankChargesAllocationCode;

  if (opt(form.DebitorAccount))          p.DebitorAccount          = form.DebitorAccount;
  if (opt(form.DownPaymentClearAct))     p.DownPaymentClearAct     = form.DownPaymentClearAct;
  if (opt(form.DownPaymentInterimAccount)) p.DownPaymentInterimAccount = form.DownPaymentInterimAccount;
  if (opt(form.PlanningGroup))           p.PlanningGroup           = form.PlanningGroup;
  p.Affiliate = form.Affiliate || "tNO";
  if (opt(form.Notes)) p.Notes = form.Notes;

  for (let i = 1; i <= 64; i++) {
    if (form[`Properties${i}`] === "tYES") p[`Properties${i}`] = "tYES";
  }

  if (form.BPAddresses?.length > 0) {
    p.BPAddresses = form.BPAddresses
      .filter((a) => a.AddressName && a.AddressName !== "Define New")
      .map((a) => ({
        AddressName: a.AddressName, AddressType: a.AddressType || "bo_BillTo",
        AddressName2: a.AddressName2, AddressName3: a.AddressName3,
        Street: a.Street, StreetNo: a.StreetNo, Block: a.Block,
        BuildingFloorRoom: a.BuildingFloorRoom, City: a.City,
        ZipCode: a.ZipCode, County: a.County, Country: a.Country, State: a.State,
      }));
  }

  if (form.ContactEmployees?.length > 0) {
    p.ContactEmployees = form.ContactEmployees
      .filter((c) => c.Name && c.Name !== "Define New")
      .map((c) => ({
        Name: c.Name, FirstName: c.FirstName, MiddleName: c.MiddleName, LastName: c.LastName,
        Title: c.Title, Position: c.Position, Department: c.Department,
        Phone1: c.Phone1, Phone2: c.Phone2, MobilePhone: c.MobilePhone,
        Fax: c.Fax, E_Mail: c.E_Mail, Active: c.Active || "tYES",
        Gender: c.Gender || "gt_NotSpecified",
        BlockSendingMarketingContent: c.BlockSendingMarketingContent || "tNO",
      }));
  }

  return p;
}

export default function BusinessPartnerModule() {
  const [mode, setMode]       = useState(MODES.ADD);
  const [tab, setTab]         = useState(0);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [alert, setAlert]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [bpGroups, setBpGroups]           = useState([]);
  const [numberingSeries, setNumberingSeries] = useState([]);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [currencyList, setCurrencyList]   = useState([]);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [showCFL, setShowCFL]   = useState(false);
  const [cflResults, setCflResults] = useState([]);

  const isManual  = (s)  => !s || s === "0" || s === "";

  // Load BP groups once
  useEffect(() => {
    fetchBPGroups().then(setBpGroups).catch(() => {});
    // Try to load series from SAP — if none found, dropdown stays as Manual only
    fetchNumberingSeries()
      .then((list) => setNumberingSeries(list.filter((s) => !s.isManual)))
      .catch(() => setNumberingSeries([]));
  }, []);

  const handleSeriesChange = async (e) => {
    const val = e.target.value;
    if (isManual(val)) {
      setForm((p) => ({ ...p, Series: "0", CardCode: "" }));
      setTimeout(() => document.querySelector('input[name="CardCode"]')?.focus(), 50);
      return;
    }
    // Auto series — fetch next number
    setForm((p) => ({ ...p, Series: val, CardCode: "..." }));
    try {
      const next = await getNextSeriesNumber(val);
      setForm((p) => ({ ...p, Series: val, CardCode: next.formattedCode || "" }));
    } catch {
      setForm((p) => ({ ...p, Series: val, CardCode: "" }));
    }
  };

  const resetForm = () => { setForm(EMPTY_FORM); setTab(0); setAlert(null); };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? (checked ? "tYES" : "tNO") : value }));
  }, []);

  const getFieldBG = (name) => {
    const searchable = ["CardCode","CardName","CardForeignName","Phone1","EmailAddress"];
    return mode === MODES.FIND && searchable.includes(name) ? "#FFFFCC" : "#fff";
  };

  const activateFind = useCallback(() => {
    setMode(MODES.FIND);
    resetForm();
    setTimeout(() => document.querySelector('input[name="CardCode"]')?.focus(), 100);
  }, []);

  // Lookup helpers
  const fetchShippingTypesLookup = async (q = "") => {
    try { return (await searchShippingTypes(q)).map((i) => ({ code: i.Code, name: i.Name })); }
    catch { return []; }
  };
  const fetchPaymentTermsLookup = async (q = "") => {
    try { return await fetchPaymentTerms(q); } catch { return []; }
  };
  const fetchGLAccountsLookup = async (q = "") => {
    try { return (await searchAccounts(q)).map((i) => ({ code: i.Code, name: i.Name })); }
    catch { return []; }
  };
  const fetchSalesPersonsLookup = async (q = "") => {
    try { return await fetchSalesPersons(q); } catch { return []; }
  };

  const openCurrencyLookup = async () => {
    setCurrencyModal(true);
    setCurrencyLoading(true);
    try { setCurrencyList(await fetchCurrencies("")); }
    catch { setCurrencyList([]); }
    finally { setCurrencyLoading(false); }
  };

  // CRUD handlers
  const handleAdd = useCallback(async () => {
    if (!form.CardCode.trim()) { showAlert("error", "Card Code is required."); return; }
    if (!form.CardName.trim()) { showAlert("error", "Card Name is required."); return; }
    setLoading(true);
    try {
      await createBP(buildPayload(form));
      showAlert("success", `Business Partner "${form.CardCode}" created successfully.`);
      setMode(MODES.UPDATE);
    } catch (err) {
      showAlert("error", err.response?.data?.message || err.message || "Failed to create.");
    } finally { setLoading(false); }
  }, [form]);

  const handleFind = useCallback(async () => {
    if (!form.CardCode.trim()) { showAlert("error", "Enter a Card Code to search."); return; }
    setLoading(true);
    try {
      try {
        const data = await getBP(form.CardCode.trim());
        setForm({ ...EMPTY_FORM, ...normalizeBP(data) });
        setMode(MODES.UPDATE);
        showAlert("success", `"${data.CardCode}" loaded.`);
      } catch {
        const results = await searchBP(form.CardCode.trim(), form.CardType, 100);
        if (results.length === 0) { showAlert("error", "No matching business partners found."); }
        else if (results.length === 1) {
          const data = await getBP(results[0].CardCode);
          setForm({ ...EMPTY_FORM, ...normalizeBP(data) });
          setMode(MODES.UPDATE);
          showAlert("success", `"${data.CardCode}" loaded.`);
        } else {
          setCflResults(results);
          setShowCFL(true);
        }
      }
    } catch (err) {
      showAlert("error", err.response?.data?.message || err.message || "Search failed.");
    } finally { setLoading(false); }
  }, [form.CardCode, form.CardType]);

  const handleCFLSelect = async (bp) => {
    setShowCFL(false);
    setLoading(true);
    try {
      const data = await getBP(bp.CardCode);
      setForm({ ...EMPTY_FORM, ...normalizeBP(data) });
      setMode(MODES.UPDATE);
      showAlert("success", `"${data.CardCode}" loaded.`);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Failed to load.");
    } finally { setLoading(false); }
  };

  const handleUpdate = useCallback(async () => {
    if (!form.CardCode.trim()) { showAlert("error", "Card Code is required."); return; }
    setLoading(true);
    try {
      await updateBP(form.CardCode.trim(), buildPayload(form));
      showAlert("success", `"${form.CardCode}" updated successfully.`);
    } catch (err) {
      showAlert("error", err.response?.data?.message || err.message || "Failed to update.");
    } finally { setLoading(false); }
  }, [form]);

  const handleSave = useCallback(() => {
    if (mode === MODES.ADD)    return handleAdd();
    if (mode === MODES.UPDATE) return handleUpdate();
    if (mode === MODES.FIND)   return handleFind();
  }, [mode, handleAdd, handleUpdate, handleFind]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "f") { e.preventDefault(); activateFind(); }
      if (e.key === "F2")             { e.preventDefault(); activateFind(); }
      if (e.key === "Escape" && mode === MODES.FIND) { e.preventDefault(); setMode(MODES.ADD); resetForm(); }
      if (e.key === "Enter"  && mode === MODES.FIND) { e.preventDefault(); handleFind(); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.ctrlKey && e.key === "n") { e.preventDefault(); setMode(MODES.ADD); resetForm(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, activateFind, handleFind, handleSave]);

  return (
    <div className="im-page" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Toolbar */}
      <div className="im-toolbar">
        <span className="im-toolbar__title">Business Partner Master Data</span>
        <span className={`im-mode-badge im-mode-badge--${mode}`}>
          {mode === MODES.ADD ? "Add Mode" : mode === MODES.FIND ? "Find Mode" : "Update Mode"}
        </span>
        <button className="im-btn" onClick={() => { setMode(MODES.ADD); resetForm(); }}>New</button>
        <button className={`im-btn${mode === MODES.FIND ? " im-btn--find-active" : ""}`}
          onClick={activateFind} title="Ctrl+F">Find</button>
        {mode === MODES.UPDATE && (
          <button className="im-btn" onClick={resetForm}>Cancel</button>
        )}
      </div>

      {alert && <div className={`im-alert im-alert--${alert.type}`}>{alert.msg}</div>}

      {/* Header card */}
      <div className="im-header-card">
        <div className="bp-header-section">
          <div className="bp-header-left">
            {/* Code row — SAP B1 style: Manual label + CardCode input + CardType */}
            <div className="im-field">
              <label className="im-field__label">Code</label>
              <select
                className="im-field__select"
                name="Series"
                value={form.Series || "0"}
                onChange={handleSeriesChange}
                disabled={mode === MODES.UPDATE}
                style={{ width: 120, flexShrink: 0 }}
              >
                <option value="0">Manual</option>
                {numberingSeries.filter((s) => !s.isManual).map((s) => (
                  <option key={s.series} value={s.series}>
                    {s.name}{s.isDefault ? " ✓" : ""}
                  </option>
                ))}
              </select>
              <input
                className="im-field__input"
                name="CardCode"
                value={form.CardCode}
                onChange={handleChange}
                readOnly={mode === MODES.UPDATE}
                placeholder="Enter Code"
                style={{ flex: 1, background: getFieldBG("CardCode") }}
                autoFocus={mode === MODES.ADD}
              />
              <select
                className="im-field__select"
                name="CardType"
                value={form.CardType}
                onChange={handleChange}
                disabled={mode === MODES.UPDATE}
                style={{ width: 110, flexShrink: 0 }}
              >
                <option value="cCustomer">Customer</option>
                <option value="cSupplier">Supplier</option>
                <option value="cLead">Lead</option>
              </select>
            </div>
            <div className="im-field">
              <label className="im-field__label">Name</label>
              <input className="im-field__input" name="CardName" value={form.CardName}
                onChange={handleChange} style={{ background: getFieldBG("CardName") }} />
            </div>
            <div className="im-field">
              <label className="im-field__label">Foreign Name</label>
              <input className="im-field__input" name="CardForeignName" value={form.CardForeignName} onChange={handleChange} />
            </div>
            <div className="im-field">
              <label className="im-field__label">Group</label>
              <select className="im-field__select" name="GroupCode" value={form.GroupCode} onChange={handleChange}>
                <option value="">-- Select Group --</option>
                {bpGroups.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
              </select>
            </div>
            <div className="im-field">
              <label className="im-field__label">Currency</label>
              <input className="im-field__input" name="Currency" value={form.Currency}
                onChange={handleChange} placeholder="" style={{ flex: 1 }} />
              <button type="button" className="im-lookup-btn" onClick={openCurrencyLookup} title="Browse">…</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="im-tabs">
        {TABS.map((t, i) => (
          <button key={t} type="button"
            className={`im-tab${tab === i ? " im-tab--active" : ""}`}
            onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab panel */}
      <div className="im-tab-panel" style={{ flex: 1 }}>
        {tab === 0 && <GeneralTab form={form} onChange={handleChange} setForm={setForm}
          fetchShippingTypes={fetchShippingTypesLookup} fetchSalesPersons={fetchSalesPersonsLookup}
          getFieldBackground={getFieldBG} />}
        {tab === 1 && <ContactTab form={form} setForm={setForm} />}
        {tab === 2 && <AddressTab form={form} setForm={setForm} />}
        {tab === 3 && <PaymentTab form={form} onChange={handleChange} setForm={setForm}
          fetchBPPriceLists={fetchBPPriceLists} fetchPaymentTerms={fetchPaymentTermsLookup} />}
        {tab === 4 && <PaymentRunTab form={form} onChange={handleChange} />}
        {tab === 5 && <AccountingTab form={form} onChange={handleChange} setForm={setForm}
          fetchGLAccounts={fetchGLAccountsLookup} />}
        {tab === 6 && <PropertiesTab form={form} onChange={handleChange} />}
        {tab === 7 && <RemarksTab form={form} onChange={handleChange} />}
      </div>

      {/* Bottom action bar — SAP B1 style */}
      <div className="bp-bottom-bar">
        <button className="im-btn im-btn--primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : mode === MODES.FIND ? "Find" : mode === MODES.ADD ? "Add" : "Update"}
        </button>
        <button className="im-btn" onClick={() => { setMode(MODES.ADD); resetForm(); }}>Cancel</button>
      </div>

      {/* Currency modal */}
      {currencyModal && (
        <div className="im-modal-overlay" onClick={() => setCurrencyModal(false)}>
          <div className="im-modal" onClick={(e) => e.stopPropagation()}>
            <div className="im-modal__header">
              <span>Select Currency</span>
              <button className="im-modal__close" onClick={() => setCurrencyModal(false)}>✕</button>
            </div>
            <div className="im-modal__body">
              {currencyLoading ? <div className="im-modal__empty">Loading...</div> : (
                <table className="im-lookup-table">
                  <thead><tr><th>Code</th><th>Name</th></tr></thead>
                  <tbody>
                    {currencyList.map((c) => (
                      <tr key={c.code} className="im-lookup-table__row"
                        onClick={() => { setForm((p) => ({ ...p, Currency: c.code, CurrencyName: c.name })); setCurrencyModal(false); }}>
                        <td>{c.code}</td><td>{c.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Choose From List */}
      {showCFL && (
        <div className="im-modal-overlay" onClick={() => setShowCFL(false)}>
          <div className="im-modal im-modal--cfl" onClick={(e) => e.stopPropagation()}>
            <div className="im-modal__header">
              <span>Choose From List — Business Partners</span>
              <button className="im-modal__close" onClick={() => setShowCFL(false)}>✕</button>
            </div>
            <div className="im-modal__body">
              <table className="im-lookup-table">
                <thead><tr><th>Card Code</th><th>Card Name</th><th>Type</th></tr></thead>
                <tbody>
                  {cflResults.map((bp) => (
                    <tr key={bp.CardCode} className="im-lookup-table__row"
                      onClick={() => handleCFLSelect(bp)}>
                      <td>{bp.CardCode}</td>
                      <td>{bp.CardName}</td>
                      <td>{bp.CardType === "cCustomer" ? "Customer" : bp.CardType === "cSupplier" ? "Supplier" : "Lead"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="im-modal__footer">
              <button className="im-btn" onClick={() => setShowCFL(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
