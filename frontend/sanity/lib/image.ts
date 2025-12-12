import imageUrlBuilder from '@sanity/image-url'
import { client } from './client'

/**
 * Get Sanity image URL builder
 * https://www.sanity.io/docs/image-url
 */
const builder = imageUrlBuilder(client)

export function urlForImage(source: any) {
  return builder.image(source).auto('format').fit('max')
}

/**
 * Generate a tiny blurred base64 placeholder image (LQIP)
 * Similar to doity.de's blur-up technique
 *
 * @param source - Sanity image reference
 * @returns Base64 encoded tiny blurred image
 */
export function getLQIP(source: any): string {
  if (!source) return ''

  try {
    // Generate a 20px wide blurred version
    const lqipUrl = builder
      .image(source)
      .width(20)
      .quality(20)
      .blur(20)
      .auto('format')
      .url()

    return lqipUrl || ''
  } catch (error) {
    console.warn('Failed to generate LQIP:', error)
    return ''
  }
}

/**
 * Generate LQIP from Sanity CDN URL string
 * For images that are already CDN URLs (not Sanity references)
 *
 * @param cdnUrl - Full Sanity CDN URL
 * @returns Modified URL with LQIP parameters
 */
export function getLQIPFromURL(cdnUrl: string): string {
  if (!cdnUrl || !cdnUrl.includes('cdn.sanity.io')) return ''

  try {
    const url = new URL(cdnUrl)
    // Add LQIP query parameters
    url.searchParams.set('w', '20')
    url.searchParams.set('q', '20')
    url.searchParams.set('blur', '20')
    url.searchParams.set('auto', 'format')

    return url.toString()
  } catch (error) {
    console.warn('Failed to generate LQIP from URL:', error)
    return ''
  }
}

/**
 * Convert image to base64 data URI for inline embedding
 * This fetches the LQIP and converts it to base64
 *
 * @param lqipUrl - LQIP URL to convert
 * @returns Promise<string> - Base64 data URI
 */
export async function imageToBase64(lqipUrl: string): Promise<string> {
  if (!lqipUrl) return ''

  try {
    const response = await fetch(lqipUrl)
    if (!response.ok) throw new Error('Failed to fetch LQIP')

    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Failed to convert image to base64:', error)
    return ''
  }
}
