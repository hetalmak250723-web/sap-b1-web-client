import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDeliveries } from '../api/deliveryApi';

const getErrorMessage = (error, fallbackMessage) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail?.error?.message) return detail.error.message;
  if (detail?.message) return detail.message;
  return error?.message || fallbackMessage;
};

function DeliveryListPage() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [pageState, setPageState] = useState({
    loading: true,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    const loadDeliveries = async () => {
      setPageState({ loading: true, error: '' });

      try {
        const response = await fetchDeliveries();
        console.log('Delivery list:', response.data.deliveries);
        if (!ignore) {
          setDeliveries(response.data.deliveries || []);
          setPageState({ loading: false, error: '' });
        }
      } catch (error) {
        if (!ignore) {
          setPageState({
            loading: false,
            error: getErrorMessage(error, 'Failed to load deliveries.'),
          });
        }
      }
    };

    loadDeliveries();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Delivery List</h2>
          <small className="text-muted">All delivery documents from SAP Business One.</small>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/delivery')}
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
                <th>Customer Code</th>
                <th>Customer Name</th>
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
                    Loading deliveries...
                  </td>
                </tr>
              )}

              {!pageState.loading && deliveries.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No deliveries found.
                  </td>
                </tr>
              )}

              {!pageState.loading &&
                deliveries.map((delivery) => (
                  <tr key={delivery.DocEntry}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          navigate('/delivery', {
                            state: { deliveryDocEntry: delivery.DocEntry },
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                    <td>{delivery.DocNum}</td>
                    <td>{delivery.CardCode}</td>
                    <td>{delivery.CardName}</td>
                    <td>{delivery.DocDate ? new Date(delivery.DocDate).toLocaleDateString() : '-'}</td>
                    <td>{delivery.DocDueDate ? new Date(delivery.DocDueDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge ${delivery.DocumentStatus === 'Open' ? 'bg-success' : 'bg-secondary'}`}>
                        {delivery.DocumentStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="text-end">
                      {delivery.DocTotal != null ? Number(delivery.DocTotal).toFixed(2) : '0.00'}
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

export default DeliveryListPage;
