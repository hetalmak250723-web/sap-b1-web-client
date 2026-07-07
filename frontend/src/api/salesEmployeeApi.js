import apiClient from './client';

const saveSalesEmployeesSetup = (employees = []) =>
  apiClient.post('/delivery/sales-employees/setup', { employees });

const fetchSalesEmployees = () =>
  apiClient.get('/lookups/sales-employees').then((response) => response.data);

export {
  saveSalesEmployeesSetup,
  fetchSalesEmployees,
};
