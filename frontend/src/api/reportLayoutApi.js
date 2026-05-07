import apiClient from './client';

export const fetchReportCatalog = () =>
  apiClient.get('/reports').then((response) => response.data);

export const fetchReportFields = (reportCode) =>
  apiClient.get('/reports/fields', { params: { report: reportCode } }).then((response) => response.data);

export const fetchManagerCatalog = (params = {}) =>
  apiClient.get('/layout-manager/catalog', { params }).then((response) => response.data);

export const searchManagerCatalog = (params = {}) =>
  apiClient.get('/layout-manager/search', { params }).then((response) => response.data);

export const createMenuEntry = (payload) =>
  apiClient.post('/layout-manager/menu-entries', payload).then((response) => response.data);

export const updateMenuEntry = (menuEntryId, payload) =>
  apiClient.put(`/layout-manager/menu-entries/${menuEntryId}`, payload).then((response) => response.data);

export const deleteMenuEntry = (menuEntryId) =>
  apiClient.delete(`/layout-manager/menu-entries/${menuEntryId}`).then((response) => response.data);

export const fetchLayouts = ({ reportCode, menuEntryId } = {}) =>
  apiClient.get('/layouts', { params: { report: reportCode, menuEntryId } }).then((response) => response.data);

export const createLayout = (payload) =>
  apiClient.post('/layouts', payload).then((response) => response.data);

export const updateLayout = (layoutId, payload) =>
  apiClient.put(`/layouts/${layoutId}`, payload).then((response) => response.data);

export const deleteLayout = (layoutId) =>
  apiClient.delete(`/layouts/${layoutId}`).then((response) => response.data);

export const setDefaultLayout = (layoutId) =>
  apiClient.post('/layouts/set-default', { layoutId }).then((response) => response.data);

export const previewLayout = (payload) =>
  apiClient.post('/layouts/preview', payload).then((response) => response.data);

export const copyLayout = (layoutId, payload) =>
  apiClient.post(`/layouts/${layoutId}/copy`, payload).then((response) => response.data);

export const fetchLayoutVersions = (layoutId) =>
  apiClient.get(`/layouts/${layoutId}/versions`).then((response) => response.data);
