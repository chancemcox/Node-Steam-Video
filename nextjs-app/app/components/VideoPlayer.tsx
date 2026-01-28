'use client'

const VIDEO_SERVER_URL = process.env.NEXT_PUBLIC_VIDEO_SERVER_URL || 'http://localhost:8080'

interface Video {
  id: string
  name: string
  filename: string
  size: number
  createdAt: string
}

interface VideoPlayerProps {
  video: Video
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoUrl = `${VIDEO_SERVER_URL}/api/video/${video.filename}`

  return (
    <video
      controls
      preload="metadata"
      style={{ width: '100%', maxHeight: '400px' }}
    >
      <source src={videoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
