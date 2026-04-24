import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGRPOs } from '../api/grpoApi';

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail?.error?.message) return detail.error.message;
  if (detail?.message) return detail.message;
  return error?.message || fallbackMessage;
};

function GRPOListPage() {
  const navigate = useNavigate();
  const [grpos, setGrpos] = useState([]);
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadGRPOs = async () => {
      setPageState({ loading: true, error: '' });

      try {
        const response = await fetchGRPOs();
        if (!ignore) {
          setGrpos(response.data.grpos || []);
          setPageState({ loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setPageState({
            loading: false,
            error: getErrorMessage(error, 'Failed to load goods receipt POs.'),
          });
        }
      }
    };

    loadGRPOs();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Goods Receipt PO List</h2>
          <small className="text-muted">Click edit to load the selected goods receipt PO.</small>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/grpo')}
        >
          Back
        </button>
      </div>

      {pageState.error && (
        <div className="alert alert-danger" role="alert">
          {pageState.error}
        </div>
      )}

      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Action</th>
                <th>Doc No</th>
                <th>Vendor Code</th>
                <th>Vendor Name</th>
                <th>Doc Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {pageState.loading && (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Loading goods receipt POs...
                  </td>
                </tr>
              )}

              {!pageState.loading && grpos.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No goods receipt POs found.
                  </td>
                </tr>
              )}

              {!pageState.loading &&
                grpos.map((grpo) => (
                  <tr key={grpo.DocEntry}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate('/grpo', {
                            state: { grpoDocEntry: grpo.DocEntry },
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                    <td>{grpo.DocNum}</td>
                    <td>{grpo.CardCode}</td>
                    <td>{grpo.CardName}</td>
                    <td>{grpo.DocDate}</td>
                    <td>{grpo.DocDueDate}</td>
                    <td>{grpo.DocumentStatus}</td>
                    <td className="text-end">{Number(grpo.DocTotal || 0).toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GRPOListPage;
