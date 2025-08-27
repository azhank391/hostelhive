'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { MenuIcon, XIcon } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-[#3B82F6] font-bold text-2xl">
              Hostel<span className="text-[#10B981]">Hive</span>
            </span>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-[#6B7280] hover:text-[#3B82F6] font-medium">
            Home
          </Link>
          <a href="#features" className="text-[#6B7280] hover:text-[#3B82F6] font-medium">
            Features
          </a>
          <a href="#pricing" className="text-[#6B7280] hover:text-[#3B82F6] font-medium">
            Pricing
          </a>
          <a href="#" className="text-[#6B7280] hover:text-[#3B82F6] font-medium">
            About
          </a>
          <a href="#" className="text-[#6B7280] hover:text-[#3B82F6] font-medium">
            Contact
          </a>
          <a href="#" className="text-[#6B7280] hover:text-[#3B82F6] font-medium">
            Blog
          </a>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/auth/register-owner">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
        {/* Mobile menu button */}
        <button className="md:hidden text-[#6B7280] hover:text-[#3B82F6]" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-[#6B7280] hover:text-[#3B82F6] font-medium py-2">
                Home
              </Link>
              <a href="#features" className="text-[#6B7280] hover:text-[#3B82F6] font-medium py-2">
                Features
              </a>
              <a href="#pricing" className="text-[#6B7280] hover:text-[#3B82F6] font-medium py-2">
                Pricing
              </a>
              <a href="#" className="text-[#6B7280] hover:text-[#3B82F6] font-medium py-2">
                About
              </a>
              <a href="#" className="text-[#6B7280] hover:text-[#3B82F6] font-medium py-2">
                Contact
              </a>
              <a href="#" className="text-[#6B7280] hover:text-[#3B82F6] font-medium py-2">
                Blog
              </a>
              <div className="flex flex-col space-y-3 pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register-owner">
                  <Button fullWidth>Get Started</Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}