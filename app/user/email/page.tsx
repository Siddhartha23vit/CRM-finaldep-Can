"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Star, Trash2, Search, Filter, RefreshCcw } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"

interface Email {
  _id: string
  subject: string
  from: string
  to: string
  body: string
  date: string
  status: 'read' | 'unread'
  folder: string
  starred: boolean
  attachments: string[]
  createdAt: string
  updatedAt: string
}

const defaultEmail = {
  subject: "",
  to: "",
  body: "",
  attachments: [],
}

const emailFolders = [
  { value: "inbox", label: "Inbox" },
  { value: "sent", label: "Sent" },
  { value: "drafts", label: "Drafts" },
  { value: "trash", label: "Trash" },
]

// Add motion table row
const MotionTableRow = motion(TableRow)

export default function EmailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [emails, setEmails] = useState<Email[]>([])
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false)
  const [formData, setFormData] = useState(defaultEmail)
  const [selectedFolder, setSelectedFolder] = useState("inbox")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEmails()
  }, [selectedFolder])

  const fetchEmails = async () => {
    try {
      const response = await fetch(`/api/emails?folder=${selectedFolder}`)
      const data = await response.json()
      setEmails(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching emails:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch emails",
      })
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: "Email sent successfully",
      })

      setIsComposeDialogOpen(false)
      setFormData(defaultEmail)
      fetchEmails()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send email",
      })
    }
  }

  const handleDelete = async (email: Email) => {
    try {
      const response = await fetch(`/api/emails/${email._id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Success",
        description: "Email moved to trash",
      })

      fetchEmails()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete email",
      })
    }
  }

  const handleStar = async (email: Email) => {
    try {
      const response = await fetch(`/api/emails/${email._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !email.starred }),
      })

      if (!response.ok) throw new Error()

      fetchEmails()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update email",
      })
    }
  }

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.to.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Email</h1>
        <Button 
          onClick={() => {
            setFormData(defaultEmail)
            setIsComposeDialogOpen(true)
          }}
          className="bg-red-500 hover:bg-red-600"
        >
          <Mail className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>
        </div>
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-gray-100">
            <SelectValue placeholder="Select folder" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {emailFolders.map((folder) => (
              <SelectItem key={folder.value} value={folder.value}>
                {folder.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={fetchEmails}
          className="border-gray-600 hover:bg-gray-700"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">
            {emailFolders.find(f => f.value === selectedFolder)?.label || "Emails"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="w-[30px] text-gray-400"></TableHead>
                <TableHead className="text-gray-400">Subject</TableHead>
                <TableHead className="text-gray-400">From</TableHead>
                <TableHead className="text-gray-400">To</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.length === 0 ? (
                <MotionTableRow
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TableCell 
                    colSpan={6} 
                    className="text-center text-gray-400 py-4"
                  >
                    No emails found
                  </TableCell>
                </MotionTableRow>
              ) : (
                filteredEmails.map((email, index) => (
                  <MotionTableRow 
                    key={email._id}
                    className="border-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStar(email)}
                        className={`h-8 w-8 p-0 ${email.starred ? 'text-yellow-400' : 'text-gray-400'}`}
                      >
                        <Star className="h-4 w-4" fill={email.starred ? "currentColor" : "none"} />
                      </Button>
                    </TableCell>
                    <TableCell className={`font-medium ${email.status === 'unread' ? 'text-gray-100' : 'text-gray-400'}`}>
                      {email.subject}
                    </TableCell>
                    <TableCell className="text-gray-300">{email.from}</TableCell>
                    <TableCell className="text-gray-300">{email.to}</TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(email.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(email)}
                        className="h-8 w-8 p-0 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </MotionTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                required
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
                className="bg-gray-700 border-gray-600"
                rows={8}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsComposeDialogOpen(false)}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-red-500 hover:bg-red-600">
                Send Email
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 