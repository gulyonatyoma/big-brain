import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const publicDir = path.resolve('public')

await fs.mkdir(publicDir, { recursive: true })

const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#0F172A"/>
  <rect x="48" y="48" width="416" height="416" rx="92" fill="url(#paint0_linear)"/>
  <path d="M158 174C158 146.386 180.386 124 208 124H304C331.614 124 354 146.386 354 174V338C354 365.614 331.614 388 304 388H208C180.386 388 158 365.614 158 338V174Z" fill="#0F172A" fill-opacity="0.72"/>
  <path d="M206 204H306" stroke="#F8FAFC" stroke-width="24" stroke-linecap="round"/>
  <path d="M206 256H286" stroke="#A78BFA" stroke-width="24" stroke-linecap="round"/>
  <path d="M206 308H316" stroke="#38BDF8" stroke-width="24" stroke-linecap="round"/>
  <circle cx="354" cy="158" r="42" fill="#8B5CF6"/>
  <path d="M336 158L350 172L374 142" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <defs>
    <linearGradient id="paint0_linear" x1="48" y1="48" x2="464" y2="464" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7C3AED"/>
      <stop offset="0.52" stop-color="#2563EB"/>
      <stop offset="1" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
</svg>
`

await fs.writeFile(path.join(publicDir, 'favicon.svg'), iconSvg.trim())

await sharp(Buffer.from(iconSvg))
  .resize(192, 192)
  .png()
  .toFile(path.join(publicDir, 'pwa-192x192.png'))

await sharp(Buffer.from(iconSvg))
  .resize(512, 512)
  .png()
  .toFile(path.join(publicDir, 'pwa-512x512.png'))

await sharp(Buffer.from(iconSvg))
  .resize(180, 180)
  .png()
  .toFile(path.join(publicDir, 'apple-touch-icon.png'))

console.log('PWA icons generated successfully.')