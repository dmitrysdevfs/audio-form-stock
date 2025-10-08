'use client';

import { Navbar, NavbarContent, NavbarItem, Link } from '@nextui-org/react';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [textColors, setTextColors] = useState<Record<string, string>>({});

  const navItems = useMemo(
    () => [
      { name: 'audio', href: '/audio' },
      { name: 'form', href: '/form' },
      { name: 'stock', href: '/stock' },
    ],
    []
  );

  // Function to calculate gradient color
  const getGradientColor = (position: number) => {
    const startColor = { r: 255, g: 28, b: 247 };
    const endColor = { r: 0, g: 240, b: 255 };

    const r = Math.round(startColor.r + (endColor.r - startColor.r) * position);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * position);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * position);

    return `rgb(${r}, ${g}, ${b})`;
  };

  useLayoutEffect(() => {
    const updateColors = () => {
      const container = containerRef.current;
      if (!container) return;

      const newColors: Record<string, string> = {};

      navItems.forEach((item, index) => {
        const linkElement = container.querySelector(`a[href="${item.href}"]`);
        if (linkElement) {
          // Add small offset based on index to ensure different colors
          const elementRect = linkElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeX = (elementRect.left - containerRect.left) / containerRect.width;
          const offset = index * 0.1; // Small offset for each button
          const position = Math.max(0.1, Math.min(0.9, relativeX + offset));

          newColors[item.href] = getGradientColor(position);
        }
      });

      setTextColors(newColors);
    };

    updateColors();

    const resizeObserver = new ResizeObserver(() => {
      updateColors();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [pathname, navItems]);

  if (pathname === '/') return null;

  const getRoundedClass = (index: number, length: number) => {
    if (index === 0) return 'rounded-l-large';
    if (index === length - 1) return 'rounded-r-large';
    return 'rounded-none';
  };

  const getEdgeMargin = (index: number, length: number) => {
    if (index === 0) return 'ml-[-13px]'; // left edge
    if (index === length - 1) return 'mr-[-13px]'; // right edge
    return '';
  };

  return (
    <Navbar className="border-none relative top-[14.5vh] -mt-16">
      <NavbarContent className="w-full" justify="center">
        <div
          ref={containerRef}
          className="w-[319px] h-[38px] flex items-center justify-center rounded-large bg-gradient-to-r from-[#FF1CF7] to-[#00F0FF]"
        >
          <div className="w-full h-full bg-transparent rounded-large flex items-center justify-between px-4">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const roundedClass = getRoundedClass(index, navItems.length);

              return (
                <NavbarItem key={item.href} isActive={isActive}>
                  <Link
                    color={isActive ? 'primary' : 'foreground'}
                    href={item.href}
                    className={`text-xs px-9 py-[8px] bg-black ${roundedClass} ${getEdgeMargin(index, navItems.length)}`}
                  >
                    {isActive ? (
                      <span
                        className="text-white transition-colors duration-300"
                        style={{ color: textColors[item.href] ?? 'white' }}
                      >
                        {item.name}
                      </span>
                    ) : (
                      <span className="hover:text-white transition-colors duration-300">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </NavbarItem>
              );
            })}
          </div>
        </div>
      </NavbarContent>
    </Navbar>
  );
}
