import { POST } from '../upload-bunny/route'
import { createBunnyVideo, uploadVideoToBunny, cleanupVideoFiles } from '@/lib/bunny'
import fs from 'fs'

// Mock dependencies
jest.mock('@/lib/bunny')
jest.mock('fs')
jest.mock('uuid-by-string', () => ({
  __esModule: true,
  default: () => 'test-request-id'
}))

describe('Upload Bunny API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn() as jest.Mock
  })

  it('should handle successful video upload', async () => {
    // Mock successful responses
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 404 }) // DB check
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ status: 200 }) // DB create
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ status: 200 }) // yt-dlp
    ;(createBunnyVideo as jest.Mock).mockResolvedValue({ guid: 'test-video-id' })
    ;(uploadVideoToBunny as jest.Mock).mockResolvedValue({ success: true })
    ;(fs.existsSync as jest.Mock).mockReturnValue(true)

    const request = new Request('http://localhost:3000/api/upload-bunny', {
      method: 'POST',
      body: JSON.stringify({
        videoTitle: 'Test Video',
        initialUrl: 'https://example.com/video',
        userId: 'test-user'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.playbackUrl).toBeDefined()
  })

  
  it('should handle existing video', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ bunnyStreamVideoId: 'existing-video-id' })
    })

    const request = new Request('http://localhost:3000/api/upload-bunny', {
      method: 'POST',
      body: JSON.stringify({
        videoTitle: 'Test Video',
        initialUrl: 'https://example.com/video',
        userId: 'test-user'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.playbackUrl).toBeDefined()
  })

  it('should handle errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const request = new Request('http://localhost:3000/api/upload-bunny', {
      method: 'POST',
      body: JSON.stringify({
        videoTitle: 'Test Video',
        initialUrl: 'https://example.com/video',
        userId: 'test-user'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
}) 