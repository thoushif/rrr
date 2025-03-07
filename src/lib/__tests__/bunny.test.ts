import { createBunnyVideo, uploadVideoToBunny, cleanupVideoFiles, generatePlaybackUrl } from '../bunny'
import fs from 'fs'

// Mock fs
jest.mock('fs')

describe('Bunny Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn() as jest.Mock
  })

  describe('createBunnyVideo', () => {
    it('should create a video entry in Bunny Stream', async () => {
      const mockResponse = { guid: 'test-video-id' }
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await createBunnyVideo('test-request-id')

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/videos'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'AccessKey': 'test-api-key'
          })
        })
      )
    })

    it('should throw error when creation fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      })

      await expect(createBunnyVideo('test-request-id')).rejects.toThrow('Failed to create video entry')
    })
  })

  describe('uploadVideoToBunny', () => {
    it('should upload video file to Bunny Stream', async () => {
      const mockResponse = { success: true }
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await uploadVideoToBunny('test-video-id', 'test-path')

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/videos/test-video-id'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/octet-stream'
          })
        })
      )
    })

    it('should throw error when upload fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      })

      await expect(uploadVideoToBunny('test-video-id', 'test-path')).rejects.toThrow('Failed to upload video file')
    })
  })

  describe('cleanupVideoFiles', () => {
    it('should delete video file and directory', () => {
      cleanupVideoFiles('test/path/video.mp4')

      expect(fs.unlinkSync).toHaveBeenCalledWith('test/path/video.mp4')
      expect(fs.rmSync).toHaveBeenCalledWith('test/path', { recursive: true, force: true })
    })
  })

  describe('generatePlaybackUrl', () => {
    it('should generate correct playback URL', () => {
      const url = generatePlaybackUrl('test-video-id')
      expect(url).toBe('https://video.bunnycdn.com/play/test-library-id/test-video-id')
    })
  })
}) 