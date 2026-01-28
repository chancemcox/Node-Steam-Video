import { NextRequest, NextResponse } from 'next/server'

const VIDEO_SERVER_URL = process.env.VIDEO_SERVER_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const url = new URL(request.url)
    const searchParams = url.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    
    const videoServerUrl = `${VIDEO_SERVER_URL}/api/${path}${queryString}`
    
    const rangeHeader = request.headers.get('Range') || ''
    
    const response = await fetch(videoServerUrl, {
      method: 'GET',
      headers: rangeHeader ? { 'Range': rangeHeader } : {},
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: response.status }
      )
    }

    // Stream the video response with proper headers
    const headers = new Headers()
    
    // Copy relevant headers from video server
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition'].includes(lowerKey)) {
        headers.set(key, value)
      }
    })

    // Return streaming response
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (error) {
    console.error('Error proxying video request:', error)
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const videoServerUrl = `${VIDEO_SERVER_URL}/api/${path}`
    
    const formData = await request.formData()
    
    const response = await fetch(videoServerUrl, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error proxying upload request:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}
