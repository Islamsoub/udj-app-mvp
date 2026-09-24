'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon } from './icons';
import styles from './news.module.css';

type Phase = 'loading' | 'loaded' | 'failed';

/**
 * An article's hero image, which is an EXTERNAL URL on a host this app does not
 * control — and on a slow or lossy connection the likeliest thing on this
 * screen to go visibly wrong. Three rules, all about that:
 *
 *   • THE SPACE IS RESERVED. The frame has a fixed aspect ratio set in CSS, so
 *     it is the right height before a byte of the image arrives and the list
 *     below never reflows as images land one by one, in any order.
 *
 *   • IT IS NEVER BLANK. The frame's own background is the placeholder pattern,
 *     so a slow image shows that pattern rather than an empty box; the image
 *     fades in over it once it has decoded.
 *
 *   • A FAILURE IS A PLACEHOLDER, NOT A BROKEN-IMAGE ICON. On `error` the <img>
 *     is removed outright, leaving the pattern and a picture glyph. A null URL
 *     takes the same path without making a request.
 *
 * `alt=""`: the image illustrates, and the title beside it carries the content.
 * There is no per-image description in the data to put there.
 */
export function HeroImage({
  src,
  className,
  eager = false,
}: {
  src: string | null;
  className?: string;
  /** The reader's image is the point of the view; list images below the fold
   *  are lazy so a long list does not spend the connection on them first. */
  eager?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(src === null ? 'failed' : 'loading');
  const imgRef = useRef<HTMLImageElement | null>(null);

  /*
   * An image served from the memory cache can finish before React has attached
   * its handlers, and then neither event is seen. Reading `complete` once after
   * mount settles that case in whichever direction it went.
   */
  useEffect(() => {
    const img = imgRef.current;
    if (img === null || !img.complete) return;
    setPhase(img.naturalWidth > 0 ? 'loaded' : 'failed');
  }, []);

  return (
    <div className={`${styles.hero} ${className ?? ''}`}>
      {phase === 'failed' ? (
        <ImageIcon className={styles.heroFallbackIcon} />
      ) : (
        /*
          A plain <img>, not next/image: the hosts are external, and next/image
          would route them through an optimiser this app does not configure.
          The frame does the layout work next/image would.
        */
        <img
          ref={imgRef}
          className={`${styles.heroImg} ${phase === 'loaded' ? styles.heroImgLoaded : ''}`}
          src={src ?? undefined}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setPhase('loaded')}
          onError={() => setPhase('failed')}
        />
      )}
    </div>
  );
}
