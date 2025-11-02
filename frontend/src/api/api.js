import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Client API
export const clientAPI = {
  getAll: () => api.get('/api/client/list'),
  getById: (id) => api.get(`/api/client/${id}`),
  add: (data) => api.post('/api/client/add', data),
  update: (id, data) => api.put(`/api/client/${id}`, data),
  delete: (id) => api.delete(`/api/client/${id}`),
  test: (id) => api.post(`/api/client/${id}/test`),
  sync: (id) => api.post(`/api/client/${id}/sync`),
  updateToken: (id, data) => api.post(`/api/client/${id}/token`, data),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: (clientId) => api.get(`/api/dashboard/${clientId}`),
  getContacts: (clientId, params) => api.get(`/api/dashboard/${clientId}/contacts`, { params }),
  getCampaigns: (clientId, params) => api.get(`/api/dashboard/${clientId}/campaigns`, { params }),
  getEmails: (clientId, params) => api.get(`/api/dashboard/${clientId}/emails`, { params }),
  getSegments: (clientId, params) => api.get(`/api/dashboard/${clientId}/segments`, { params }),
};

export default api;
