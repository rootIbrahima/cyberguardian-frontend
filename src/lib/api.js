import axios from 'axios'

const BASE_URL = 'http://localhost:8001'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cg-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cg-token')
      localStorage.removeItem('cg-user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/token', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/auth/me'),
}

export const scanAPI = {
  launch:      (target, assetType) => api.post('/scans', { target, asset_type: assetType }),
  list:        ()    => api.get('/scans'),
  get:         (id)  => api.get(`/scans/${id}`),
  status:      (id)  => api.get(`/scans/${id}/status`),
  askAI:       (id, question) => api.post(`/scans/${id}/ask`, { question }),
  downloadPDF: (id)  => api.get(`/scans/${id}/pdf`, { responseType: 'blob' }),
  quota:       ()    => api.get('/scans/quota'),
  delete:      (id)  => api.delete(`/scans/${id}`),
  rerun:       (id)  => api.post(`/scans/${id}/rerun`),
}

export const expertAPI = {
  list:   ()     => api.get('/experts'),
  apply:  (data) => api.post('/experts/apply', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  approve: (id)  => api.put(`/experts/${id}/approve`),
  reject:  (id)  => api.put(`/experts/${id}/reject`),
}

export const messageAPI = {
  conversations: ()             => api.get('/conversations'),
  messages:      (convId)       => api.get(`/conversations/${convId}/messages`),
  messagesSince: (convId, iso)  => api.get(`/conversations/${convId}/messages?since=${iso}`),
  send:          (convId, text) => api.post(`/conversations/${convId}/messages`, { text }),
  signContract:  (convId)       => api.post(`/conversations/${convId}/contract/sign`),
}

export const adminAPI = {
  pendingExperts: ()    => api.get('/admin/experts/pending'),
  approveExpert:  (id)  => api.put(`/admin/experts/${id}/approve`),
  rejectExpert:   (id)  => api.put(`/admin/experts/${id}/reject`),
  stats:          ()    => api.get('/admin/stats'),
}

export default api