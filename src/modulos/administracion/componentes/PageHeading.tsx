import { useEffect, useRef } from 'react';

/** Lleva el foco al título al navegar, también para quienes usan teclado. */
export function PageHeading({ title, description }: { title: string; description: string }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus(); }, [title]);

  return <header className="admin-page-heading">
    <h1 tabIndex={-1} ref={heading}>{title}</h1>
    <p className="admin-description">{description}</p>
  </header>;
}
