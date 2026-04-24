import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPurchaseRequests } from '../api/purchaseRequestApi';

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail?.error?.message) return detail.error.message;
  if (detail?.message) return detail.message;
  return error?.message || fallbackMessage;
};

function PurchaseRequestListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadOrders = async () => {
      setPageState({ loading: true, error: '' });

      try {
        const response = await fetchPurchaseRequests();
        if (!ignore) {
          setOrders(response.data.requests || []);
          setPageState({ loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setPageState({
            loading: false,
            error: getErrorMessage(error, 'Failed to load purchase requests.'),
          });
        }
      }
    };

    loadOrders();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Purchase Requests</h2>
          <small className="text-muted">Click edit to load the selected purchase request.</small>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/purchase-request')}
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
                <th>Posting Date</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Lines</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {pageState.loading && (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading purchase requests...
                  </td>
                </tr>
              )}

              {!pageState.loading && orders.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    No purchase requests found.
                  </td>
                </tr>
              )}

              {!pageState.loading &&
                orders.map((order) => (
                  <tr key={order.doc_entry}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate('/purchase-request', {
                            state: { purchaseRequestDocEntry: order.doc_entry },
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                    <td>{order.doc_num}</td>
                    <td>{order.vendor_code || '-'}</td>
                    <td>{order.vendor_name || '-'}</td>
                    <td>{order.posting_date}</td>
                    <td>{order.delivery_date}</td>
                    <td>{order.status}</td>
                    <td>-</td>
                    <td className="text-end">
                      {order.total_amount ? Number(order.total_amount).toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PurchaseRequestListPage;
