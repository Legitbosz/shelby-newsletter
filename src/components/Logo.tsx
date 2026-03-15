'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function Logo() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme !== 'light');
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
      <img
        src={isDark ? '/shelby-news-logo-dark.svg' : '/shelby-news-logo-light.svg'}
        alt="shelby.news"
        height="52"
        style={{ display: 'block' }}
      />
    </Link>
  );
}
