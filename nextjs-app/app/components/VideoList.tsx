'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import VideoPlayer from './VideoPlayer'

const VIDEO_SERVER_URL = process.env.NEXT_PUBLIC_VIDEO_SERVER_URL || 'http://localhost:8080'

interface Video {
  id: string
  name: string
  filename: string
  size: number
  createdAt: string
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${VIDEO_SERVER_URL}/api/videos`)
      setVideos(response.data)
      setError('')
    } catch (err: any) {
      setError('Failed to load videos')
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading videos...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  if (videos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No videos available. {process.env.NEXT_PUBLIC_ADMIN_USERNAME ? 'Login to upload videos.' : ''}</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Available Videos</h2>
      <div className="video-grid">
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            <VideoPlayer video={video} />
            <div className="video-card-info">
              <h3>{video.name}</h3>
              <p>Size: {(video.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
