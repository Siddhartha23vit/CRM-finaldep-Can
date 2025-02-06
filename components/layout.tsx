'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BellIcon, 
  Search, 
  X,
  LayoutDashboard,
  Users,
  Heart,
  Mail,
  Home,
  Calendar,
  Settings,
  LogOut
} from "lucide-react";
import { LanguageSelector } from './language-selector';
import { UserProfile } from './user-profile';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { dataService, type SearchResult } from '@/lib/data-service';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

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

  const handleLogout = () => {
    // Clear all auth data
    localStorage.clear();
    // Clear the auth cookie
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Redirect to home page
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-red-500">
            Get Home Realty
          </Link>
        </div>
        <nav className="space-y-1 p-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/dashboard' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/lead"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/lead' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <Users className="h-5 w-5" />
            Lead
          </Link>
          {user.permissions.favorites && (
            <Link
              href="/favorites"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
                pathname === '/favorites' ? "bg-gray-100 text-gray-900" : ""
              )}
            >
              <Heart className="h-5 w-5" />
              Favorites
            </Link>
          )}
          <Link
            href="/inbox"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/inbox' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <Mail className="h-5 w-5" />
            Inbox
          </Link>
          <Link
            href="/inventory"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/inventory' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <Home className="h-5 w-5" />
            Inventory
          </Link>
          <Link
            href="/users"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/users' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <Users className="h-5 w-5" />
            Users
          </Link>
          <Link
            href="/calendar"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/calendar' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <Calendar className="h-5 w-5" />
            Calendar
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900",
              pathname === '/settings' ? "bg-gray-100 text-gray-900" : ""
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-red-500 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search events, properties..."
                className="w-[300px] pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {/* Search Results Dropdown */}
              {isSearching && searchResults.length > 0 && (
                <Card className="absolute top-full left-0 w-[400px] mt-2 shadow-lg">
                  <CardContent className="p-2">
                    {searchResults.map((result) => (
                      <Button
                        key={`${result.type}-${result.id}`}
                        variant="ghost"
                        className="w-full justify-start text-left px-2 py-1.5"
                        onClick={() => handleResultClick(result)}
                      >
                        <div>
                          <div className="font-medium">{result.title}</div>
                          <div className="text-sm text-gray-500">{result.subtitle}</div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
              {isSearching && searchResults.length === 0 && searchQuery && (
                <Card className="absolute top-full left-0 w-[400px] mt-2 shadow-lg">
                  <CardContent className="p-4 text-center text-gray-500">
                    No results found
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <LanguageSelector />
            <UserProfile 
              username={user.name} 
              role={user.role}
              className="text-gray-900"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

