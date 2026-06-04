import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./paymentMeans.css";

const today = new Date().toISOString().slice(0, 10);
const paymentMeansLookupZIndex = 100900;

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const parsePaymentMeansAmount = (value) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").replace(/^INR\s*/i, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const makeCheckRow = (overrides = {}) => ({
  id: overrides.id || `check-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  dueDate: overrides.dueDate || today,
  amount: overrides.amount ?? "0.00",
  countryRegion: overrides.countryRegion || overrides.country || "",
  bankCode: overrides.bankCode || "",
  bankName: overrides.bankName || "",
  branch: overrides.branch || "",
  account: overrides.account || "",
  checkNo: overrides.checkNo || "",
  endorsable: Boolean(overrides.endorsable),
  manualCheck: Boolean(overrides.manualCheck),
  originallyIssuedBy: overrides.originallyIssuedBy || "",
  fiscalId: overrides.fiscalId || "",
});

export const getPaymentMeansPaid = (paymentMeans = {}) => {
  const means = paymentMeans || {};
  const checkTotal = (means.check?.rows || []).reduce(
    (sum, row) => sum + parsePaymentMeansAmount(row.amount),
    0,
  );

  return (
    checkTotal +
    parsePaymentMeansAmount(means.bankTransfer?.total) +
    parsePaymentMeansAmount(means.creditCard?.amountDue) +
    parsePaymentMeansAmount(means.cash?.total)
  );
};

export const createPaymentMeansDraft = ({
  amountDue = 0,
  currency = "INR",
  postingDate = today,
  defaultCashAccount = "",
  defaultCashAccountName = "",
  defaultBankTransferAccount = "",
  defaultBankTransferAccountName = "",
  paymentDirection = "incoming",
} = {}) => ({
  currency: currency || "INR",
  overallAmount: parsePaymentMeansAmount(amountDue) > 0 ? money(amountDue) : "0.00",
  bankCharge: "0.00",
  check: {
    glAccount: "",
    glAccountName: "",
    searchByBankCode: false,
    rows: [makeCheckRow({ dueDate: postingDate || today })],
  },
  bankTransfer: {
    glAccount: defaultBankTransferAccount || "",
    glAccountName: defaultBankTransferAccountName || "",
    transferDate: postingDate || today,
    reference: "",
    total: "0.00",
  },
  creditCard: {
    creditCardCode: "",
    creditCardName: "",
    glAccount: "",
    glAccountName: "",
    creditCardNo: "",
    validUntil: "",
    idNo: "",
    telephoneNo: "",
    paymentMethod: "",
    amountDue: "0.00",
    noOfPayments: "1",
    firstPartialPayment: "",
    eachAdditionalPayment: "",
    voucherNo: "",
    transactionType: "Regular",
    approvalTelephone: "",
    companyId: "",
  },
  cash: {
    glAccount: defaultCashAccount || "",
    glAccountName: defaultCashAccountName || "",
    primaryFormItem:
      paymentDirection === "outgoing"
        ? "Payments for Invoices to Vendors"
        : "Payments for Invoices from Customers",
    total: parsePaymentMeansAmount(amountDue) > 0 ? money(amountDue) : "0.00",
  },
});

const mergePaymentMeansDraft = (value, defaults) => {
  const base = createPaymentMeansDraft(defaults);
  if (!value) return base;

  const draft = {
    ...base,
    ...value,
    check: {
      ...base.check,
      ...(value.check || {}),
      rows: (value.check?.rows?.length ? value.check.rows : base.check.rows).map(makeCheckRow),
    },
    bankTransfer: { ...base.bankTransfer, ...(value.bankTransfer || {}) },
    creditCard: { ...base.creditCard, ...(value.creditCard || {}) },
    cash: { ...base.cash, ...(value.cash || {}) },
  };

  if (!draft.cash.glAccount) {
    draft.cash.glAccount = defaults.defaultCashAccount || "";
    draft.cash.glAccountName = defaults.defaultCashAccountName || "";
  }

  if (!draft.bankTransfer.glAccount) {
    draft.bankTransfer.glAccount = defaults.defaultBankTransferAccount || "";
    draft.bankTransfer.glAccountName = defaults.defaultBankTransferAccountName || "";
  }

  if (draft.overallAmount === undefined || draft.overallAmount === null || draft.overallAmount === "") {
    draft.overallAmount = parsePaymentMeansAmount(defaults.amountDue) > 0 ? money(defaults.amountDue) : "0.00";
  }

  if (getPaymentMeansPaid(draft) <= 0 && parsePaymentMeansAmount(defaults.amountDue) > 0) {
    draft.cash.total = money(defaults.amountDue);
  }

  return draft;
};

const DialogField = ({ label, children }) => (
  <label className="pm-field">
    <span>{label}</span>
    {children}
  </label>
);

const accountColumns = [
  { label: "Code", key: "code", width: 110 },
  { label: "Name", key: "name", width: 260 },
];

const bankColumns = [
  { label: "Bank Code", key: "code", width: 110 },
  { label: "Bank Name", key: "name", width: 220 },
  { label: "Country/Region", key: "country", width: 120 },
];

const creditCardColumns = [
  { label: "Credit Card", key: "code", width: 100 },
  { label: "Name", key: "name", width: 220 },
  { label: "G/L Account", key: "glAccount", width: 120 },
];

export default function PaymentMeansDialog({
  open,
  value,
  amountDue,
  currency,
  postingDate,
  paymentDirection = "incoming",
  defaultCashAccount = "",
  defaultCashAccountName = "",
  defaultBankTransferAccount = "",
  defaultBankTransferAccountName = "",
  LookupField,
  accountLookup,
  cashAccountLookup,
  bankLookup,
  creditCardLookup,
  onApply,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("check");
  const [draft, setDraft] = useState(() =>
    mergePaymentMeansDraft(value, {
      amountDue,
      currency,
      postingDate,
      defaultCashAccount,
      defaultCashAccountName,
      defaultBankTransferAccount,
      defaultBankTransferAccountName,
      paymentDirection,
    }),
  );

  useEffect(() => {
    if (!open) return;
    setActiveTab("check");
    setDraft(
      mergePaymentMeansDraft(value, {
        amountDue,
        currency,
        postingDate,
        defaultCashAccount,
        defaultCashAccountName,
        defaultBankTransferAccount,
        defaultBankTransferAccountName,
        paymentDirection,
      }),
    );
  }, [
    open,
    value,
    amountDue,
    currency,
    postingDate,
    defaultCashAccount,
    defaultCashAccountName,
    defaultBankTransferAccount,
    defaultBankTransferAccountName,
    paymentDirection,
  ]);

  const paymentMeansTotal = useMemo(() => getPaymentMeansPaid(draft), [draft]);
  const bankChargeAmount = parsePaymentMeansAmount(draft.bankCharge);
  const paid = paymentMeansTotal + bankChargeAmount;
  const balanceDue = parsePaymentMeansAmount(draft.overallAmount) - paid;
  const AccountLookup = LookupField;

  if (!open) return null;

  const setSection = (section, patch) => {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch,
      },
    }));
  };

  const updateCheck = (patch) => setSection("check", patch);

  const updateCheckRow = (rowId, patch) => {
    setDraft((current) => ({
      ...current,
      check: {
        ...current.check,
        rows: current.check.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
      },
    }));
  };

  const addCheckRow = () => {
    setDraft((current) => ({
      ...current,
      check: {
        ...current.check,
        rows: [...current.check.rows, makeCheckRow({ dueDate: postingDate || today })],
      },
    }));
  };

  const removeCheckRow = (rowId) => {
    setDraft((current) => ({
      ...current,
      check: {
        ...current.check,
        rows: current.check.rows.length > 1 ? current.check.rows.filter((row) => row.id !== rowId) : current.check.rows,
      },
    }));
  };

  const settleAmount = (section, field) => {
    setSection(section, { [field]: money(parsePaymentMeansAmount(draft[section]?.[field])) });
  };

  const settleCheckAmount = (rowId, value) => {
    updateCheckRow(rowId, { amount: money(parsePaymentMeansAmount(value)) });
  };

  const applyDraft = () => {
    onApply?.({
      ...draft,
      currency: currency || draft.currency || "INR",
      paidTotal: Number(paid.toFixed(2)),
      paymentMeansTotal: Number(paymentMeansTotal.toFixed(2)),
      bankChargeAmount: Number(bankChargeAmount.toFixed(2)),
      balanceDue: Number(balanceDue.toFixed(2)),
    });
  };

  const renderAccountLookup = (valueText, onChange, onSelect, lookup = accountLookup, extraClass = "") => (
    <AccountLookup
      className={`pm-inline-lookup ${extraClass}`}
      value={valueText}
      onChange={onChange}
      onSelect={onSelect}
      fetchOptions={lookup || (async () => [])}
      title="G/L Accounts"
      columns={accountColumns}
      modalZIndex={paymentMeansLookupZIndex}
    />
  );

  const renderCheckTab = () => (
    <div className="pm-tab-panel">
      <DialogField label="G/L Account">
        <div className="pm-account-with-name">
          {renderAccountLookup(
            draft.check.glAccount,
            (next) => updateCheck({ glAccount: next }),
            (row) => updateCheck({ glAccount: row.code, glAccountName: row.name }),
          )}
          <span>{draft.check.glAccountName}</span>
        </div>
      </DialogField>
      <label className="pm-checkbox-line">
        <input
          type="checkbox"
          checked={draft.check.searchByBankCode}
          onChange={(event) => updateCheck({ searchByBankCode: event.target.checked })}
        />
        <span>Search by Bank Code</span>
      </label>
      <div className="pm-table-wrap">
        <table className="pm-table pm-check-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Country/Region</th>
              <th>Bank Name</th>
              <th>Branch</th>
              <th>Account</th>
              <th>Check No.</th>
              <th>Endors.</th>
              {paymentDirection === "outgoing" ? <th>Manual</th> : null}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.check.rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td>
                  <input type="date" value={row.dueDate || ""} onChange={(event) => updateCheckRow(row.id, { dueDate: event.target.value })} />
                </td>
                <td>
                  <input
                    className="pm-money-input"
                    value={row.amount}
                    onChange={(event) => updateCheckRow(row.id, { amount: event.target.value })}
                    onBlur={() => settleCheckAmount(row.id, row.amount)}
                  />
                </td>
                <td>
                  <input value={row.countryRegion} onChange={(event) => updateCheckRow(row.id, { countryRegion: event.target.value })} />
                </td>
                <td>
                  <AccountLookup
                    className="pm-table-lookup"
                    value={row.bankName || row.bankCode}
                    onChange={(next) => updateCheckRow(row.id, { bankName: next, bankCode: next })}
                    onSelect={(bank) =>
                      updateCheckRow(row.id, {
                        bankCode: bank.code,
                        bankName: bank.name,
                        countryRegion: bank.country || row.countryRegion,
                        branch: bank.branch || row.branch,
                      })
                    }
                    fetchOptions={(query) => (bankLookup ? bankLookup(query, row.countryRegion) : [])}
                    title="Banks"
                    columns={bankColumns}
                    modalZIndex={paymentMeansLookupZIndex}
                  />
                </td>
                <td>
                  <input value={row.branch} onChange={(event) => updateCheckRow(row.id, { branch: event.target.value })} />
                </td>
                <td>
                  <input value={row.account} onChange={(event) => updateCheckRow(row.id, { account: event.target.value })} />
                </td>
                <td>
                  <input value={row.checkNo} onChange={(event) => updateCheckRow(row.id, { checkNo: event.target.value })} />
                </td>
                <td>
                  <input type="checkbox" checked={row.endorsable} onChange={(event) => updateCheckRow(row.id, { endorsable: event.target.checked })} />
                </td>
                {paymentDirection === "outgoing" ? (
                  <td>
                    <input type="checkbox" checked={row.manualCheck} onChange={(event) => updateCheckRow(row.id, { manualCheck: event.target.checked })} />
                  </td>
                ) : null}
                <td>
                  <button type="button" className="pm-row-btn" onClick={() => removeCheckRow(row.id)} disabled={draft.check.rows.length === 1}>x</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="po-btn pm-add-row" onClick={addCheckRow}>Add Row</button>
    </div>
  );

  const renderBankTransferTab = () => (
    <div className="pm-tab-panel pm-bank-panel">
      <DialogField label="G/L Account">
        <div className="pm-account-with-name">
          {renderAccountLookup(
            draft.bankTransfer.glAccount,
            (next) => setSection("bankTransfer", { glAccount: next }),
            (row) => setSection("bankTransfer", { glAccount: row.code, glAccountName: row.name }),
          )}
          <span>{draft.bankTransfer.glAccountName}</span>
        </div>
      </DialogField>
      <DialogField label="Transfer Date">
        <input
          type="date"
          value={draft.bankTransfer.transferDate || ""}
          onChange={(event) => setSection("bankTransfer", { transferDate: event.target.value })}
        />
      </DialogField>
      <DialogField label="Reference">
        <input value={draft.bankTransfer.reference} onChange={(event) => setSection("bankTransfer", { reference: event.target.value })} />
      </DialogField>
      <div className="pm-total-line">
        <span>Total</span>
        <input
          className="pm-money-input"
          value={draft.bankTransfer.total}
          onChange={(event) => setSection("bankTransfer", { total: event.target.value })}
          onBlur={() => settleAmount("bankTransfer", "total")}
        />
      </div>
    </div>
  );

  const renderCreditCardTab = () => (
    <div className="pm-tab-panel pm-credit-panel">
      <div className="pm-credit-left">
        <DialogField label="Credit Card Name">
          <AccountLookup
            value={draft.creditCard.creditCardName || draft.creditCard.creditCardCode}
            onChange={(next) => setSection("creditCard", { creditCardName: next, creditCardCode: next })}
            onSelect={(card) =>
              setSection("creditCard", {
                creditCardCode: card.code,
                creditCardName: card.name,
                glAccount: card.glAccount || draft.creditCard.glAccount,
                telephoneNo: card.telephone || draft.creditCard.telephoneNo,
                approvalTelephone: card.telephone || draft.creditCard.approvalTelephone,
                companyId: card.companyId || draft.creditCard.companyId,
              })
            }
            fetchOptions={creditCardLookup || (async () => [])}
            title="Credit Cards"
            columns={creditCardColumns}
            modalZIndex={paymentMeansLookupZIndex}
          />
        </DialogField>
        <DialogField label="G/L Account">
          {renderAccountLookup(
            draft.creditCard.glAccount,
            (next) => setSection("creditCard", { glAccount: next }),
            (row) => setSection("creditCard", { glAccount: row.code, glAccountName: row.name }),
          )}
        </DialogField>
        <DialogField label="Credit Card No.">
          <input value={draft.creditCard.creditCardNo} onChange={(event) => setSection("creditCard", { creditCardNo: event.target.value })} />
        </DialogField>
        <DialogField label="Valid Until">
          <input type="date" value={draft.creditCard.validUntil || ""} onChange={(event) => setSection("creditCard", { validUntil: event.target.value })} />
        </DialogField>
        <DialogField label="ID No.">
          <input value={draft.creditCard.idNo} onChange={(event) => setSection("creditCard", { idNo: event.target.value })} />
        </DialogField>
        <DialogField label="Telephone No.">
          <input value={draft.creditCard.telephoneNo} onChange={(event) => setSection("creditCard", { telephoneNo: event.target.value })} />
        </DialogField>
        <DialogField label="Payment Method">
          <input value={draft.creditCard.paymentMethod} onChange={(event) => setSection("creditCard", { paymentMethod: event.target.value })} />
        </DialogField>
        <DialogField label="Amount Due">
          <input
            className="pm-money-input"
            value={draft.creditCard.amountDue}
            onChange={(event) => setSection("creditCard", { amountDue: event.target.value })}
            onBlur={() => settleAmount("creditCard", "amountDue")}
          />
        </DialogField>
        <DialogField label="No. of Payments">
          <input value={draft.creditCard.noOfPayments} onChange={(event) => setSection("creditCard", { noOfPayments: event.target.value })} />
        </DialogField>
        <DialogField label="First Partial Payment">
          <input value={draft.creditCard.firstPartialPayment} onChange={(event) => setSection("creditCard", { firstPartialPayment: event.target.value })} />
        </DialogField>
        <DialogField label="Each Add. Payment">
          <input value={draft.creditCard.eachAdditionalPayment} onChange={(event) => setSection("creditCard", { eachAdditionalPayment: event.target.value })} />
        </DialogField>
        <DialogField label="Voucher No.">
          <input value={draft.creditCard.voucherNo} onChange={(event) => setSection("creditCard", { voucherNo: event.target.value })} />
        </DialogField>
        <DialogField label="Transaction Type">
          <select value={draft.creditCard.transactionType} onChange={(event) => setSection("creditCard", { transactionType: event.target.value })}>
            <option value="Regular">Regular</option>
            <option value="Telephone">Telephone</option>
          </select>
        </DialogField>
      </div>
      <div className="pm-credit-right">
        <div className="pm-voucher-title">Vouchers</div>
        <div className="pm-voucher-grid">
          <div>1</div>
          <div>{draft.creditCard.creditCardName || "Define New"}</div>
          {Array.from({ length: 7 }).map((_, index) => (
            <React.Fragment key={index}>
              <div>{index + 2}</div>
              <div></div>
            </React.Fragment>
          ))}
        </div>
        <DialogField label="Tel. for Approval">
          <input value={draft.creditCard.approvalTelephone} onChange={(event) => setSection("creditCard", { approvalTelephone: event.target.value })} />
        </DialogField>
        <DialogField label="Company ID">
          <input value={draft.creditCard.companyId} onChange={(event) => setSection("creditCard", { companyId: event.target.value })} />
        </DialogField>
        <div className="pm-total-line">
          <span>Total</span>
          <input value={money(parsePaymentMeansAmount(draft.creditCard.amountDue))} readOnly />
        </div>
      </div>
    </div>
  );

  const renderCashTab = () => (
    <div className="pm-tab-panel pm-cash-panel">
      <DialogField label="G/L Account">
        <div className="pm-account-with-name">
          {renderAccountLookup(
            draft.cash.glAccount,
            (next) => setSection("cash", { glAccount: next }),
            (row) => setSection("cash", { glAccount: row.code, glAccountName: row.name }),
            cashAccountLookup || accountLookup,
          )}
          <span>{draft.cash.glAccountName}</span>
        </div>
      </DialogField>
      <DialogField label="Primary Form Item">
        <select value={draft.cash.primaryFormItem} onChange={(event) => setSection("cash", { primaryFormItem: event.target.value })}>
          <option value="Payments for Invoices from Customers">Payments for Invoices from Customers</option>
          <option value="Payments for Invoices to Vendors">Payments for Invoices to Vendors</option>
          <option value="Payment on Account">Payment on Account</option>
        </select>
      </DialogField>
      <div className="pm-total-line">
        <span>Total</span>
        <input
          className="pm-money-input"
          value={draft.cash.total}
          onChange={(event) => setSection("cash", { total: event.target.value })}
          onBlur={() => settleAmount("cash", "total")}
        />
      </div>
    </div>
  );

  const panels = {
    check: renderCheckTab,
    bankTransfer: renderBankTransferTab,
    creditCard: renderCreditCardTab,
    cash: renderCashTab,
  };

  return createPortal(
    <div className="pm-modal-layer" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="pm-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="pm-titlebar">
          <span>Payment Means</span>
          <div className="pm-window-controls" aria-label="Window controls">
            <button type="button" aria-label="Close" onClick={onClose}>x</button>
          </div>
        </div>
        <div className="pm-body">
          <DialogField label="Currency">
            <input value={currency || draft.currency || "INR"} readOnly />
          </DialogField>
          <div className="pm-tabs" role="tablist">
            {[
              ["check", "Check"],
              ["bankTransfer", "Bank Transfer"],
              ["creditCard", "Credit Card"],
              ["cash", "Cash"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                className={activeTab === key ? "is-active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pm-panel-shell">{panels[activeTab]()}</div>
          <div className="pm-general-area">
            <div className="pm-general-left">
              <DialogField label="Overall Amount">
                <input
                  className="pm-money-input"
                  value={draft.overallAmount}
                  onChange={(event) => setDraft((current) => ({ ...current, overallAmount: event.target.value }))}
                  onBlur={() => setDraft((current) => ({ ...current, overallAmount: money(parsePaymentMeansAmount(current.overallAmount)) }))}
                />
              </DialogField>
              <DialogField label="Balance Due">
                <input className={Math.abs(balanceDue) > 0.01 ? "pm-balance-warning" : ""} value={money(balanceDue)} readOnly />
              </DialogField>
              <DialogField label="Bank Charge">
                <input
                  className="pm-money-input"
                  value={draft.bankCharge}
                  onChange={(event) => setDraft((current) => ({ ...current, bankCharge: event.target.value }))}
                  onBlur={() => setDraft((current) => ({ ...current, bankCharge: money(parsePaymentMeansAmount(current.bankCharge)) }))}
                />
              </DialogField>
            </div>
            <div className="pm-paid-field">
              <span>Paid</span>
              <input value={money(paid)} readOnly />
            </div>
          </div>
        </div>
        <div className="pm-actions">
          <button type="button" className="po-btn po-btn--primary" onClick={applyDraft}>OK</button>
          <button type="button" className="po-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
