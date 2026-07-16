// Stylized account icons: a man in a draa (traditional wide-sleeved
// Mauritanian robe) for male accounts, a woman in a melhfa (draped veil)
// for female accounts, and a plain silhouette before gender is set.
export function MaleDraaIcon({ size = 26, className = "" }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill="currentColor">
      <circle cx="16" cy="8" r="5" />
      <path d="M16 14c-7 0-12 5-12 12v2h7l1-7 2 7h4l2-7 1 7h7v-2c0-7-5-12-12-12z" />
    </svg>
  );
}

export function FemaleMelhfaIcon({ size = 26, className = "" }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill="currentColor">
      <path d="M16 3c-4 0-6.5 2.8-6.5 6 0 2 1 3.3 2.2 4.3C7 15.5 4 20.5 4 26v2h20v-2c0-5.5-3-10.5-7.7-12.7 1.2-1 2.2-2.3 2.2-4.3 0-3.2-2.5-6-6.5-6z" />
      <path d="M21.5 11.5c2.6 1.8 4.5 5.6 4.5 10.5v6h2v-6c0-5.3-2.2-9.3-5.3-11.6z" opacity="0.65" />
    </svg>
  );
}

export function GenericAccountIcon({ size = 26, className = "" }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill="currentColor">
      <circle cx="16" cy="10" r="6" />
      <path d="M4 28c0-6.6 5.4-12 12-12s12 5.4 12 12v1H4z" />
    </svg>
  );
}

export default function AccountIcon({ gender, size = 26, className = "" }) {
  if (gender === "male") return <MaleDraaIcon size={size} className={className} />;
  if (gender === "female") return <FemaleMelhfaIcon size={size} className={className} />;
  return <GenericAccountIcon size={size} className={className} />;
}
