import { useState, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  id?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  'data-edition'?: string;
  fallbackTitle?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  id,
  style,
  width,
  height,
  'data-edition': dataEdition,
  fallbackTitle = 'Nostalgia Extrait',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`img-fallback ${className}`}
        id={id}
        style={style}
        role="img"
        aria-label={alt}
      >
        <Sparkles size={24} strokeWidth={1.5} aria-hidden="true" />
        <span>{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      id={id}
      style={style}
      width={width}
      height={height}
      data-edition={dataEdition}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
