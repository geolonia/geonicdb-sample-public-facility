import { SPRITE_SHEET_URL, SPRITE_COORDS } from '../../types/public-facility';

/** Sprite sheet total dimensions (from sprite.json bounding box) */
const SHEET_W = 1126;
const SHEET_H = 1011;

interface SpriteIconProps {
  /** Sprite icon name from geolonia/custom-smartmap-sprite */
  spriteIcon: string;
  /** Display size in px (height; width is auto-scaled from 75:90 ratio) */
  size?: number;
  className?: string;
}

/**
 * Renders an icon from the custom-smartmap-sprite sprite sheet
 * using CSS background-position clipping.
 */
export function SpriteIcon({ spriteIcon, size = 20, className }: SpriteIconProps) {
  const coords = SPRITE_COORDS[spriteIcon];
  if (!coords) return null;

  const scale = size / coords.h;
  const displayW = Math.round(coords.w * scale);

  return (
    <span
      className={className}
      role="img"
      aria-hidden
      style={{
        display: 'inline-block',
        width: displayW,
        height: size,
        backgroundImage: `url(${SPRITE_SHEET_URL})`,
        backgroundPosition: `-${coords.x * scale}px -${coords.y * scale}px`,
        backgroundSize: `${SHEET_W * scale}px ${SHEET_H * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
