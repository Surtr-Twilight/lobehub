/**
 * Image component - plain <img> replacement for next/image.
 * Strips Next.js-specific optimisation props and renders a standard <img>.
 *
 * @see Phase 4.3
 */

import { type CSSProperties, type ImgHTMLAttributes, forwardRef } from 'react';

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  blurDataURL?: string;
  fill?: boolean;
  loader?: unknown;
  placeholder?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  unoptimized?: boolean;
}

export type StaticImageData = {
  blurDataURL?: string;
  blurHeight?: number;
  blurWidth?: number;
  height: number;
  src: string;
  width: number;
};

const fillStyle: CSSProperties = {
  height: '100%',
  inset: 0,
  objectFit: 'cover',
  position: 'absolute',
  width: '100%',
};

const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      fill,
      loader: _loader,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      priority: _priority,
      quality: _quality,
      sizes: _sizes,
      unoptimized: _unoptimized,
      style,
      ...rest
    },
    ref,
  ) => {
    const mergedStyle = fill ? { ...fillStyle, ...style } : style;

    return <img ref={ref} style={mergedStyle} {...rest} />;
  },
);

Image.displayName = 'Image';

export default Image;
