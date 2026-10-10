'use client';

import React from 'react';

interface RemoteImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: string; // e.g. "16/9" or "1/1"
  fallbackText?: string;
}

/**
 * Remote image rendered with a plain <img> (not next/image) so arbitrary
 * domains work. Lazy-loaded, no-referrer, fixed aspect ratio, error fallback.
 */
export function RemoteImage({
  src,
  alt,
  aspectRatio = '16/9',
  fallbackText = 'Image unavailable',
  className,
  ...props
}: RemoteImageProps) {
  const [errored, setErrored] = React.useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground text-sm rounded-[var(--radius-md)] ${className ?? ''}`}
        style={{ aspectRatio }}
      >
        <span>{fallbackText} — </span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline ml-1"
        >
          open link ↗
        </a>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[var(--radius-md)] ${className ?? ''}`} style={{ aspectRatio }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className="w-full h-full object-cover"
        {...props}
      />
    </div>
  );
}

