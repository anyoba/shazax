export default function BrandLogo({ className = 'h-10 w-10', alt = 'Shazax' }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-transparent ${className}`}>
      <img
        src="/he.png"
        alt={alt}
        className="h-full w-full object-contain mix-blend-screen"
      />
    </span>
  );
}
