import React from 'react';

export default function LogisticsTab({
  header, onHeaderChange, vendorShipToAddresses, vendorPayToAddresses,
  shippingTypeOptions, onShipToCodeChange, onOpenAddressModal,
}) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* LEFT */}
      <div style={{ flex: 1 }}>
        <div className="po-field">
          <label className="po-field__label">Ship To Code</label>
          <select className="po-field__select" name="shipToCode" value={header.shipToCode} onChange={onShipToCodeChange}>
            <option value="">Select</option>
            {vendorShipToAddresses.map(a => <option key={a.Address} value={a.Address}>{a.Address}</option>)}
          </select>
        </div>
        <div className="po-field" style={{ alignItems: 'flex-start' }}>
          <label className="po-field__label" style={{ paddingTop: 4 }}>Ship To</label>
          <textarea className="po-textarea" rows={3} name="shipTo" value={header.shipTo} onChange={onHeaderChange} style={{ flex: 1 }} />
          <button type="button" className="po-btn" style={{ padding: '2px 8px', fontSize: 14 }} onClick={() => onOpenAddressModal('shipTo')} title="Edit">⋯</button>
        </div>
        <div className="po-field">
          <label className="po-field__label">Pay To Code</label>
          <select className="po-field__select" name="payToCode" value={header.payToCode} onChange={onHeaderChange}>
            <option value="">Select</option>
            {vendorPayToAddresses.map(a => <option key={a.Address} value={a.Address}>{a.Address}</option>)}
          </select>
        </div>
        <div className="po-field" style={{ alignItems: 'flex-start' }}>
          <label className="po-field__label" style={{ paddingTop: 4 }}>Pay To</label>
          <textarea className="po-textarea" rows={3} name="payTo" value={header.payTo} onChange={onHeaderChange} style={{ flex: 1 }} />
          <button type="button" className="po-btn" style={{ padding: '2px 8px', fontSize: 14 }} onClick={() => onOpenAddressModal('payTo')} title="Edit">⋯</button>
        </div>
        <div className="po-checkboxes">
          <label className="po-checkbox-label">
            <input type="checkbox" name="usePayToForTax" checked={header.usePayToForTax} onChange={onHeaderChange} />
            Use Pay To Address to Determine Tax
          </label>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1 }}>
        <div className="po-field">
          <label className="po-field__label">Shipping Type</label>
          <select className="po-field__select" name="shippingType" value={header.shippingType} onChange={onHeaderChange}>
            <option value="">Select</option>
            {shippingTypeOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="po-field">
          <label className="po-field__label">To Order</label>
          <input className="po-field__input" name="toOrder" value={header.toOrder} onChange={onHeaderChange} />
        </div>
        <div className="po-field">
          <label className="po-field__label">Notify Party Code</label>
          <input className="po-field__input" name="notifyPartyCode" value={header.notifyPartyCode} onChange={onHeaderChange} />
        </div>
        <div className="po-field">
          <label className="po-field__label">Notify Party Name</label>
          <input className="po-field__input" name="notifyPartyName" value={header.notifyPartyName} onChange={onHeaderChange} />
        </div>
        <div className="po-field" style={{ alignItems: 'flex-start' }}>
          <label className="po-field__label" style={{ paddingTop: 4 }}>Notify Party Addr.</label>
          <textarea className="po-textarea" rows={3} name="notifyPartyAddress" value={header.notifyPartyAddress} onChange={onHeaderChange} />
        </div>
        <div className="po-field">
          <label className="po-field__label">Language</label>
          <select className="po-field__select" name="language" value={header.language} onChange={onHeaderChange}>
            <option value="">Select</option>
            <option>English</option>
            <option>Hindi</option>
            <option>Gujarati</option>
          </select>
        </div>
        <div className="po-checkboxes">
          <label className="po-checkbox-label">
            <input type="checkbox" name="splitPurchaseOrder" checked={header.splitPurchaseOrder} onChange={onHeaderChange} />
            Split Purchase Order
          </label>
          <label className="po-checkbox-label">
            <input type="checkbox" name="confirmed" checked={header.confirmed} onChange={onHeaderChange} />
            Confirmed
          </label>
        </div>
      </div>
    </div>
  );
}
