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
  LogOut,
  Menu,
  ChevronLeft,
  Building
} from "lucide-react";
import { LanguageSelector } from './language-selector';
import { UserProfile } from './user-profile';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { dataService, type SearchResult } from '@/lib/data-service';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ProfileSettings } from './profile-settings';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
  }, [router]);

  const navigationItems = [
    { href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { href: '/lead', icon: <Users className="h-5 w-5" />, label: 'Lead' },
    ...(user?.permissions?.favorites ? [{
      href: '/favorites',
      icon: <Heart className="h-5 w-5" />,
      label: 'Favorites'
    }] : []),
    { href: '/inbox', icon: <Mail className="h-5 w-5" />, label: 'Inbox' },
    { href: '/inventory', icon: <Home className="h-5 w-5" />, label: 'Inventory' },
    { href: '/users', icon: <Users className="h-5 w-5" />, label: 'Users' },
    { href: '/mls', icon: <Building className="h-5 w-5" />, label: 'MLS' },
    { href: '/calendar', icon: <Calendar className="h-5 w-5" />, label: 'Calendar' },
    { href: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];

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
    setIsMobileSearchOpen(false);
  };

  const handleLogout = () => {
    // Only remove auth-related items
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: avatarUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update avatar');
      }

      // Update local storage with new avatar
      const updatedUser = { ...user, avatar: avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b w-full">
        <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 -ml-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            <Link href="/dashboard" className="font-semibold text-red-500 truncate text-sm sm:text-base">
            Get Home Realty
          </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSearchOpen(true)}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 relative"
              >
                <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="border-b safe-top">
            <div className="flex items-center gap-2 p-3 sm:p-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 -ml-1"
                onClick={() => setIsMobileSearchOpen(false)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full pl-9 h-9 sm:h-10 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 safe-bottom">
            {isSearching && searchResults.map((result) => (
              <Button
                key={`${result.type}-${result.id}`}
                variant="ghost"
                className="w-full justify-start text-left mb-2 h-auto py-2 px-3"
                onClick={() => handleResultClick(result)}
              >
                <div className="w-full min-w-0">
                  <div className="font-medium truncate text-sm sm:text-base">{result.title}</div>
                  <div className="text-xs sm:text-sm text-gray-500 truncate">{result.subtitle}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex relative lg:h-[calc(100vh-0px)]">
        {/* Sidebar */}
        <aside
              className={cn(
            "fixed inset-y-0 left-0 z-40 w-[240px] sm:w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static safe-top safe-bottom",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
          <div className="flex h-14 sm:h-16 items-center border-b px-4">
            <Link href="/dashboard" className="font-semibold text-red-500 text-sm sm:text-base">
              Get Home Realty
            </Link>
          </div>
          <nav className="flex flex-col h-[calc(100%-3.5rem)] sm:h-[calc(100%-4rem)] p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-1">
              {navigationItems.map((item) => (
          <Link
                  key={item.href}
                  href={item.href}
            className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-colors hover:text-gray-900 text-sm sm:text-base",
                    pathname === item.href ? "bg-gray-100 text-gray-900" : ""
            )}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    router.push(item.href);
                  }}
          >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
          </Link>
              ))}
            </div>
            <div className="flex-1" />
          <Button
            variant="ghost"
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 text-gray-500 hover:text-red-500 text-sm sm:text-base justify-start h-auto py-2"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Logout</span>
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0 w-full">
          {/* Desktop Header */}
          <header className="hidden lg:flex h-14 sm:h-16 items-center justify-between border-b bg-white px-4 sm:px-6 sticky top-0 z-30">
            <div className="flex-1 flex items-center gap-4 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                  placeholder="Search..."
                  className="w-full pl-9 pr-9 h-9 sm:h-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isSearching && searchResults.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 mt-1 shadow-lg">
                    <CardContent className="p-1 sm:p-2 max-h-[60vh] overflow-y-auto">
                    {searchResults.map((result) => (
                      <Button
                        key={`${result.type}-${result.id}`}
                        variant="ghost"
                          className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => handleResultClick(result)}
                      >
                          <div className="w-full min-w-0">
                            <div className="font-medium truncate">{result.title}</div>
                            <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 ml-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 relative">
                <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Button>
            <LanguageSelector />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 safe-bottom">
            <div className="container mx-auto max-w-7xl">
          {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Profile Settings Dialog */}
      {user && (
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <ProfileSettings
              user={user}
              onUpdateAvatar={handleUpdateAvatar}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

