import { BY_CODE, flagUrl } from '../data/countries';

/**
 * Renders a flag at its official proportions. During questions pass `hidden`
 * so the accessible name never reveals the country.
 */
export function Flag({ code, height, maxWidth, hidden = false, className = '', alt }: { code: string; height: number; maxWidth?: number; hidden?: boolean; className?: string; alt?: string }) {
  const c = BY_CODE[code];
  let h = height;
  let w = h * c.ratio;
  if (maxWidth && w > maxWidth) {
    w = maxWidth;
    h = w / c.ratio;
  }
  const pennant = c.ratio < 1 && code === 'NPL';
  return (
    <img
      src={flagUrl(c)}
      alt={hidden ? alt ?? 'Flag to identify' : alt ?? `Flag of ${c.name}`}
      width={Math.round(w)}
      height={Math.round(h)}
      draggable={false}
      decoding="async"
      className={`flag-frame select-none ${pennant ? 'pennant' : 'rounded-[3px]'} ${className}`}
      style={{ width: w, height: h, objectFit: 'contain' }}
    />
  );
}

/** Responsive flag for the question stage: fills the stage while keeping proportions. */
export function StageFlag({ code, className = '' }: { code: string; className?: string }) {
  const c = BY_CODE[code];
  const pennant = code === 'NPL';
  return (
    <div className={`stage rounded-3xl grid place-items-center px-4 py-6 sm:py-10 ${className}`}>
      <img
        key={code}
        src={flagUrl(c)}
        alt="Flag to identify"
        draggable={false}
        className={`flag-frame anim-rise select-none ${pennant ? 'pennant' : 'rounded-[4px]'}`}
        style={{ aspectRatio: String(c.ratio), height: 'auto', width: `min(100%, ${Math.round(c.ratio * 34)}vh, ${Math.round(c.ratio * 300)}px)`, objectFit: 'contain' }}
      />
    </div>
  );
}
