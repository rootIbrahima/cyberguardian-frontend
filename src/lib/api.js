import axios from 'axios'

// En production, VITE_API_URL est défini au moment du build (fichier .env du
// frontend) et vaut « /api », le chemin que nginx redirige vers le backend.
// Une URL relative évite d'inscrire le domaine dans le code : le même build
// fonctionne derrière n'importe quel nom de domaine. Repli sur le port local
// pour le développement.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

// Exporté pour les appels qui ne peuvent pas passer par axios, comme la lecture
// d'un flux SSE : ils doivent viser la même origine que le reste de l'API.
export const API_BASE = BASE_URL

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

/* Message d'erreur lisible par un humain.
   FastAPI renvoie « detail » sous forme de chaîne pour une erreur métier, mais
   sous forme de liste d'objets pour une erreur de validation (422). Passer
   cette liste à un composant fait planter le rendu React, et l'écran devient
   blanc au lieu d'afficher une alerte. */
export function messageErreur(err, defaut) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail) && detail.length) return detail[0]?.msg || defaut
  return defaut
}

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
  messagesApres: (convId, id)   => api.get(`/conversations/${convId}/messages?apres=${id}`),
  send:          (convId, text) => api.post(`/conversations/${convId}/messages`, { text }),
  sendPiece:     (convId, fichier, text = '') => {
    const form = new FormData()
    form.append('fichier', fichier)
    form.append('text', text)
    return api.post(`/conversations/${convId}/messages/piece-jointe`, form,
                    { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  piece:         (convId, pieceId) =>
    api.get(`/conversations/${convId}/pieces-jointes/${pieceId}`, { responseType: 'blob' }),
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
  remediationCandidates: ()      => api.get('/admin/remediation/candidats'),
  proposeRemediation:    (scanId) => api.post(`/admin/scans/${scanId}/remediation`),
}

export const statsAPI = {
  // Agrégats affichés avant connexion : seule route publique hors auth
  publiques: () => api.get('/stats/publiques'),
}

export const notificationAPI = {
  list:        ()    => api.get('/notifications'),
  markRead:    (id)  => api.put(`/notifications/${id}/read`),
  markAllRead: ()    => api.put('/notifications/read-all'),
}

export const telegramAPI = {
  generateCode: () => api.get('/telegram/generer-code'),
  status:       () => api.get('/telegram/statut'),
  unlink:       () => api.delete('/telegram/delier'),
}

export const githubAPI = {
  connect:    ()        => api.get('/github/connect'),
  status:     ()        => api.get('/github/statut'),
  authorize:  (repoUrl) => api.post('/github/autoriser-correction', { repo_url: repoUrl }),
  revoke:     (id)      => api.delete(`/github/autoriser-correction/${id}`),
  disconnect: ()        => api.delete('/github/deconnecter'),
}

export default api