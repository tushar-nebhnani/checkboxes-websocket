export function PasswordVisibilityToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      className="field-toggle-visibility"
      onClick={onToggle}
      aria-label={visible ? "Hide passphrase" : "Show passphrase"}
      aria-pressed={visible}
      tabIndex={-1}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7c2.1 0 3.9.6 5.4 1.5M22 12s-3.6 7-10 7c-2.1 0-3.9-.6-5.4-1.5" />
          <path d="M3 3l18 18" />
          <path d="M9.5 9.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.1" />
        </svg>
      )}
    </button>
  );
}
