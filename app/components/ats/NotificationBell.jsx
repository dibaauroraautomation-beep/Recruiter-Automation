export default function NotificationBell() {
  return (
    <div className="bell">
      <svg className="bell__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2a5 5 0 0 0-5 5v3l-2 3h14l-2-3V7a5 5 0 0 0-5-5z" />
        <path d="M8 16a2 2 0 0 0 4 0" />
      </svg>
      <span className="bell__dot" />
    </div>
  )
}
