import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '쿠키 클리커',
  description: '쿠키를 클릭해서 업그레이드를 사는 방치형 게임',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
