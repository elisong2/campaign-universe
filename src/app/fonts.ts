import localFont from 'next/font/local'

/**
 * ABC Camera Plain — primary typeface for Burn Studio.
 * Loaded with Regular (400) and Medium (500) weights as one family.
 * Used for headings (Medium) and body text (Regular).
 */
export const cameraPlain = localFont({
  src: [
    {
      path: '../../public/fonts/Camera Plain/ABCCameraPlain-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Camera Plain/ABCCameraPlain-Medium.otf',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-camera',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
})

/**
 * SimpsonCW — Burn's labels/metadata font (ALL CAPS, wide tracking).
 * Used wherever we apply the `.font-label` utility class.
 */
export const simpsonCW = localFont({
  src: '../../public/fonts/CWSimpson/CWSimpson-Medium.otf',
  weight: '500',
  style: 'normal',
  variable: '--font-simpson',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
})
