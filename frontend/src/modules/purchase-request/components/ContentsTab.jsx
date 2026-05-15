import React from 'react';

import { getLineTotalsForDisplay } from '../../../utils/lineTotals';

const MATRIX_COLS = [
  { key: 'itemNo', label: 'Item No.', minWidth: 90 },
  { key: 'itemDescription', label: 'Description', minWidth: 100 },
  { key: 'hsnCode', label: 'HSN', minWidth: 80 },
  { key: 'quantity', label: 'Qty', minWidth: 50 },
  { key: 'unitPrice', label: 'Price', minWidth: 65 },
  { key: 'uomCode', label: 'UoM', minWidth: 45 },
  { key: 'stdDiscount', label: 'Disc%', minWidth: 45 },
  { key: 'taxCode', label: 'Tax Code', minWidth: 85 },
  { key: 'totalBeforeTax', label: 'Total Before Tax', minWidth: 95 },
  { key: 'total', label: 'Total', minWidth: 70 },
  { key: 'whse', label: 'Whse', minWidth: 70 },
  { key: 'loc', label: 'LOC', minWidth: 70 },
  { key: 'branch', label: 'Branch', minWidth: 70 },
];

export default function ContentsTab({
  lines,
  onLineChange,
  onNumBlur,
  onAddLine,
  onRemoveLine,
  lineItemOptions,
  getUomOptions,
  effectiveTaxCodes,
  effectiveWarehouses,
  fmtTaxLabel,
  valErrors,
  branches,
  hsnCodes,
  onOpenHSNModal,
  onOpenItemModal,
  getBranchName,
}) {
  return (
    <div className="so-tab-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="so-section-title">Document Lines</div>
        <button type="button" className="so-btn so-btn--primary" onClick={onAddLine}>
          + Add Line
        </button>
      </div>
      <div className="so-grid-wrap" style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <table className="so-grid" style={{ minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ width: 25 }}>#</th>
              {MATRIX_COLS.map(c => (
                <th key={c.key} style={{ minWidth: c.minWidth }}>
                  {c.label}
                </th>
              ))}
              <th style={{ width: 25 }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const uomOpts = getUomOptions(line);
              const lineTotals = getLineTotalsForDisplay(line, effectiveTaxCodes);
              return (
                <tr key={i}>
                  <td className="so-grid__cell--muted" style={{ textAlign: 'center', fontSize: 11 }}>{i + 1}</td>

                  {/* Item No */}
                  <td>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      <input
                        className="so-grid__input"
                        style={{ flex: 1, textAlign: 'left', border: valErrors.lines[i]?.itemNo ? '1px solid #c00' : undefined }}
                        name="itemNo"
                        value={line.itemNo}
                        onChange={e => onLineChange(i, e)}
                        placeholder="Item Code"
                      />
                      <button
                        type="button"
                        onClick={() => onOpenItemModal && onOpenItemModal(i)}
                        style={{
                          padding: '0 6px',
                          fontSize: 11,
                          border: '1px solid #a0aab4',
                          background: 'linear-gradient(180deg, #fff 0%, #e8ecf0 100%)',
                          minWidth: '24px',
                          height: '22px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                        }}
                        title="Select Item"
                      >
                        ...
                      </button>
                    </div>
                    {valErrors.lines[i]?.itemNo && (
                      <div style={{ color: '#c00', fontSize: 10, marginTop: 2 }}>{valErrors.lines[i].itemNo}</div>
                    )}
                  </td>

                  {/* Description */}
                  <td>
                    <input
                      className="so-grid__input"
                      style={{ width: '100%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      name="itemDescription"
                      value={line.itemDescription}
                      onChange={e => onLineChange(i, e)}
                      title={line.itemDescription}
                    />
                  </td>

                  {/* HSN Code */}
                  <td>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      <input
                        className="so-grid__input"
                        style={{ 
                          flex: 1, 
                          textAlign: 'left', 
                          border: valErrors.lines[i]?.hsnCode ? '1px solid #c00' : undefined 
                        }}
                        name="hsnCode"
                        value={line.hsnCode}
                        onChange={e => onLineChange(i, e)}
                        placeholder="HSN/SAC"
                      />
                      <button
                        type="button"
                        onClick={() => onOpenHSNModal && onOpenHSNModal(i)}
                        style={{
                          padding: '0 6px',
                          fontSize: 11,
                          border: '1px solid #a0aab4',
                          background: 'linear-gradient(180deg, #fff 0%, #e8ecf0 100%)',
                          minWidth: '24px',
                          height: '22px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                        }}
                        title="Select HSN Code"
                      >
                        ...
                      </button>
                    </div>
                    {valErrors.lines[i]?.hsnCode && (
                      <div style={{ color: '#c00', fontSize: 10, marginTop: 2 }}>{valErrors.lines[i].hsnCode}</div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td>
                    <input
                      className="so-grid__input"
                      style={{ border: valErrors.lines[i]?.quantity ? '1px solid #c00' : undefined }}
                      name="quantity"
                      value={line.quantity}
                      onChange={e => onLineChange(i, e)}
                      onBlur={() => onNumBlur('quantity', 'line', i)}
                    />
                    {valErrors.lines[i]?.quantity && (
                      <div style={{ color: '#c00', fontSize: 10, marginTop: 2 }}>{valErrors.lines[i].quantity}</div>
                    )}
                  </td>

                  {/* Unit Price */}
                  <td>
                    <input
                      className="so-grid__input"
                      style={{ border: valErrors.lines[i]?.unitPrice ? '1px solid #c00' : undefined }}
                      name="unitPrice"
                      value={line.unitPrice}
                      onChange={e => onLineChange(i, e)}
                      onBlur={() => onNumBlur('unitPrice', 'line', i)}
                    />
                    {valErrors.lines[i]?.unitPrice && (
                      <div style={{ color: '#c00', fontSize: 10, marginTop: 2 }}>{valErrors.lines[i].unitPrice}</div>
                    )}
                  </td>

                  {/* UoM */}
                  <td>
                    <select
                      className="so-grid__input"
                      style={{ width: '100%', textAlign: 'left', border: valErrors.lines[i]?.uomCode ? '1px solid #c00' : undefined }}
                      name="uomCode"
                      value={line.uomCode}
                      onChange={e => onLineChange(i, e)}
                    >
                      <option value=""></option>
                      {uomOpts.map(u => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      {line.uomCode && !uomOpts.includes(line.uomCode) && (
                        <option value={line.uomCode}>{line.uomCode}</option>
                      )}
                    </select>
                  </td>

                  {/* Discount */}
                  <td>
                    <input
                      className="so-grid__input"
                      name="stdDiscount"
                      value={line.stdDiscount}
                      onChange={e => onLineChange(i, e)}
                      onBlur={() => onNumBlur('stdDiscount', 'line', i)}
                    />
                  </td>

                  {/* Tax Code */}
                  <td>
                    <select
                      className="so-grid__input"
                      style={{ width: '100%', textAlign: 'left' }}
                      name="taxCode"
                      value={line.taxCode}
                      onChange={e => onLineChange(i, e)}
                    >
                      <option value="">Select</option>
                      {effectiveTaxCodes.map(t => (
                        <option key={t.Code} value={t.Code}>
                          {fmtTaxLabel(t)}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Total Before Tax */}
                  <td>
                    <input
                      className="so-grid__input"
                      value={lineTotals.beforeTax}
                      readOnly
                      style={{ background: '#f5f8fc' }}
                    />
                  </td>

                  {/* Total */}
                  <td>
                    <input
                      className="so-grid__input"
                      value={lineTotals.total}
                      readOnly
                      style={{ background: '#f5f8fc' }}
                    />
                  </td>

                  {/* Warehouse */}
                  <td>
                    <select
                      className="so-grid__input"
                      style={{ width: '100%', textAlign: 'left', border: valErrors.lines[i]?.whse ? '1px solid #c00' : undefined }}
                      name="whse"
                      value={line.whse}
                      onChange={e => onLineChange(i, e)}
                    >
                      <option value="">Select</option>
                      {effectiveWarehouses.map(w => (
                        <option key={w.WhsCode} value={w.WhsCode}>{w.WhsCode}</option>
                      ))}
                      {line.whse && !effectiveWarehouses.some(w => w.WhsCode === line.whse) && (
                        <option value={line.whse}>{line.whse}</option>
                      )}
                    </select>
                    {valErrors.lines[i]?.whse && (
                      <div style={{ color: '#c00', fontSize: 10, marginTop: 2 }}>{valErrors.lines[i].whse}</div>
                    )}
                  </td>

                  {/* LOC (Location) - Shows Branch Name */}
                  <td>
                    <input
                      className="so-grid__input"
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        background: '#f5f8fc'
                      }}
                      name="loc"
                      value={getBranchName ? getBranchName(line.branch) : line.loc || ''}
                      readOnly
                      disabled
                    />
                  </td>

                  {/* Branch - Shows Branch Name */}
                  <td>
                    <input
                      className="so-grid__input"
                      style={{ 
                        width: '100%', 
                        textAlign: 'left',
                        background: '#f5f8fc'
                      }}
                      name="branch"
                      value={getBranchName ? getBranchName(line.branch) : line.branch || ''}
                      readOnly
                      disabled
                    />
                  </td>

                  {/* Remove */}
                  <td>
                    <button
                      type="button"
                      className="so-btn so-btn--danger"
                      style={{ padding: '2px 8px', fontSize: 14 }}
                      onClick={() => onRemoveLine(i)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
