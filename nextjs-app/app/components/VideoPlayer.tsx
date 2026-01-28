'use client'

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
  const videoUrl = `/api/video/video/${video.filename}`

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
