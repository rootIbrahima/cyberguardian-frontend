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
  register: (email, name, password, role = 'client') =>
    api.post('/auth/register', { email, name, password, role }),
  me:             () => api.get('/auth/me'),
  changePassword: (current_password, new_password) =>
    api.put('/auth/me/password', { current_password, new_password }),
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
  create:        (expertId, subject) => api.post('/conversations', { expert_id: expertId, subject }),
  scanPreview:   (convId)       => api.get(`/conversations/${convId}/scan`),
  rate:          (convId, stars) => api.post(`/conversations/${convId}/rate`, { stars }),
  messages:      (convId)       => api.get(`/conversations/${convId}/messages`),
  messagesSince: (convId, iso)  => api.get(`/conversations/${convId}/messages?since=${iso}`),
  send:          (convId, text) => api.post(`/conversations/${convId}/messages`, { text }),
  signContract:  (convId)       => api.post(`/conversations/${convId}/contract/sign`),
}

export const adminAPI = {
  pendingExperts:  ()    => api.get('/admin/experts/pending'),
  approvedExperts: ()    => api.get('/admin/experts/approved'),
  approveExpert:   (id)  => api.put(`/admin/experts/${id}/approve`),
  rejectExpert:    (id)  => api.put(`/admin/experts/${id}/reject`),
  revokeExpert:    (id)  => api.put(`/admin/experts/${id}/revoke`),
  users:           ()    => api.get('/admin/users'),
  toggleUser:      (id)  => api.put(`/admin/users/${id}/toggle`),
  stats:           ()    => api.get('/admin/stats'),
  document:        (id, kind) => api.get(`/admin/experts/${id}/document/${kind}`, { responseType: 'blob' }),
}

export default api