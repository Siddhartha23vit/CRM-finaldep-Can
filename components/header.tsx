"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Settings, 
  LogOut, 
  User,
  UserCircle,
  UserCog,
  UserPlus,
  Users,
  Shield,
  Key,
  History,
  Mail,
  Home,
  FileText,
  Calendar,
  X
} from "lucide-react"
import { routes } from "@/lib/routes"

interface SearchResult {
  id: string
  type: 'lead' | 'property' | 'user' | 'document' | 'showing'
  title: string
  subtitle: string
  url: string
}

export function Header() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    // Search in localStorage for demo purposes
    // In a real app, this would be an API call
    try {
      const results: SearchResult[] = []
      
      // Search leads
      const leads = JSON.parse(localStorage.getItem('leads') || '[]')
      leads.forEach((lead: any) => {
        if (lead.name.toLowerCase().includes(query.toLowerCase()) ||
            lead.email.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: lead._id,
            type: 'lead',
            title: lead.name,
            subtitle: lead.email,
            url: routes.lead(lead._id)
          })
        }
      })

      // Search users
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      users.forEach((user: any) => {
        if (user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: user.id,
            type: 'user',
            title: user.name,
            subtitle: user.email,
            url: routes.userProfile(user.id)
          })
        }
      })

      // Add property searches
      const properties = JSON.parse(localStorage.getItem('properties') || '[]')
      properties.forEach((property: any) => {
        if (property.address.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            id: property.id,
            type: 'property',
            title: property.address,
            subtitle: `$${property.price.toLocaleString()}`,
            url: routes.property(property.id)
          })
        }
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const getSearchIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'lead': return <UserPlus className="h-4 w-4" />
      case 'property': return <Home className="h-4 w-4" />
      case 'user': return <UserCircle className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'showing': return <Calendar className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  return (
    <div className="h-16 border-b bg-white px-4 flex items-center justify-between">
      <div className="flex-1 max-w-xl" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            type="search" 
            placeholder="Search leads, properties, users..." 
            className="pl-8 bg-gray-50 border-none w-full"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
                setShowResults(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (searchResults.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <Button
                      key={`${result.type}-${result.id}`}
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 hover:bg-gray-50"
                      onClick={() => {
                        router.push(result.url)
                        setShowResults(false)
                        setSearchQuery("")
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {getSearchIcon(result.type)}
                        <div className="text-left">
                          <div className="font-medium">{result.title}</div>
                          <div className="text-sm text-gray-500">{result.subtitle}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                  alt={user?.name || 'User'}
                />
                <AvatarFallback>{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user?.name || 'User'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push(routes.settingsProfile)}>
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(routes.settingsNotifications)}>
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(routes.settingsSecurity)}>
              <Shield className="h-4 w-4 mr-2" />
              Security
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

