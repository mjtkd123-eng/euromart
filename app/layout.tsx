import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: '부다페스트 마트 배달 | Budapest Mart',
  description:
    '부다페스트 한인·아시안 마트 통합 배달 서비스. 원하는 마트를 골라 신선한 한국 식료품을 집앞까지 배달받으세요.',
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
    <html lang="ko" className={`${notoSansKr.variable} bg-background`}>
      <body className="font-sans antialiased">
        <CartProvider>{children}</CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
