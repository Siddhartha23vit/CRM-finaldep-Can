import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AiAssistant } from "@/components/ai-assistant"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Get Home Realty",
  description: "Real Estate Management System",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        {children}
        <AiAssistant />
      </body>
    </html>
  )
}

