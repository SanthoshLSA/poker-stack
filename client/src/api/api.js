import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('poker_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    // Only auto-redirect on 401 if user already had a stored token
    // (i.e. a logged-in session expired). Don't redirect during login/register.
    if (err.response?.status === 401 && localStorage.getItem('poker_token')) {
      localStorage.removeItem('poker_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data)
}

export const groupAPI = {
  create: (data) => api.post('/groups', data),
  getMine: () => api.get('/groups/mine'),
  join: (data) => api.post('/groups/join', data),
  getById: (id) => api.get(`/groups/${id}`),
  getLeaderboard: (id) => api.get(`/groups/${id}/leaderboard`),
  leave: (id) => api.delete(`/groups/${id}/leave`)
}

export const sessionAPI = {
  create: (data) => api.post('/sessions', data),
  join: (data) => api.post('/sessions/join', data),
  getMy: () => api.get('/sessions/my'),
  getByCode: (roomCode) => api.get(`/sessions/${roomCode}`),
  recordTransaction: (roomCode, data) => api.post(`/sessions/${roomCode}/transaction`, data),
  endSession: (roomCode, data) => api.post(`/sessions/${roomCode}/end`, data),
  getHistory: (roomCode) => api.get(`/sessions/${roomCode}/history`)
}

export const leaderboardAPI = {
  getGlobal: () => api.get('/leaderboard'),
  getUserStats: (id) => api.get(`/leaderboard/user/${id}`)
}

export default api
