import { useEffect, useState } from 'react';

type AssetImageProps = {
  sources: string[];
  alt: string;
  width: number;
  height: number;
  borderRadius: number;
  border?: string;
  placeholderLabel?: string;
};

export function AssetImage({
  sources,
  alt,
  width,
  height,
  borderRadius,
  border = 'none',
  placeholderLabel = 'N/A',
}: AssetImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources]);

  if (sources.length === 0 || sourceIndex >= sources.length) {
    return (
      <div
        aria-label={`${alt} placeholder`}
        title={`${alt} unavailable`}
        style={{
          width,
          height,
          borderRadius,
          border,
          background: '#2a2a2a',
          color: '#aaa',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {placeholderLabel}
      </div>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      title={alt}
      width={width}
      height={height}
      style={{
        width,
        height,
        borderRadius,
        border,
        objectFit: 'cover',
        background: '#1f1f1f',
      }}
      onError={() => setSourceIndex((previous) => previous + 1)}
    />
  );
}
