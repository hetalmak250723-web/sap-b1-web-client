import React, { useEffect, useMemo, useState } from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const dialogStyle = {
  backgroundColor: '#fff',
  borderRadius: 4,
  width: '820px',
  maxWidth: '92vw',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const headerStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #d0d7de',
  background: 'linear-gradient(180deg, #f6f8fa 0%, #e9ecef 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: 20,
  cursor: 'pointer',
  color: '#57606a',
  padding: 0,
  width: 24,
  height: 24,
};

const footerButtonStyle = {
  padding: '6px 16px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 3,
  cursor: 'pointer',
};

export default function QualitySelectionModal({
  isOpen,
  onClose,
  onSelect,
  onCreate,
  options = [],
  title = 'List of User-Defined Values',
  searchPlaceholder = 'Search values',
  emptyMessage = 'No values found',
  allowCreate = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;

    return options.filter((option) => {
      const value = String(option?.value || '').toLowerCase();
      const description = String(option?.description || '').toLowerCase();
      const label = String(option?.label || '').toLowerCase();
      return value.includes(query) || description.includes(query) || label.includes(query);
    });
  }, [options, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(-1);
      setShowCreateForm(false);
      setNewValue('');
      setNewDescription('');
      setCreateError('');
      setSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery, options]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedIndex(-1);
    setShowCreateForm(false);
    setNewValue('');
    setNewDescription('');
    setCreateError('');
    setSaving(false);
    onClose();
  };

  const handleChoose = () => {
    if (selectedIndex < 0 || !filteredOptions[selectedIndex]) return;
    onSelect(filteredOptions[selectedIndex]);
    handleClose();
  };

  const handleStartCreate = () => {
    setShowCreateForm(true);
    setCreateError('');
    setNewValue(searchQuery.trim());
    setNewDescription(searchQuery.trim());
  };

  const handleCreate = async () => {
    const normalizedValue = String(newValue || '').trim();
    const normalizedDescription = String(newDescription || normalizedValue).trim();

    if (!normalizedValue) {
      setCreateError('Value is required.');
      return;
    }

    if (!onCreate) return;

    try {
      setSaving(true);
      setCreateError('');
      const createdOption = await onCreate({
        value: normalizedValue,
        description: normalizedDescription,
      });

      if (createdOption) {
        onSelect(createdOption);
        handleClose();
      }
    } catch (error) {
      setCreateError(error?.response?.data?.detail || error?.message || 'Failed to create value.');
    } finally {
      setSaving(false);
    }
  };

  const showDescriptionColumn = filteredOptions.some(
    (option) => option?.description && option.description !== option.value
  );

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#24292f' }}>{title}</h3>
          <button type="button" onClick={handleClose} style={closeButtonStyle}>
            x
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #d0d7de' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, minWidth: 40 }}>Find</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: 12,
                border: '1px solid #d0d7de',
                borderRadius: 3,
              }}
              autoFocus
            />
          </div>
        </div>

        {allowCreate && showCreateForm && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #d0d7de', background: '#fffef4' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Value</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d0d7de', borderRadius: 3 }}
                autoFocus
              />
              <label style={{ fontSize: 12, fontWeight: 600 }}>Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d0d7de', borderRadius: 3 }}
              />
            </div>
            {createError && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#cf222e' }}>{createError}</div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11,
              marginTop: 8,
            }}
          >
            <thead>
              <tr style={{ background: '#f6f8fa', borderBottom: '1px solid #d0d7de' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, width: 40 }}>#</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Value</th>
                {showDescriptionColumn && (
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, width: '35%' }}>
                    Description
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredOptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={showDescriptionColumn ? 3 : 2}
                    style={{ padding: 20, textAlign: 'center', color: '#57606a' }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredOptions.map((option, index) => (
                  <tr
                    key={`${option.value}-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => {
                      onSelect(option);
                      handleClose();
                    }}
                    style={{
                      backgroundColor: selectedIndex === index ? '#fff8c5' : index % 2 === 0 ? '#fff' : '#f6f8fa',
                      cursor: 'pointer',
                      borderBottom: '1px solid #d0d7de',
                    }}
                  >
                    <td style={{ padding: '6px 8px', color: '#57606a' }}>{index + 1}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 500 }}>{option.value}</td>
                    {showDescriptionColumn && (
                      <td style={{ padding: '6px 8px' }}>{option.description || ''}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #d0d7de',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: '#f6f8fa',
            }}
          >
          {allowCreate && showCreateForm ? (
            <>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                style={{
                  ...footerButtonStyle,
                  border: '1px solid #bf8700',
                  background: 'linear-gradient(180deg, #f9d976 0%, #f4b400 100%)',
                  color: '#24292f',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError('');
                  setNewValue('');
                  setNewDescription('');
                }}
                style={{
                  ...footerButtonStyle,
                  border: '1px solid #d0d7de',
                  background: 'linear-gradient(180deg, #f6f8fa 0%, #e9ecef 100%)',
                  color: '#24292f',
                }}
              >
                Cancel New
              </button>
            </>
          ) : allowCreate ? (
            <button
              type="button"
              onClick={handleStartCreate}
              style={{
                ...footerButtonStyle,
                border: '1px solid #bf8700',
                background: 'linear-gradient(180deg, #f9d976 0%, #f4b400 100%)',
                color: '#24292f',
              }}
            >
              New
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleChoose}
            disabled={selectedIndex < 0}
            style={{
              ...footerButtonStyle,
              border: '1px solid #1f883d',
              background: selectedIndex >= 0 ? 'linear-gradient(180deg, #2da44e 0%, #1f883d 100%)' : '#94d3a2',
              color: '#fff',
              cursor: selectedIndex >= 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Choose
          </button>
          <button
            type="button"
            onClick={handleClose}
            style={{
              ...footerButtonStyle,
              border: '1px solid #d0d7de',
              background: 'linear-gradient(180deg, #f6f8fa 0%, #e9ecef 100%)',
              color: '#24292f',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
