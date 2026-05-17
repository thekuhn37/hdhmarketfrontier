import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'HDH Market Frontier — Market Intelligence & Financial Research'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const headshotData = await readFile(join(process.cwd(), 'public/images/harry-hwang.jpg'))
  const headshot = `data:image/jpeg;base64,${headshotData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '60px 80px',
          gap: '32px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
          <div
            style={{
              fontSize: 18,
              color: '#60a5fa',
              fontWeight: 600,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            Financial Market Intelligence
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-2px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            HDH Market Frontier
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#94a3b8',
              marginTop: '8px',
              display: 'flex',
            }}
          >
            Explore the evolving industry landscape
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '28px',
              gap: '14px',
            }}
          >
            <div style={{ width: 48, height: 3, background: '#3b82f6', display: 'flex' }} />
            <div style={{ fontSize: 18, color: '#475569', display: 'flex' }}>
              hdhmarketfrontier.com
            </div>
          </div>
        </div>

        <img
          src={headshot}
          width={290}
          height={290}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center top',
            border: '4px solid #3b82f6',
            flexShrink: 0,
          }}
        />
      </div>
    ),
    size,
  )
}
