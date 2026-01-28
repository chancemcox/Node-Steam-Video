'use client'

import { useState } from 'react'
import axios from 'axios'
import { checkAuth } from '../lib/auth'

const VIDEO_SERVER_URL = process.env.NEXT_PUBLIC_VIDEO_SERVER_URL || 'http://localhost:8080'

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setMessage('')
      setError('')
    }
  }

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth()
      if (!authenticated) {
        setError('You must be logged in to upload videos')
      }
    }
    verifyAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const authenticated = await checkAuth()
    if (!authenticated) {
      setError('You must be logged in to upload videos')
      return
    }

    if (!file) {
      setError('Please select a video file')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')

    const formData = new FormData()
    formData.append('video', file)

    try {
      const response = await axios.post(`${VIDEO_SERVER_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setMessage(`Uploading: ${percentCompleted}%`)
          }
        },
      })

      setMessage('Video uploaded successfully!')
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('video-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      // Refresh video list after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload video')
      setMessage('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-form">
      <h2>Upload New Video</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="video-file">Select Video File (MP4, WebM, OGG)</label>
          <input
            type="file"
            id="video-file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={handleFileChange}
            disabled={uploading}
            required
          />
        </div>
        {file && (
          <div style={{ marginBottom: '1rem', color: '#666' }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={uploading || !file}
          style={{ width: '100%' }}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  )
}
