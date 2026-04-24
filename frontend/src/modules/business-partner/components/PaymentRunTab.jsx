import React from "react";

const COUNTRIES = [
  { code: "", name: "-- Select --" },
  { code: "IN", name: "India" }, { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" }, { code: "DE", name: "Germany" },
  { code: "AE", name: "UAE" },
];

export default function PaymentRunTab({ form, onChange }) {
  return (
    <div style={{ display: "flex", gap: 40 }}>
      {/* Left: House Bank */}
      <div style={{ minWidth: 320, maxWidth: 380 }}>
        <div className="im-section-title">House Bank</div>
        <div className="im-field">
          <label className="im-field__label">Country/Region</label>
          <select className="im-field__select" name="HouseBankCountry" value={form.HouseBankCountry || ""} onChange={onChange}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="im-field">
          <label className="im-field__label">Bank</label>
          <input className="im-field__input" name="HouseBank" value={form.HouseBank || ""} onChange={onChange} />
        </div>
        <div className="im-field">
          <label className="im-field__label">Account</label>
          <input className="im-field__input" name="HouseBankAccount" value={form.HouseBankAccount || ""} onChange={onChange} />
        </div>
        <div className="im-field">
          <label className="im-field__label">Branch</label>
          <input className="im-field__input" name="HouseBankBranch" value={form.HouseBankBranch || ""} onChange={onChange} />
        </div>
        <div className="im-field">
          <label className="im-field__label">IBAN</label>
          <input className="im-field__input" name="HouseBankIBAN" value={form.HouseBankIBAN || ""} onChange={onChange} />
        </div>
        <div className="im-field">
          <label className="im-field__label">BIC/SWIFT Code</label>
          <input className="im-field__input" name="HouseBankSwift" value={form.HouseBankSwift || ""} onChange={onChange} />
        </div>
        <div className="im-field">
          <label className="im-field__label">Control No.</label>
          <input className="im-field__input" name="HouseBankControlKey" value={form.HouseBankControlKey || ""} onChange={onChange} />
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="im-field">
            <label className="im-field__label"></label>
            <label className="im-checkbox-label">
              <input type="checkbox" name="PaymentBlock" checked={form.PaymentBlock === "tYES"} onChange={onChange} />
              <span>Payment Block</span>
            </label>
          </div>
          <div className="im-field">
            <label className="im-field__label"></label>
            <label className="im-checkbox-label">
              <input type="checkbox" name="SinglePayment" checked={form.SinglePayment === "tYES"} onChange={onChange} />
              <span>Single Payment</span>
            </label>
          </div>
          <div className="im-field">
            <label className="im-field__label"></label>
            <label className="im-checkbox-label">
              <input type="checkbox" name="CollectionAuthorization" checked={form.CollectionAuthorization === "tYES"} onChange={onChange} />
              <span>Collection Authorization</span>
            </label>
          </div>
          <div className="im-field">
            <label className="im-field__label">Bank Charges Code</label>
            <input className="im-field__input" name="BankChargesAllocationCode" value={form.BankChargesAllocationCode || ""} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* Right: Payment Methods grid */}
      <div style={{ flex: 1 }}>
        <div className="im-section-title">Payment Methods</div>
        <div className="im-grid-wrap">
          <table className="im-grid" style={{ minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>Code</th>
                <th>Description</th>
                <th style={{ width: 60 }}>Include</th>
                <th style={{ width: 60 }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {(form.BPPaymentMethods || []).length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#aaa", padding: 20, fontSize: 12 }}>
                    No payment methods defined
                  </td>
                </tr>
              ) : (
                (form.BPPaymentMethods || []).map((pm, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{pm.PaymentMethodCode}</td>
                    <td>{pm.Description}</td>
                    <td style={{ textAlign: "center" }}>
                      <input type="checkbox" checked={pm.Include === "tYES"} readOnly />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input type="checkbox" checked={pm.Active === "tYES"} readOnly />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="im-btn" onClick={() => {}}>Clear Default</button>
          <button className="im-btn im-btn--primary" style={{ marginLeft: "auto" }} onClick={() => {}}>Set as Default</button>
        </div>
      </div>
    </div>
  );
}
