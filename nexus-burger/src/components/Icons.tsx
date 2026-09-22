export function Icon({ name }: { name: 'book' | 'people' | 'github' | 'external' | 'down' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'book' && (
        <path d="M12 5v15M3 4.5c4-1 6-1 9 .5 3-1.5 5-1.5 9-.5v14c-4-1-6-1-9 .5-3-1.5-5-1.5-9-.5z" />
      )}
      {name === 'people' && (
        <>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6m2 3a6 6 0 0 1 3 5v2" />
        </>
      )}
      {name === 'external' && <path d="M6 18 18 6M6 6h12v12" />}
      {name === 'down' && <path d="M12 3v18m-6-6 6 6 6-6" />}
      {name === 'github' && (
        <path d="M9 21v-3.4c-3 .6-3-1.5-4-2m10 5.4v-4c0-1-.3-1.6-.8-2 2.8-.3 5.8-1.3 5.8-6a4.7 4.7 0 0 0-1.3-3.2c.1-.4.6-1.7-.1-3.3 0 0-1.1-.3-3.6 1.2a12.3 12.3 0 0 0-6 0C6.5 2.2 5.4 2.5 5.4 2.5c-.7 1.6-.2 2.9-.1 3.3A4.7 4.7 0 0 0 4 9c0 4.7 3 5.7 5.8 6-.5.4-.8 1-.8 2" />
      )}
    </svg>
  )
}
