'use client';

import { Navbar, NavbarContent, NavbarItem, Link } from '@nextui-org/react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'audio', href: '/audio' },
    { name: 'form', href: '/form' },
    { name: 'stock', href: '/stock' },
  ];

  return (
    <Navbar className="border-none relative top-[14.5vh] -mt-16">
      <NavbarContent className="w-full" justify="center">
        <div className="w-[295px] h-[35px] flex items-center justify-center rounded-large bg-gradient-to-r from-[#FF1CF7] to-[#00F0FF] p-[1.5px]">
          <div className="w-full h-full bg-black rounded-large flex items-center justify-around px-4">
            {navItems.map((item, index) => (
              <NavbarItem
                key={item.href}
                isActive={pathname === item.href}
                className={index > 0 ? 'border-l-2 border-gray-600 -my-[1.5px]' : ''}
              >
                <Link
                  color={pathname === item.href ? 'primary' : 'foreground'}
                  href={item.href}
                  className="text-xs px-4"
                >
                  {item.name}
                </Link>
              </NavbarItem>
            ))}
          </div>
        </div>
      </NavbarContent>
    </Navbar>
  );
}
