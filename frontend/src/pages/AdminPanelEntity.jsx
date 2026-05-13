import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createAdminRecord,
  deleteAdminRecord,
  fetchAdminEntityBootstrap,
  updateAdminRecord,
} from '../api/adminPanelApi';

const formatDateTimeForInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part) => String(part).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatCellValue = (value, column, lookupLabels) => {
  if (lookupLabels?.has(String(value))) {
    return lookupLabels.get(String(value));
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (column.dataType === 'bit') {
    return value ? 'Yes' : 'No';
  }

  if (['date', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset'].includes(column.dataType)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(value);
};

const buildEmptyForm = (schema) =>
  Object.fromEntries(
    (schema?.columns || [])
      .filter((column) => column.editable)
      .map((column) => {
        if (column.dataType === 'bit') {
          return [column.name, column.nullable ? '' : false];
        }

        return [column.name, ''];
      }),
  );

const buildFormFromRecord = (schema, record) => {
  const nextForm = buildEmptyForm(schema);

  for (const column of schema.columns || []) {
    if (!column.editable) continue;

    const value = record?.[column.name];
    if (column.dataType === 'bit') {
      nextForm[column.name] = column.nullable
        ? (value === null || value === undefined ? '' : String(Boolean(value)))
        : Boolean(value);
      continue;
    }

    if (column.inputType === 'datetime-local') {
      nextForm[column.name] = formatDateTimeForInput(value);
      continue;
    }

    nextForm[column.name] = value === null || value === undefined ? '' : String(value);
  }

  return nextForm;
};

const AdminPanelEntity = () => {
  const { entityKey = '' } = useParams();
  const navigate = useNavigate();
  const [bootstrap, setBootstrap] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const schema = bootstrap?.schema || null;
  const primaryKey = schema?.primaryKey || '';
  const records = bootstrap?.records || [];
  const lookups = bootstrap?.lookups || {};

  const hydrateBootstrap = (payload, preferredRecordId = null, nextCreating = false) => {
    const nextSchema = payload?.schema || null;
    const nextRecords = payload?.records || [];
    const nextPrimaryKey = nextSchema?.primaryKey || '';
    const shouldCreate = nextCreating || !nextRecords.length;
    const nextSelectedId = preferredRecordId && nextRecords.some((row) => row[nextPrimaryKey] === preferredRecordId)
      ? preferredRecordId
      : nextRecords[0]?.[nextPrimaryKey] ?? null;

    setBootstrap(payload);
    setIsCreating(shouldCreate);
    setSelectedRecordId(shouldCreate ? null : nextSelectedId);
    setFormData(
      shouldCreate
        ? buildEmptyForm(nextSchema)
        : buildFormFromRecord(nextSchema, nextRecords.find((row) => row[nextPrimaryKey] === nextSelectedId) || null),
    );
  };

  useEffect(() => {
    let isCancelled = false;

    const loadBootstrap = async () => {
      try {
        setIsLoading(true);
        setError('');
        setNotice('');
        const payload = await fetchAdminEntityBootstrap(entityKey);
        if (!isCancelled) {
          hydrateBootstrap(payload, null, false);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.response?.data?.message || loadError.message || 'Unable to load admin records.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBootstrap();
    return () => {
      isCancelled = true;
    };
  }, [entityKey]);

  const lookupLabelMaps = useMemo(
    () => Object.fromEntries(
      Object.entries(lookups).map(([columnName, options]) => [
        columnName,
        new Map((options || []).map((option) => [String(option.value), option.label])),
      ]),
    ),
    [lookups],
  );

  const visibleColumns = useMemo(() => {
    if (!schema) return [];

    const listColumnNames = bootstrap?.entity?.listColumns || schema.entity?.listColumns || [];
    return listColumnNames
      .map((columnName) => schema.columns.find((column) => column.name === columnName))
      .filter(Boolean);
  }, [bootstrap?.entity?.listColumns, schema]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return records;

    return records.filter((record) =>
      visibleColumns.some((column) => {
        const cellValue = formatCellValue(
          record[column.name],
          column,
          lookupLabelMaps[column.name],
        );
        return String(cellValue).toLowerCase().includes(normalizedSearch);
      }),
    );
  }, [deferredSearchTerm, lookupLabelMaps, records, visibleColumns]);

  const selectedRecord = useMemo(
    () => records.find((record) => record[primaryKey] === selectedRecordId) || null,
    [primaryKey, records, selectedRecordId],
  );

  const openNewRecord = () => {
    if (!schema) return;
    setNotice('');
    setError('');
    setIsCreating(true);
    setSelectedRecordId(null);
    setFormData(buildEmptyForm(schema));
  };

  const openExistingRecord = (record) => {
    if (!schema) return;
    setNotice('');
    setError('');
    setIsCreating(false);
    setSelectedRecordId(record[primaryKey]);
    setFormData(buildFormFromRecord(schema, record));
  };

  const handleFieldChange = (column, nextValue) => {
    setFormData((current) => ({
      ...current,
      [column.name]: nextValue,
    }));
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError('');
      const payload = await fetchAdminEntityBootstrap(entityKey);
      hydrateBootstrap(payload, isCreating ? null : selectedRecordId, isCreating);
    } catch (refreshError) {
      setError(refreshError.response?.data?.message || refreshError.message || 'Unable to refresh records.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!schema) return;

    try {
      setIsSaving(true);
      setError('');
      setNotice('');

      let payload;
      if (isCreating) {
        payload = await createAdminRecord(entityKey, formData);
      } else {
        payload = await updateAdminRecord(entityKey, selectedRecordId, formData);
      }

      const preferredRecordId = isCreating
        ? payload.records?.[0]?.[payload.schema?.primaryKey] ?? null
        : selectedRecordId;

      hydrateBootstrap(payload, preferredRecordId, false);
      setNotice(isCreating ? 'Record created successfully.' : 'Record updated successfully.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || saveError.message || 'Unable to save the record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!schema || isCreating || selectedRecordId === null || selectedRecordId === undefined) return;

    const confirmed = window.confirm(`Delete this ${bootstrap?.entity?.title || 'record'} entry?`);
    if (!confirmed) return;

    try {
      setIsSaving(true);
      setError('');
      setNotice('');
      const payload = await deleteAdminRecord(entityKey, selectedRecordId);
      hydrateBootstrap(payload, null, false);
      setNotice('Record deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || deleteError.message || 'Unable to delete the record.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="admin-panel-empty">Loading {entityKey}...</div>;
  }

  if (error && !bootstrap) {
    return (
      <div className="admin-panel-page">
        <div className="admin-panel-alert admin-panel-alert--error">{error}</div>
        <button type="button" className="admin-panel-button" onClick={() => navigate('/admin')}>
          Back to Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div className="admin-entity-page">
      <section className="admin-entity-banner">
        <div>
          <div className="admin-entity-banner__eyebrow">Admin Section</div>
          <h1>{bootstrap?.entity?.title || 'Admin Data'}</h1>
          <p>{bootstrap?.entity?.description}</p>
        </div>

        <div className="admin-entity-banner__actions">
          <Link className="admin-panel-button admin-panel-button--ghost" to="/admin">
            All Sections
          </Link>
          <button type="button" className="admin-panel-button admin-panel-button--ghost" onClick={handleRefresh}>
            Refresh
          </button>
          <button type="button" className="admin-panel-button" onClick={openNewRecord}>
            New Record
          </button>
        </div>
      </section>

      {error ? <div className="admin-panel-alert admin-panel-alert--error">{error}</div> : null}
      {notice ? <div className="admin-panel-alert admin-panel-alert--success">{notice}</div> : null}

      <div className="admin-entity-layout">
        <section className="admin-records-panel">
          <div className="admin-records-panel__toolbar">
            <input
              type="search"
              className="admin-panel-input"
              placeholder={`Search ${bootstrap?.entity?.title || 'records'}`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="admin-records-panel__meta">
              {filteredRecords.length} / {records.length} rows
            </div>
          </div>

          <div className="admin-records-table-wrap">
            <table className="admin-records-table">
              <thead>
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column.name}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <tr
                      key={record[primaryKey]}
                      className={!isCreating && record[primaryKey] === selectedRecordId ? 'is-selected' : ''}
                      onClick={() => openExistingRecord(record)}
                    >
                      {visibleColumns.map((column) => (
                        <td key={column.name}>
                          {formatCellValue(record[column.name], column, lookupLabelMaps[column.name])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={Math.max(visibleColumns.length, 1)}>
                      <div className="admin-panel-empty admin-panel-empty--inline">
                        No matching records found.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-form-panel">
          <div className="admin-form-panel__header">
            <div>
              <h2>{isCreating ? `Create ${bootstrap?.entity?.title}` : `Edit ${bootstrap?.entity?.title}`}</h2>
              <p>
                {isCreating
                  ? 'Fill in the fields below to add a new record.'
                  : `Primary key: ${selectedRecord?.[primaryKey] ?? 'Not selected'}`}
              </p>
            </div>

            {!isCreating && selectedRecord ? (
              <button
                type="button"
                className="admin-panel-button admin-panel-button--danger"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </button>
            ) : null}
          </div>

          <form className="admin-form-grid" onSubmit={handleSubmit}>
            {(schema?.columns || []).map((column) => {
              const value = formData[column.name];
              const fieldId = `admin-field-${column.name}`;

              if (!column.editable) {
                return (
                  <div key={column.name} className="admin-form-field admin-form-field--readonly">
                    <label htmlFor={fieldId}>{column.label}</label>
                    <input
                      id={fieldId}
                      className="admin-panel-input"
                      value={isCreating ? 'Auto generated' : selectedRecord?.[column.name] ?? ''}
                      readOnly
                    />
                  </div>
                );
              }

              if (column.isForeignKey) {
                return (
                  <div key={column.name} className="admin-form-field">
                    <label htmlFor={fieldId}>{column.label}</label>
                    <select
                      id={fieldId}
                      className="admin-panel-input"
                      value={value ?? ''}
                      onChange={(event) => handleFieldChange(column, event.target.value)}
                    >
                      <option value="">Select {column.label}</option>
                      {(lookups[column.name] || []).map((option) => (
                        <option key={`${column.name}-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {column.helpText ? <small>{column.helpText}</small> : null}
                  </div>
                );
              }

              if (column.dataType === 'bit' && column.nullable) {
                return (
                  <div key={column.name} className="admin-form-field">
                    <label htmlFor={fieldId}>{column.label}</label>
                    <select
                      id={fieldId}
                      className="admin-panel-input"
                      value={value ?? ''}
                      onChange={(event) => handleFieldChange(column, event.target.value)}
                    >
                      <option value="">Not set</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    {column.helpText ? <small>{column.helpText}</small> : null}
                  </div>
                );
              }

              if (column.dataType === 'bit') {
                return (
                  <div key={column.name} className="admin-form-field admin-form-field--checkbox">
                    <label htmlFor={fieldId}>{column.label}</label>
                    <div className="admin-checkbox-row">
                      <input
                        id={fieldId}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => handleFieldChange(column, event.target.checked)}
                      />
                      <span>{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    {column.helpText ? <small>{column.helpText}</small> : null}
                  </div>
                );
              }

              const isLongText = (column.maxLength && column.maxLength > 180) || column.name === 'ApiUrl';

              return (
                <div
                  key={column.name}
                  className={`admin-form-field${isLongText ? ' admin-form-field--wide' : ''}`}
                >
                  <label htmlFor={fieldId}>{column.label}</label>
                  {isLongText ? (
                    <textarea
                      id={fieldId}
                      className="admin-panel-input admin-panel-textarea"
                      value={value ?? ''}
                      maxLength={column.maxLength && column.maxLength > 0 ? column.maxLength : undefined}
                      onChange={(event) => handleFieldChange(column, event.target.value)}
                    />
                  ) : (
                    <input
                      id={fieldId}
                      className="admin-panel-input"
                      type={column.inputType === 'password' ? 'password' : column.inputType}
                      value={value ?? ''}
                      maxLength={column.maxLength && column.maxLength > 0 ? column.maxLength : undefined}
                      onChange={(event) => handleFieldChange(column, event.target.value)}
                    />
                  )}
                  {column.helpText ? <small>{column.helpText}</small> : null}
                </div>
              );
            })}

            <div className="admin-form-actions">
              <button type="submit" className="admin-panel-button" disabled={isSaving}>
                {isSaving ? 'Saving...' : isCreating ? 'Create Record' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="admin-panel-button admin-panel-button--ghost"
                onClick={() => {
                  if (isCreating) {
                    setFormData(buildEmptyForm(schema));
                    return;
                  }

                  setFormData(buildFormFromRecord(schema, selectedRecord));
                }}
                disabled={isSaving}
              >
                Reset Form
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminPanelEntity;
