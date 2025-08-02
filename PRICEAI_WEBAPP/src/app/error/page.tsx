'use client'

import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        fontFamily: 'var(--font-display)',
      }}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 24px rgba(15,160,206,0.08)',
          padding: '2.5rem 2rem',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-priceai-blue)' }}>Oops!</h1>
        <p style={{ margin: '1rem 0', color: 'var(--color-priceai-gray)' }}>
          Sorry, something went wrong.
        </p>
        <Link href="/">
          <button
            style={{
              background: 'var(--color-priceai-blue)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem',
              transition: 'background 0.2s',
            }}
          >
            Go Home
          </button>
        </Link>
      </div>
    </div>
  )
}