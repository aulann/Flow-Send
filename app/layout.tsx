import type { Metadata } from "next"
import { Cause } from "next/font/google"
import "./globals.css"

const cause = Cause({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Flow Send",
  description: "P2P file transfer — no server, no storage.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl" className={cause.variable}>
      <body>{children}</body>
    </html>
  )
}
