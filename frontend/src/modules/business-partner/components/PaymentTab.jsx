import React from "react";
import LookupField from "../../item-master/components/LookupField";

export default function PaymentTab({ form, onChange, setForm, fetchBPPriceLists, fetchPaymentTerms }) {
  return (
    <div className="bp-general-layout">
      {/* Left Column */}
      <div className="bp-general-left">
        <div className="im-field">
          <label className="im-field__label">Payment Terms</label>
          <LookupField
            name="PayTermsGrpCode"
            value={form.PayTermsGrpCode || ""}
            displayValue={form.PayTermsName || ""}
            onChange={onChange}
            onSelect={(row) => setForm((p) => ({ ...p, PayTermsGrpCode: row.code, PayTermsName: row.name }))}
            fetchOptions={fetchPaymentTerms}
            placeholder="Payment Terms"
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Interest on Arrears %</label>
          <input 
            className="im-field__input" 
            name="IntrestRatePercent" 
            type="number" 
            step="0.01"
            value={form.IntrestRatePercent || ""} 
            onChange={onChange} 
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Price List</label>
          <LookupField
            name="PriceListNum"
            value={form.PriceListNum || ""}
            displayValue={form.PriceListName || ""}
            onChange={onChange}
            onSelect={(row) => setForm((p) => ({ ...p, PriceListNum: row.code, PriceListName: row.name }))}
            fetchOptions={fetchBPPriceLists}
            placeholder="Price List"
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Total Discount %</label>
          <input 
            className="im-field__input" 
            name="DiscountPercent" 
            type="number" 
            step="0.01"
            value={form.DiscountPercent || ""} 
            onChange={onChange} 
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Credit Limit</label>
          <input 
            className="im-field__input" 
            name="CreditLimit" 
            type="number" 
            step="0.01"
            value={form.CreditLimit || ""} 
            onChange={onChange} 
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Commitment Limit</label>
          <input 
            className="im-field__input" 
            name="MaxCommitment" 
            type="number" 
            step="0.01"
            value={form.MaxCommitment || ""} 
            onChange={onChange} 
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Dunning Term</label>
          <select 
            className="im-field__select" 
            name="DunningTerm" 
            value={form.DunningTerm || ""} 
            onChange={onChange}
          >
            <option value="">-- Select --</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </div>

        <div className="im-field">
          <label className="im-field__label">Automatic Posting</label>
          <select 
            className="im-field__select" 
            name="AutomaticPosting" 
            value={form.AutomaticPosting || "apNo"} 
            onChange={onChange}
          >
            <option value="apNo">No</option>
            <option value="apInterestAndFee">Interest and Fee</option>
            <option value="apInterestOnly">Interest Only</option>
            <option value="apFeeOnly">Fee Only</option>
          </select>
        </div>

        <div className="im-field">
          <label className="im-field__label">Effective Discount Groups</label>
          <select 
            className="im-field__select" 
            name="EffectiveDiscount" 
            value={form.EffectiveDiscount || "dgrLowestDiscount"} 
            onChange={onChange}
          >
            <option value="dgrLowestDiscount">Lowest Discount</option>
            <option value="dgrHighestDiscount">Highest Discount</option>
            <option value="dgrMultipliedDiscount">Multiplied Discount</option>
            <option value="dgrDiscountTotals">Discount Totals</option>
            <option value="dgrAverageDiscount">Average Discount</option>
          </select>
        </div>

        <div className="im-field">
          <label className="im-field__label">Effective Price</label>
          <select 
            className="im-field__select" 
            name="EffectivePrice" 
            value={form.EffectivePrice || "epDefaultPriority"} 
            onChange={onChange}
          >
            <option value="epDefaultPriority">Default Priority</option>
            <option value="epLowestPrice">Lowest Price</option>
            <option value="epHighestPrice">Highest Price</option>
          </select>
        </div>
      </div>

      {/* Right Column */}
      <div className="bp-general-right">
        <div className="im-field">
          <label className="im-field__label">Credit Card Code</label>
          <input 
            className="im-field__input" 
            name="CreditCardCode" 
            type="number"
            value={form.CreditCardCode || ""} 
            onChange={onChange}
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Credit Card No.</label>
          <input 
            className="im-field__input" 
            name="CreditCardNum" 
            value={form.CreditCardNum || ""} 
            onChange={onChange} 
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Expiration Date</label>
          <input 
            className="im-field__input" 
            name="CreditCardExpiration" 
            type="date"
            value={form.CreditCardExpiration || ""} 
            onChange={onChange} 
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Average Delay</label>
          <input 
            className="im-field__input" 
            name="AvarageLate" 
            type="number"
            value={form.AvarageLate || ""} 
            onChange={onChange} 
            readOnly
            style={{ background: "#f0f2f5", color: "#555" }}
          />
        </div>

        <div className="im-field">
          <label className="im-field__label">Priority</label>
          <input 
            className="im-field__input" 
            name="Priority" 
            type="number"
            value={form.Priority || ""} 
            onChange={onChange}
          />
        </div>

        {/* Checkboxes */}
        <div style={{ marginTop: "14px" }}>
          <div className="im-field">
            <label className="im-field__label"></label>
            <div className="im-checkbox-label">
              <input 
                type="checkbox" 
                name="PartialDelivery" 
                checked={form.PartialDelivery === "tYES"} 
                onChange={onChange}
              />
              <span>Partial Delivery</span>
            </div>
          </div>

          <div className="im-field">
            <label className="im-field__label"></label>
            <div className="im-checkbox-label">
              <input 
                type="checkbox" 
                name="BackOrder" 
                checked={form.BackOrder === "tYES"} 
                onChange={onChange}
              />
              <span>Back Order</span>
            </div>
          </div>

          <div className="im-field">
            <label className="im-field__label"></label>
            <div className="im-checkbox-label">
              <input 
                type="checkbox" 
                name="SinglePayment" 
                checked={form.SinglePayment === "tYES"} 
                onChange={onChange}
              />
              <span>Single Payment</span>
            </div>
          </div>

          <div className="im-field">
            <label className="im-field__label"></label>
            <div className="im-checkbox-label">
              <input 
                type="checkbox" 
                name="EndorsableChecksFromBP" 
                checked={form.EndorsableChecksFromBP === "tYES"} 
                onChange={onChange}
              />
              <span>Endorsable Checks from BP</span>
            </div>
          </div>

          <div className="im-field">
            <label className="im-field__label"></label>
            <div className="im-checkbox-label">
              <input 
                type="checkbox" 
                name="AcceptsEndorsedChecks" 
                checked={form.AcceptsEndorsedChecks === "tYES"} 
                onChange={onChange}
              />
              <span>Accepts Endorsed Checks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
