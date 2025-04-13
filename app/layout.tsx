import type React from "react"
import { Merriweather } from "next/font/google"
import "./globals.css"

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${merriweather.variable}`}>
      <head>
        <style>{`
        body, input, textarea, button, div, span, p, h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-merriweather), serif !important;
        }
      `}</style>
      </head>
      <body className="font-serif">{children}</body>
    </html>
  )
}


import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
