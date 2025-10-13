import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center py-16">
        <h1 className="terminal-bright text-3xl mb-4">404</h1>
        <h2 className="terminal-dim text-xl mb-6">ARTICLE NOT FOUND</h2>
        <p className="terminal-dim text-sm mb-8 max-w-md mx-auto">
          The requested article does not exist in our archives.
          <br />
          It may have been classified or removed.
        </p>
        <Link
          href="/memetics"
          className="terminal-command text-sm hover:terminal-bright border border-gray-600 px-6 py-2 rounded-sm inline-block"
        >
          ← RETURN TO ARCHIVE
        </Link>
      </div>
    </div>
  )
}
