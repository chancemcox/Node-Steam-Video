'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoList from './components/VideoList'
import LoginForm from './components/LoginForm'
import UploadForm from './components/UploadForm'
import { checkAuth, logout } from './lib/auth'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuth()
        setIsAuthenticated(authStatus)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    verifyAuth()
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsAuthenticated(false)
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  return (
    <main>
      <header className="header">
        <h1>Video Streaming Platform</h1>
        <div>
          {isAuthenticated ? (
            <>
              <span style={{ marginRight: '1rem' }}>Welcome!</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span>Guest User</span>
          )}
        </div>
      </header>

      <div className="container">
        {!isAuthenticated && (
          <div style={{ marginBottom: '2rem' }}>
            <LoginForm onLogin={() => setIsAuthenticated(true)} />
          </div>
        )}

        {isAuthenticated && (
          <div style={{ marginBottom: '2rem' }}>
            <UploadForm />
          </div>
        )}

        <VideoList />
      </div>
    </main>
  )
}
