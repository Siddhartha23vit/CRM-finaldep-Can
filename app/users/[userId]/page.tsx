"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, UserCog, Key, Shield, History, UserCircle, Mail } from "lucide-react"
import type { User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { routes } from "@/lib/routes"

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)

  useEffect(() => {
    // Load user data from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find((u: User) => u.id === params.userId)
    if (user) {
      setUserData(user)
    } else {
      router.push('/users')
    }
  }, [params.userId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Update user in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const updatedUsers = users.map((user: User) => 
        user.id === userData?.id ? userData : user
      )
      localStorage.setItem('users', JSON.stringify(updatedUsers))

      toast({
        title: "Success",
        description: "User updated successfully.",
      })

      router.push('/users')
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!userData) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
            <h1 className="text-2xl font-semibold">Edit User</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <UserCog className="h-4 w-4 mr-2" />
                  User Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(routes.userPermissions(userData.id))}>
                  <Shield className="h-4 w-4 mr-2" />
                  Permissions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(routes.userSecurity(userData.id))}>
                  <Key className="h-4 w-4 mr-2" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(routes.userActivity(userData.id))}>
                  <History className="h-4 w-4 mr-2" />
                  Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`mailto:${userData.email}`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-gray-100">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData?.email || userData?.username || 'default'}`}
                  alt={userData?.name || 'User'}
                />
                <AvatarFallback className="bg-red-100 text-red-600 font-medium">
                  {userData?.name?.split(' ').map(n => n[0]?.toUpperCase()).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{userData.name}</CardTitle>
                <p className="text-sm text-gray-500">{userData.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name"
                  required
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  required
                  value={userData.username}
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={userData.role}
                  onValueChange={(value) => setUserData({ ...userData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 