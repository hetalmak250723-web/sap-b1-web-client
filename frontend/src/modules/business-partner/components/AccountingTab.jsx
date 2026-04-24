import React from "react";
import LookupField from "../../item-master/components/LookupField";

export default function AccountingTab({ form, onChange, setForm, fetchGLAccounts }) {
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Consolidating Business Partner */}
      <div className="im-section-title">Consolidating Business Partner</div>
      <div style={{ display: "flex", gap: 24, marginLeft: 20, marginBottom: 8 }}>
        <label className="im-checkbox-label">
          <input type="radio" name="ConsolidationType" value="PaymentConsolidation"
            checked={form.ConsolidationType !== "DeliveryConsolidation"}
            onChange={onChange} />
          <span>Payment Consolidation</span>
        </label>
        <label className="im-checkbox-label">
          <input type="radio" name="ConsolidationType" value="DeliveryConsolidation"
            checked={form.ConsolidationType === "DeliveryConsolidation"}
            onChange={onChange} />
          <span>Delivery Consolidation</span>
        </label>
      </div>
      <div className="im-field" style={{ marginBottom: 20, maxWidth: 500 }}>
        <label className="im-field__label" style={{ flex: "0 0 220px" }}>Consolidating BP</label>
        <input className="im-field__input" name="ConsolidatingBP" value={form.ConsolidatingBP || ""} onChange={onChange} />
      </div>

      {/* GL Accounts */}
      <div className="im-field" style={{ marginBottom: 6, maxWidth: 600 }}>
        <label className="im-field__label" style={{ flex: "0 0 240px" }}>Accounts Receivable</label>
        <LookupField
          name="DebitorAccount"
          value={form.DebitorAccount || ""}
          displayValue={form.DebitorAccountName || ""}
          onChange={onChange}
          onSelect={(row) => setForm((p) => ({ ...p, DebitorAccount: row.code, DebitorAccountName: row.name }))}
          fetchOptions={fetchGLAccounts}
          placeholder="Accounts Receivable"
        />
      </div>
      <div className="im-field" style={{ marginBottom: 6, maxWidth: 600 }}>
        <label className="im-field__label" style={{ flex: "0 0 240px" }}>Down Payment Clearing Account</label>
        <LookupField
          name="DownPaymentClearAct"
          value={form.DownPaymentClearAct || ""}
          displayValue={form.DownPaymentClearActName || ""}
          onChange={onChange}
          onSelect={(row) => setForm((p) => ({ ...p, DownPaymentClearAct: row.code, DownPaymentClearActName: row.name }))}
          fetchOptions={fetchGLAccounts}
          placeholder="Down Payment Clearing"
        />
      </div>
      <div className="im-field" style={{ marginBottom: 20, maxWidth: 600 }}>
        <label className="im-field__label" style={{ flex: "0 0 240px" }}>Down Payment Interim Account</label>
        <LookupField
          name="DownPaymentInterimAccount"
          value={form.DownPaymentInterimAccount || ""}
          displayValue={form.DownPaymentInterimAccountName || ""}
          onChange={onChange}
          onSelect={(row) => setForm((p) => ({ ...p, DownPaymentInterimAccount: row.code, DownPaymentInterimAccountName: row.name }))}
          fetchOptions={fetchGLAccounts}
          placeholder="Down Payment Interim"
        />
      </div>

      {/* Planning Group */}
      <div className="im-field" style={{ marginBottom: 6, maxWidth: 500 }}>
        <label className="im-field__label" style={{ flex: "0 0 240px" }}>Planning Group</label>
        <input className="im-field__input" name="PlanningGroup" value={form.PlanningGroup || ""} onChange={onChange} style={{ maxWidth: 200 }} />
      </div>

      {/* Affiliate */}
      <div style={{ marginTop: 30 }}>
        <label className="im-checkbox-label">
          <input type="checkbox" name="Affiliate" checked={form.Affiliate === "tYES"} onChange={onChange} />
          <span>Affiliate</span>
        </label>
      </div>
    </div>
  );
}
