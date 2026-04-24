import React from 'react';

function SettingsSection({ title, fields, groupKey, formSettings, onSettingChange }) {
  return (
    <div className="mb-4">
      <h6 className="border-bottom pb-1 mb-2">{title}</h6>

      {fields.map((field) => (
        <div
          key={field.key}
          className="d-flex justify-content-between align-items-center mb-2"
        >
          <span className="small">{field.label}</span>

          <div className="d-flex gap-2">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formSettings[groupKey][field.key]?.visible !== false}
                onChange={(event) =>
                  onSettingChange(groupKey, field.key, 'visible', event.target.checked)
                }
              />
              <label className="form-check-label small">V</label>
            </div>

            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formSettings[groupKey][field.key]?.active !== false}
                onChange={(event) =>
                  onSettingChange(groupKey, field.key, 'active', event.target.checked)
                }
              />
              <label className="form-check-label small">A</label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormSettingsPanel({
  isOpen,
  onClose,
  matrixFields,
  headerUdfFields,
  rowUdfFields,
  formSettings,
  onSettingChange,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '380px',
        height: '100%',
        background: '#fff',
        borderLeft: '1px solid #dee2e6',
        zIndex: 1050,
        overflowY: 'auto',
      }}
    >
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <div>
          <h6 className="mb-1">Form Settings</h6>
          <small className="text-muted">Control visibility &amp; activity</small>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="p-3">
        <SettingsSection
          title="Matrix Columns"
          fields={matrixFields}
          groupKey="matrixColumns"
          formSettings={formSettings}
          onSettingChange={onSettingChange}
        />
        <SettingsSection
          title="Header UDF Sidebar"
          fields={headerUdfFields}
          groupKey="headerUdfs"
          formSettings={formSettings}
          onSettingChange={onSettingChange}
        />
        <SettingsSection
          title="Row UDF Columns"
          fields={rowUdfFields}
          groupKey="rowUdfs"
          formSettings={formSettings}
          onSettingChange={onSettingChange}
        />
      </div>
    </div>
  );
}

export default FormSettingsPanel;
