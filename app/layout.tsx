import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: 'K-EuroMart | 유럽 한국 식료품 배달',
  description:
    '부다페스트, 베를린, 파리, 비엔나, 프라하 등 유럽 주요 도시의 한국 식료품을 현지 통화로 주문하세요. 도시별 매장에서 신선한 한식 재료를 집앞까지 배달합니다.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#e2543a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${notoSansKr.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
