import React from 'react';

function renderField(field, value, disabled, onChange) {
  if (field.type === 'select') {
    return (
      <select
        className="form-control form-control-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {field.options.map((option) => {
          const normalizedOption = typeof option === 'object'
            ? option
            : { value: option, label: option };

          return (
            <option key={normalizedOption.value} value={normalizedOption.value}>
              {normalizedOption.label}
            </option>
          );
        })}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        rows={3}
        className="form-control form-control-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      type={field.type === 'date' ? 'date' : 'text'}
      className="form-control form-control-sm"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function HeaderUdfSidebar({
  isOpen,
  fields,
  formSettings,
  values,
  onFieldChange,
  onClose,
  disabled = false,
  orientation = 'vertical',
  className = '',
  style,
}) {
  if (!isOpen || !Array.isArray(fields) || fields.length === 0) {
    return null;
  }

  const containerClass = orientation === 'horizontal'
    ? 'po-udf-sidebar-horizontal'
    : 'col-xl-3 col-lg-4 align-self-start';

  const rootClassName = [containerClass, className].filter(Boolean).join(' ');
  const showClose = typeof onClose === 'function';
  const handleCloseKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className={rootClassName} style={style}>
      <div
        className={`card p-3 po-udf-sidebar-card ${orientation === 'horizontal' ? 'po-udf-sidebar-card-horizontal' : ''}`}
        style={{ position: 'relative' }}
      >
        <div className="mb-3 border-bottom pb-2 d-flex justify-content-between align-items-start gap-2">
          <div>
            <h6 className="mb-1">Header UDFs</h6>
            <small className="text-muted">
              Marketing document header user-defined fields
            </small>
          </div>
          {showClose ? (
            <span
              role="button"
              tabIndex={0}
              onClick={onClose}
              onKeyDown={handleCloseKeyDown}
              aria-label="Close Header UDFs"
              className="btn btn-sm"
              style={{
                minWidth: '32px',
                height: '32px',
                padding: 0,
                border: '1px solid #c7d3e3',
                borderRadius: '8px',
                background: '#fff',
                color: '#234',
                fontSize: '18px',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              ×
            </span>
          ) : null}
        </div>

        <div className="po-udf-sidebar-body">
          {fields.map((field) => {
            const fieldDisabled = disabled || formSettings.headerUdfs[field.key]?.active === false;

            return (
              <div
                key={field.key}
                className={`mb-3 po-udf-sidebar-field po-udf-sidebar-field--${field.type || 'text'}`}
              >
                <label className="form-label mb-1">{field.label}</label>
                {renderField(
                  field,
                  values[field.key],
                  fieldDisabled,
                  (nextValue) => onFieldChange(field.key, nextValue)
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HeaderUdfSidebar;
