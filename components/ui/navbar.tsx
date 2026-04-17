'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Home, Settings, BookOpen, Sparkles, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Generate Report', href: '/generate', icon: FileText },
  { name: 'Templates', href: '/templates', icon: BookOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ReportGen
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`gap-2 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {/* Mobile menu button (optional - you can add mobile menu later) */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <span className="sr-only">Open menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}