// Account avatar: Mauritanian man in a daraa for male accounts, woman in a
// melhfa for female accounts (custom illustrated SVGs in /public/avatars),
// and a neutral silhouette before gender is chosen.
export function GenericAccountIcon({ size = 26, className = "" }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill="currentColor">
      <circle cx="16" cy="10" r="6" />
      <path d="M4 28c0-6.6 5.4-12 12-12s12 5.4 12 12v1H4z" />
    </svg>
  );
}

export default function AccountIcon({ gender, size = 26, className = "" }) {
  if (gender === "male") {
    return (
      <img
        src="/avatars/man-daraa.svg"
        width={size}
        height={size}
        alt="account"
        className={`rounded-full ${className}`}
      />
    );
  }
  if (gender === "female") {
    return (
      <img
        src="/avatars/woman-melhfa.svg"
        width={size}
        height={size}
        alt="account"
        className={`rounded-full ${className}`}
      />
    );
  }
  return <GenericAccountIcon size={size} className={className} />;
}
