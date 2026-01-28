import axios from 'axios'

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await axios.post('/api/auth/login', { username, password })
    return response.data.success === true
  } catch (error) {
    return false
  }
}

export async function logout(): Promise<void> {
  try {
    await axios.post('/api/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  }
  // Force page reload to clear client state
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await axios.get('/api/auth/check')
    return response.data.authenticated === true
  } catch (error) {
    return false
  }
}
