import { useEffect, useState, useMemo } from 'react';

export default function BusinessPartnerModal({ isOpen, onClose, onSelect, onCreateNew, businessPartners }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedRow(null);
    }
  }, [isOpen]);

  const getBalanceValue = (bp) =>
    bp?.CurrentAccountBalance ??
    bp?.currentAccountBalance ??
    bp?.Balance ??
    bp?.balance ??
    0;

  const filteredPartners = useMemo(() => {
    if (!searchTerm.trim()) return businessPartners;
    const term = searchTerm.toLowerCase();
    return businessPartners.filter(bp => 
      String(bp.CardCode || '').toLowerCase().includes(term) ||
      String(bp.CardName || '').toLowerCase().includes(term) ||
      String(bp.CardType || '').toLowerCase().includes(term)
    );
  }, [businessPartners, searchTerm]);

  const handleRowClick = (bp, index) => {
    setSelectedRow(index);
  };

  const handleRowDoubleClick = (bp) => {
    onSelect(bp);
    onClose();
  };

  const handleChoose = () => {
    if (selectedRow !== null && filteredPartners[selectedRow]) {
      onSelect(filteredPartners[selectedRow]);
      onClose();
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header" style={{ background: 'linear-gradient(to bottom, #f0f0f0, #d0d0d0)', borderBottom: '1px solid #999', padding: '6px 12px' }}>
            <h6 className="modal-title mb-0" style={{ fontSize: 12, fontWeight: 600 }}>List of Business Partners</h6>
            <div className="d-flex gap-1">
              <button type="button" className="btn btn-sm" style={{ padding: '0 8px', fontSize: 14, lineHeight: 1.2, border: '1px solid #999', background: '#f0f0f0' }}>−</button>
              <button type="button" className="btn btn-sm" onClick={onClose} style={{ padding: '0 8px', fontSize: 14, lineHeight: 1.2, border: '1px solid #999', background: '#f0f0f0' }}>✕</button>
            </div>
          </div>
          
          <div className="modal-body" style={{ padding: '12px', backgroundColor: '#fff' }}>
            {/* Search Box */}
            <div className="mb-2">
              <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Find</label>
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ fontSize: 11, background: '#ffffcc' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code, name, or type..."
                autoFocus
              />
            </div>

            {/* Business Partners Table */}
            <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #c8d0da' }}>
              <table className="table table-sm table-hover mb-0" style={{ fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#e8edf2', zIndex: 1 }}>
                  <tr>
                    <th style={{ fontSize: 11, fontWeight: 700, color: '#003366', width: '40px', padding: '4px 8px' }}>#</th>
                    <th style={{ fontSize: 11, fontWeight: 700, color: '#003366', width: '200px', padding: '4px 8px' }}>
                      BP name
                      <span style={{ marginLeft: 4 }}>▲</span>
                    </th>
                    <th style={{ fontSize: 11, fontWeight: 700, color: '#003366', width: '120px', padding: '4px 8px' }}>BP Code</th>
                    <th style={{ fontSize: 11, fontWeight: 700, color: '#003366', width: '120px', padding: '4px 8px', textAlign: 'right' }}>Account Balance</th>
                    <th style={{ fontSize: 11, fontWeight: 700, color: '#003366', width: '100px', padding: '4px 8px' }}>BP Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ padding: '20px', color: '#888' }}>
                        No business partners found
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((bp, index) => (
                      <tr
                        key={index}
                        onClick={() => handleRowClick(bp, index)}
                        onDoubleClick={() => handleRowDoubleClick(bp)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedRow === index ? '#ffffcc' : index % 2 === 0 ? '#fff' : '#fafbfc'
                        }}
                      >
                        <td style={{ padding: '3px 8px' }}>{index + 1}</td>
                        <td style={{ padding: '3px 8px', fontWeight: selectedRow === index ? 600 : 400 }}>
                          {bp.CardName || ''}
                        </td>
                        <td style={{ padding: '3px 8px' }}>{bp.CardCode || ''}</td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {formatCurrency(getBalanceValue(bp))}
                        </td>
                        <td style={{ padding: '3px 8px' }}>
                          {bp.CardType === 'C' ? 'Customer' : bp.CardType === 'S' ? 'Supplier' : bp.CardType === 'L' ? 'Lead' : bp.CardType || 'Customer'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination placeholder */}
            <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: 11, color: '#666' }}>
              <div>
                <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: 11, border: '1px solid #ccc' }}>◄</button>
                <span style={{ margin: '0 8px' }}>...</span>
                <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: 11, border: '1px solid #ccc' }}>►</button>
              </div>
              <div>
                Showing {filteredPartners.length} of {businessPartners.length} business partners
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '8px 12px', backgroundColor: '#f0f0f0', borderTop: '1px solid #ccc' }}>
            <button 
              type="button" 
              className="btn btn-warning btn-sm px-4" 
              style={{ fontSize: 11 }} 
              onClick={handleChoose}
              disabled={selectedRow === null}
            >
              Choose
            </button>
            <button type="button" className="btn btn-secondary btn-sm px-4" style={{ fontSize: 11 }} onClick={onClose}>
              Cancel
            </button>
            {onCreateNew && (
              <button
                type="button"
                className="btn btn-warning btn-sm px-4"
                style={{ fontSize: 11 }}
                onClick={onCreateNew}
              >
                New
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
