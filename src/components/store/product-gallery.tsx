'use client';

import { useState } from 'react';
import { ProductImage } from '@/components/store/product-utils';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
        <ProductImage src={current} alt={name} sizes="(min-width: 1024px) 32rem, 90vw" priority className="p-8" />
      </div>
      {images.length > 1 ? (
        <ul className="flex gap-3 overflow-x-auto">
          {images.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${name} ${index + 1}`}
                aria-current={index === active}
                className={cn(
                  'relative size-16 overflow-hidden rounded-xl border bg-white',
                  index === active ? 'border-[var(--accent)]' : 'border-[var(--border)]',
                )}
              >
                <ProductImage src={src} alt="" sizes="64px" className="p-2" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
