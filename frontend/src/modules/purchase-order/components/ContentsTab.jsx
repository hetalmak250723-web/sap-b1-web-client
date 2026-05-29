import React from 'react';
import TaxCodeLookup from '../../../components/TaxCodeLookup';
import { getLineTotalsForDisplay } from '../../../utils/lineTotals';
import { BASE_MATRIX_COLUMNS } from '../../../config/purchaseOrderForm';

const COLUMN_WIDTHS = {
  itemNo: 160,
  itemDescription: 220,
  hsnCode: 115,
  quantity: 80,
  unitPrice: 95,
  uomCode: 85,
  stdDiscount: 85,
  taxCode: 115,
  totalBeforeTax: 135,
  total: 105,
  whse: 90,
  loc: 115,
  branch: 115,
};

const INDEX_COL_WIDTH = 42;
const ACTION_COL_WIDTH = 48;

const pickerButtonStyle = {
  padding: '0 6px',
  fontSize: 11,
  border: '1px solid #a0aab4',
  background: 'linear-gradient(180deg, #fff 0%, #e8ecf0 100%)',
  flex: '0 0 24px',
  minWidth: 24,
  height: 22,
  cursor: 'pointer',
  borderRadius: 2,
};

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
  matrixFields = BASE_MATRIX_COLUMNS,
  formSettings = {},
  rowUdfFields = [],
  onRowUdfChange,
}) {
  const matrixColumns = [
    ...(matrixFields?.length ? matrixFields : BASE_MATRIX_COLUMNS).map((column) => ({
      ...column,
      minWidth: column.minWidth || COLUMN_WIDTHS[column.key] || 125,
    })),
    ...rowUdfFields.map((field) => ({
      key: field.key,
      label: field.label || field.key,
      minWidth: field.minWidth || (field.type === 'textarea' ? 180 : 125),
      isUdf: true,
      field,
    })),
  ];

  const visibleColumns = matrixColumns.filter((column) => {
    if (column.isUdf) return formSettings.rowUdfs?.[column.key]?.visible !== false;
    return formSettings.matrixColumns?.[column.key]?.visible !== false;
  });

  const tableMinWidth =
    INDEX_COL_WIDTH +
    ACTION_COL_WIDTH +
    visibleColumns.reduce((total, col) => total + col.minWidth, 0);

  const isMatrixColumnActive = (column) =>
    column.readOnly || formSettings.matrixColumns?.[column.key]?.active !== false;

  const renderUdfCell = (field, line, i) => {
    const disabled = field.readOnly || formSettings.rowUdfs?.[field.key]?.active === false;
    const value = line.udf?.[field.key] || '';

    if (field.type === 'select') {
      return (
        <td key={field.key}>
          <select
            className="so-grid__input"
            value={value}
            disabled={disabled}
            onChange={(e) => onRowUdfChange && onRowUdfChange(i, field.key, e.target.value)}
          >
            <option value=""></option>
            {(field.options || []).map((option) => {
              const normalizedOption = typeof option === 'object' ? option : { value: option, label: option };
              return (
                <option key={normalizedOption.value} value={normalizedOption.value}>
                  {normalizedOption.label}
                </option>
              );
            })}
          </select>
        </td>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <td key={field.key}>
          <input
            type="checkbox"
            checked={['Y', 'YES', 'TRUE', '1', 'TYES'].includes(String(value || '').trim().toUpperCase())}
            disabled={disabled}
            onChange={(e) => onRowUdfChange && onRowUdfChange(i, field.key, e.target.checked ? 'Y' : 'N')}
          />
        </td>
      );
    }

    return (
      <td key={field.key}>
        <input
          className="so-grid__input"
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value}
          disabled={disabled}
          onChange={(e) => onRowUdfChange && onRowUdfChange(i, field.key, e.target.value)}
        />
      </td>
    );
  };

  const renderCell = (column, line, i, uomOpts, lineTotals) => {
    if (column.isUdf) return renderUdfCell(column.field, line, i);

    const isActive = isMatrixColumnActive(column);
    const lineErrors = valErrors.lines?.[i] || {};
    const validationBorder = (key) => lineErrors[key] ? '1px solid #c00' : undefined;
    const errorText = (key) => lineErrors[key] ? (
      <div style={{ color: '#c00', fontSize: 10, marginTop: 2 }}>{lineErrors[key]}</div>
    ) : null;

    const textInput = (key, options = {}) => (
      <td key={key}>
        <input
          className="so-grid__input"
          name={key}
          type={options.type || 'text'}
          value={line[key] || ''}
          disabled={!isActive || options.disabled}
          readOnly={options.readOnly}
          onChange={(e) => onLineChange(i, e)}
          onBlur={options.numeric ? () => onNumBlur(key, 'line', i) : undefined}
          style={{
            border: validationBorder(key),
            ...(options.style || {}),
          }}
        />
        {errorText(key)}
      </td>
    );

    const readonlyInput = (key, value) => (
      <td key={key}>
        <input
          className="so-grid__input"
          value={value || ''}
          readOnly
          disabled
          style={{ background: '#f5f8fc' }}
        />
      </td>
    );

    const renderers = {
      itemNo: () => (
        <td key="itemNo">
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <input
              className="so-grid__input"
              style={{ flex: 1, minWidth: 0, textAlign: 'left', border: validationBorder('itemNo') }}
              name="itemNo"
              value={line.itemNo || ''}
              disabled={!isActive}
              onChange={(e) => onLineChange(i, e)}
              placeholder="Item Code"
            />
            {isActive && (
              <button
                type="button"
                onClick={() => onOpenItemModal && onOpenItemModal(i)}
                style={pickerButtonStyle}
                title="Select Item"
              >
                ...
              </button>
            )}
          </div>
          {errorText('itemNo')}
        </td>
      ),
      itemDescription: () => textInput('itemDescription', {
        style: {
          width: '100%',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }),
      hsnCode: () => (
        <td key="hsnCode">
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <input
              className="so-grid__input"
              style={{ flex: 1, minWidth: 0, textAlign: 'left', border: validationBorder('hsnCode') }}
              name="hsnCode"
              value={line.hsnCode || ''}
              disabled={!isActive}
              onChange={(e) => onLineChange(i, e)}
              placeholder="HSN/SAC"
            />
            {isActive && (
              <button
                type="button"
                onClick={() => onOpenHSNModal && onOpenHSNModal(i)}
                style={pickerButtonStyle}
                title="Select HSN Code"
              >
                ...
              </button>
            )}
          </div>
          {errorText('hsnCode')}
        </td>
      ),
      quantity: () => textInput('quantity', { numeric: true }),
      unitPrice: () => textInput('unitPrice', { numeric: true }),
      stdDiscount: () => textInput('stdDiscount', { numeric: true }),
      uomCode: () => (
        <td key="uomCode">
          <select
            className="so-grid__input"
            style={{ width: '100%', textAlign: 'left', border: validationBorder('uomCode') }}
            name="uomCode"
            value={line.uomCode || ''}
            disabled={!isActive}
            onChange={(e) => onLineChange(i, e)}
          >
            <option value=""></option>
            {uomOpts.map((uom) => (
              <option key={uom} value={uom}>
                {uom}
              </option>
            ))}
            {line.uomCode && !uomOpts.includes(line.uomCode) && (
              <option value={line.uomCode}>{line.uomCode}</option>
            )}
          </select>
          {errorText('uomCode')}
        </td>
      ),
      taxCode: () => (
        <td key="taxCode">
          <TaxCodeLookup
            className="so-grid__input"
            style={{ width: '100%', textAlign: 'left', border: validationBorder('taxCode') }}
            name="taxCode"
            value={line.taxCode || ''}
            disabled={!isActive}
            onChange={(e) => onLineChange(i, e)}
            taxCodes={effectiveTaxCodes}
            error={Boolean(lineErrors.taxCode)}
          />
          {errorText('taxCode')}
        </td>
      ),
      totalBeforeTax: () => readonlyInput('totalBeforeTax', lineTotals.beforeTax),
      total: () => readonlyInput('total', lineTotals.total),
      whse: () => (
        <td key="whse">
          <select
            className="so-grid__input"
            style={{ width: '100%', textAlign: 'left', border: validationBorder('whse') }}
            name="whse"
            value={line.whse || ''}
            disabled={!isActive}
            onChange={(e) => onLineChange(i, e)}
          >
            <option value="">Select</option>
            {effectiveWarehouses.map((warehouse) => (
              <option key={warehouse.WhsCode} value={warehouse.WhsCode}>
                {warehouse.WhsCode}
              </option>
            ))}
            {line.whse && !effectiveWarehouses.some((warehouse) => warehouse.WhsCode === line.whse) && (
              <option value={line.whse}>{line.whse}</option>
            )}
          </select>
          {errorText('whse')}
        </td>
      ),
      loc: () => readonlyInput('loc', getBranchName ? getBranchName(line.branch) : line.loc),
      branch: () => readonlyInput('branch', getBranchName ? getBranchName(line.branch) : line.branch),
    };

    return renderers[column.key]
      ? renderers[column.key]()
      : textInput(column.key, { numeric: ['number', 'numeric', 'decimal'].includes(column.dataType) });
  };

  return (
    <div className="so-tab-panel" style={{ overflow: 'visible', minWidth: 0, maxWidth: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="so-section-title">Document Lines</div>
        <button type="button" className="so-btn so-btn--primary" onClick={onAddLine}>
          + Add Line
        </button>
      </div>
      <div className="so-grid-wrap so-grid-wrap--contents">
        <div className="so-grid-wrap__scroller so-grid-wrap__scroller--contents">
          <table
            className="so-grid so-grid--contents"
            style={{ width: `max(100%, ${tableMinWidth}px)`, minWidth: tableMinWidth, tableLayout: 'fixed' }}
          >
            <colgroup>
              <col style={{ width: INDEX_COL_WIDTH }} />
              {visibleColumns.map((column) => (
                <col key={column.key} style={{ width: column.minWidth }} />
              ))}
              <col style={{ width: ACTION_COL_WIDTH }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ width: INDEX_COL_WIDTH }}>#</th>
                {visibleColumns.map((column) => (
                  <th key={column.key} style={{ minWidth: column.minWidth }}>
                    {column.label}
                  </th>
                ))}
                <th style={{ width: ACTION_COL_WIDTH }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const uomOpts = getUomOptions(line);
                const lineTotals = getLineTotalsForDisplay(line, effectiveTaxCodes);

                return (
                  <tr key={i}>
                    <td className="so-grid__cell--muted" style={{ textAlign: 'center', fontSize: 11 }}>
                      {i + 1}
                    </td>
                    {visibleColumns.map((column) => renderCell(column, line, i, uomOpts, lineTotals))}
                    <td>
                      <button
                        type="button"
                        className="so-btn so-btn--danger"
                        style={{ padding: '2px 8px', fontSize: 14 }}
                        onClick={() => onRemoveLine(i)}
                      >
                        x
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
