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
  { key: 'whse', label: 'Whse', minWidth: 60 },
  { key: 'loc', label: 'LOC', minWidth: 70 },
  { key: 'branch', label: 'Branch', minWidth: 70 },
];

export default function ContentsTab({
  lines,
  onLineChange,
  onNumBlur,
  onAddLine,
  onRemoveLine,
  onOpenHSNModal,
  onOpenItemModal,
  lineItemOptions,
  getUomOptions,
  effectiveTaxCodes,
  effectiveWarehouses,
  fmtTaxLabel,
  getBranchName,
  valErrors,
}) {
  return (
    <div className="del-tab-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div className="del-section-title" style={{ margin: 0 }}>Document Lines</div>
        <button type="button" className="del-btn del-btn--primary" onClick={onAddLine}>
          + Add Line
        </button>
      </div>
      <div className="del-grid-wrap" style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <table className="del-grid" style={{ minWidth: 1100 }}>
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
                  <td style={{ textAlign: 'center', color: '#888', fontSize: 11 }}>{i + 1}</td>

                  {/* Item No */}
                  <td>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      <input
                        className={`del-grid__input${valErrors.lines[i]?.itemNo ? ' del-field__input--error' : ''}`}
                        style={{ flex: 1, textAlign: 'left' }}
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
                      className="del-grid__input"
                      style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                        className={`del-grid__input${valErrors.lines[i]?.hsnCode ? ' del-field__input--error' : ''}`}
                        style={{ flex: 1, textAlign: 'left' }}
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
                          height: '20px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                        }}
                        title="Select HSN Code"
                      >
                        ...
                      </button>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td>
                    <input
                      className={`del-grid__input${valErrors.lines[i]?.quantity ? ' del-field__input--error' : ''}`}
                      name="quantity"
                      value={line.quantity}
                      onChange={e => onLineChange(i, e)}
                      onBlur={() => onNumBlur('quantity', 'line', i)}
                    />
                  </td>

                  {/* Unit Price */}
                  <td>
                    <input
                      className={`del-grid__input${valErrors.lines[i]?.unitPrice ? ' del-field__input--error' : ''}`}
                      name="unitPrice"
                      value={line.unitPrice}
                      onChange={e => onLineChange(i, e)}
                      onBlur={() => onNumBlur('unitPrice', 'line', i)}
                    />
                  </td>

                  {/* UoM */}
                  <td>
                    <select
                      className={`del-grid__input${valErrors.lines[i]?.uomCode ? ' del-field__select--error' : ''}`}
                      style={{ textAlign: 'center', height: '20px', padding: '0 4px' }}
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
                      className="del-grid__input"
                      name="stdDiscount"
                      value={line.stdDiscount}
                      onChange={e => onLineChange(i, e)}
                      onBlur={() => onNumBlur('stdDiscount', 'line', i)}
                    />
                  </td>

                  {/* Tax Code */}
                  <td>
                    <select
                      className="del-grid__input"
                      style={{ textAlign: 'left', height: '20px', padding: '0 4px' }}
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
                      className="del-grid__input"
                      value={lineTotals.beforeTax}
                      readOnly
                    />
                  </td>

                  {/* Total */}
                  <td>
                    <input
                      className="del-grid__input"
                      value={lineTotals.total}
                      readOnly
                    />
                  </td>

                  {/* Warehouse - dropdown with all values */}
                  <td>
                    <select
                      className={`del-grid__input${valErrors.lines[i]?.whse ? ' del-field__select--error' : ''}`}
                      style={{ textAlign: 'left', height: '20px', padding: '0 4px' }}
                      name="whse"
                      value={line.whse || ''}
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
                  </td>

                  {/* LOC - disabled, shows branch name */}
                  <td>
                    <input
                      className="del-grid__input"
                      value={getBranchName ? getBranchName(line.branch) : line.loc || ''}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed', textAlign: 'left' }}
                      title="LOC is synced from branch"
                    />
                  </td>

                  {/* Branch - disabled, shows branch name */}
                  <td>
                    <input
                      className="del-grid__input"
                      value={getBranchName ? getBranchName(line.branch) : line.branch || ''}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed', textAlign: 'left' }}
                      title="Branch is synced from header"
                    />
                  </td>

                  {/* Remove */}
                  <td>
                    <button
                      type="button"
                      className="del-btn del-btn--danger"
                      style={{ padding: '2px 6px' }}
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
