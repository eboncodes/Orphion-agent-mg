import type React from "react"
import "./globals.css"
import { Merriweather } from "next/font/google"
import { AuthProvider } from "@/context/auth-context"

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather",
})

export const metadata = {
  title: "Orphion AI",
  description: "A powerful AI assistant",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={merriweather.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
