'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellIcon, Search, X, Heart } from "lucide-react";
import { UserProfile } from '@/components/user-profile';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { dataService, type SearchResult } from '@/lib/data-service';
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Mail,
  Package,
  Settings,
  LogOut,
} from "lucide-react";
import { NotificationsPopover } from "@/components/notifications-popover"

interface UserLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Leads", href: "/user/leads", icon: Users, permission: "leads" },
  { name: "Calendar", href: "/user/calendar", icon: Calendar, permission: "calendar" },
  { name: "Email", href: "/user/email", icon: Mail, permission: "email" },
  { name: "Inventory", href: "/user/inventory", icon: Package, permission: "inventory" },
  { name: "Settings", href: "/user/settings", icon: Settings, permission: "settings" },
  { name: "Favorites", href: "/user/favorites", icon: Heart, permission: "favorites" },
];

export default function UserLayout({ children }: UserLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserPermissions(parsedUser.permissions);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = dataService.search(query);
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.link);
    clearSearch();
  };

  if (!user || !userPermissions || !isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-gray-100">Loading...</div>
      </div>
    )
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="user-theme-preference"
    >
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Sidebar */}
          <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
            {/* Sidebar component */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 ring-1 ring-white/5">
              <div className="flex h-16 shrink-0 items-center">
                <Link href="/user/dashboard" className="flex items-center">
                  <span className="text-2xl font-bold text-red-500">GetHome</span>
                  <span className="ml-2 text-xl font-semibold text-gray-200">Realty</span>
                </Link>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => {
                        // Check if user has permission for this item
                        if (!userPermissions[item.permission]) return null;

                        const isActive = pathname === item.href;
                        return (
                          <motion.li key={item.name} whileHover={{ x: 4 }}>
                            <Link
                              href={item.href}
                              className={`
                                group flex gap-x-3 rounded-md p-2 text-sm leading-6
                                ${isActive
                                  ? "bg-gray-700 text-red-500"
                                  : "text-gray-400 hover:text-red-500 hover:bg-gray-700"
                                }
                              `}
                            >
                              <item.icon
                                className={`h-6 w-6 shrink-0 ${
                                  isActive ? "text-red-500" : "text-gray-400 group-hover:text-red-500"
                                }`}
                                aria-hidden="true"
                              />
                              {item.name}
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <div className="flex items-center justify-between">
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-700 hover:text-red-500"
                        onClick={() => {
                          // Clear all auth data
                          localStorage.clear();
                          // Clear the auth cookie
                          document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                          // Redirect to home page
                          router.push('/');
                        }}
                      >
                        <LogOut
                          className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-500"
                          aria-hidden="true"
                        />
                        Logout
                      </Button>
                    </div>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="pl-72 w-full">
            {/* Top Navigation */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-800/95 backdrop-blur px-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-[300px] pl-8 bg-gray-700/50 border-gray-600 text-gray-100 focus:bg-gray-700"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-gray-100"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {/* Search Results Dropdown */}
                  {isSearching && searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 w-[400px] mt-2 bg-gray-800 border-gray-700">
                      <CardContent className="p-2">
                        {searchResults.map((result) => (
                          <Button
                            key={`${result.type}-${result.id}`}
                            variant="ghost"
                            className="w-full justify-start text-left px-2 py-1.5 text-gray-100 hover:bg-gray-700"
                            onClick={() => handleResultClick(result)}
                          >
                            <div>
                              <div className="font-medium">{result.title}</div>
                              <div className="text-sm text-gray-400">{result.subtitle}</div>
                            </div>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationsPopover />
                <UserProfile 
                  username={user.name} 
                  role={user.role}
                  className="text-gray-100"
                />
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
} 