import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-md transition-colors">
        Return Home
      </Link>
    </div>
  )
}
