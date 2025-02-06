"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CallHistory } from "@/components/call-history"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, Home, Calendar, ClipboardList, PlusCircle, Plus, Upload, Info, History } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StrategyPlanner } from "@/components/strategy-planner"
import { format } from "date-fns"
import { Lead } from "@/lib/types"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { parseExcelLeads } from "@/lib/excel-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TaskManager } from "@/components/task-manager"

interface Task {
  id: string
  date: Date
  task: string
}

interface Lead {
  _id: string
  name: string
  email: string
  phone: string
  status: string
  property: string
  date: string
  notes: string
  callHistory: Array<{
    date: string
    duration: number
    recording: string
  }>
  strategy?: {
    lastUpdated: string
    tasks: Task[]
    notes: string
  }
}

export function LeadListing() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState("All")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const router = useRouter()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Separate mounting and data fetching
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchLeads()
      
      // Listen for storage changes
      const handleStorageChange = () => {
        const updatedLeads = JSON.parse(localStorage.getItem('leads') || '[]')
        setLeads(updatedLeads)
      }

      window.addEventListener('storage', handleStorageChange)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [mounted])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      
      // Fetch leads from MongoDB
      const response = await fetch("/api/leads")
      if (!response.ok) {
        throw new Error("Failed to fetch leads")
      }
      
      const leads = await response.json()
      
      // Update both state and localStorage
      setLeads(leads)
      localStorage.setItem('leads', JSON.stringify(leads))
      
    } catch (error) {
      console.error("Fetch leads error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch leads. Please try again.",
      })
      
      // Fallback to localStorage if API fails
      const storedLeads = JSON.parse(localStorage.getItem('leads') || '[]')
      setLeads(storedLeads)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Success",
        description: "Lead status updated successfully",
      })
      fetchLeads()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lead status",
      })
    }
  }

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed: "bg-gray-100 text-gray-800"
    }
    return colors[status]
  }

  const handleCall = async (leadId: string, phoneNumber: string) => {
    try {
      const response = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, phoneNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate call")
      }

      toast({
        title: "Call Initiated",
        description: "Connecting your call...",
      })
      
      // Refresh leads to show updated call history
      fetchLeads()
    } catch (error) {
      console.error("Call error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate call. Please try again.",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Parse Excel file
      const importedLeads = await parseExcelLeads(file);
      
      // Save to MongoDB
      const response = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: importedLeads }),
      });

      if (!response.ok) {
        throw new Error("Failed to save leads to database");
      }

      // Get existing leads from localStorage
      const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
      
      // Merge new leads with existing ones
      const updatedLeads = [...existingLeads, ...importedLeads];
      
      // Save to localStorage
      localStorage.setItem('leads', JSON.stringify(updatedLeads));
      
      // Refresh leads display
      fetchLeads();
      
      toast({
        title: "Success",
        description: `${importedLeads.length} leads imported successfully`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Failed to import leads. Please check the file format and try again.",
      });
    } finally {
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleTaskUpdate = async (leadId: string, tasks: Task[]) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks })
      });

      if (!response.ok) {
        throw new Error("Failed to update tasks");
      }

      // Update local state
      setLeads(leads.map(lead => 
        lead._id === leadId ? { ...lead, tasks } : lead
      ));

      toast({
        title: "Success",
        description: "Tasks updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tasks",
      });
    }
  };

  // Only render table content after mounting
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Leads</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody />
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Leads</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
            </div>
            <Button onClick={() => document.getElementById('addLeadDialog')?.showModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead._id}>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal text-black hover:text-gray-700"
                    onClick={() => router.push(`/lead/${lead._id}`)}
                  >
                    {lead.name}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-black">
                    <div>{lead.email}</div>
                    <div className="text-gray-600">{lead.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status as Lead['status'])}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.property}</TableCell>
                <TableCell>
                  {formatDate(lead.date)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-black text-black hover:bg-black hover:text-white" 
                        onClick={() => handleCall(lead._id, lead.phone)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-black text-black hover:bg-black hover:text-white"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const leadId = typeof lead._id === 'object' ? lead._id.toString() : lead._id
                                router.push(`/lead/${leadId}`)
                              }}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View full details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-black text-black hover:bg-black hover:text-white w-full"
                      onClick={() => setIsHistoryOpen(true)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Call History
                    </Button>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-gray-600">
                        Tasks: {lead.tasks?.length || 0}
                        {lead.tasks?.length > 0 && (
                          <span className="ml-2 text-gray-500">
                            ({lead.tasks.filter(t => t.status === 'pending').length} pending)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

