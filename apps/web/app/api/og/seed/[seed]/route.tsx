import { prefetchSignature, stringToParams } from 'core'
import { ImageResponse, NextRequest } from 'next/server'
import { parseSettings } from '@/lib/settings'

export const runtime = 'edge'

export async function GET(req: NextRequest, { params }: { params: { seed: string } }) {
  const { seed } = params
  const seedParams = stringToParams(seed)
  const settings = parseSettings(seedParams)
  const signature = prefetchSignature(seedParams.seed)

  const firstPart = settings.settingsParams.slice(0, 4);
  const secondPart = settings.settingsParams.slice(4);

  const inter = await fetch(
    new URL('../../../../../public/fonts/inter-latin-ext-400-normal.woff', import.meta.url),
  ).then((res) => res.arrayBuffer());
  const interBold = await fetch(
    new URL('../../../../../public/fonts/inter-latin-ext-700-normal.woff', import.meta.url),
  ).then((res) => res.arrayBuffer());
  const interBoldItalic = await fetch(
    new URL('../../../../../public/fonts/Inter-BoldItalic.woff', import.meta.url),
  ).then((res) => res.arrayBuffer());
  const mono = await fetch(
    new URL('../../../../../public/fonts/GeistMono-Regular.otf', import.meta.url),
  ).then((res) => res.arrayBuffer());
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontFamily: 'Inter',
          fontSize: 40,
          color: 'white',
          background: 'black',
          width: '100%',
          height: '100%',
          padding: '16px 64px',
          textAlign: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', justifyContent: 'center',
          alignItems: 'center', }}>
          <h1 style={{ margin: 0, fontStyle: 'italic' }}>DASH</h1>
          <div style={{ fontFamily: '"Geist Mono"', fontSize: '24px' }}>{signature}</div>
        </div>
        <div style={{ display: 'flex', height: '48px' }} />
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', gap: '48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {settings.randomizeParams.map((item: any, index: number) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6a6a6a' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '18px' }}>{item.value}</div>
                </div>
              ))}
              {settings.optionsParams.filter(({ label }) => label !== 'Seed Number').map((item: any, index: number) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6a6a6a' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '18px' }}>{String(item.value)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {firstPart.map((item: any, index: number) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6a6a6a' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '18px' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {secondPart.map((item: any, index: number) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6a6a6a' }}>{item.label}</div>
                  <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '18px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: inter,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBoldItalic,
          weight: 700,
          style: 'italic',
        },
        {
          name: 'Geist Mono',
          data: mono,
          weight: 400,
          style: 'normal',
        }
      ],
    },
  );
}
