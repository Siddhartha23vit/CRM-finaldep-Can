"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CallHistory } from "@/components/call-history"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, Home, Calendar, ClipboardList, PlusCircle, Plus, Upload, Info, History, Search, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StrategyPlanner } from "@/components/strategy-planner"
import { format } from "date-fns"
import type { Lead, Task } from "@/lib/types"
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
import { LeadForm } from "@/components/lead-form"
import { Label } from "@/components/ui/label"

const leadStatuses = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
  { value: 'mild', label: 'Mild' },
];

const leadResponses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'not answering', label: 'Not Answering' },
  { value: 'not actively answering', label: 'Not Actively Answering' },
  { value: 'always responding', label: 'Always Responding' },
];

const leadSources = [
  { value: 'google ads', label: 'Google Ads' },
  { value: 'meta', label: 'Meta' },
  { value: 'refferal', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
];

const leadTypes = [
  { value: 'Pre construction', label: 'Pre Construction' },
  { value: 'resale', label: 'Resale' },
  { value: 'seller', label: 'Seller' },
  { value: 'buyer', label: 'Buyer' },
];

const clientTypes = [
  { value: 'Investor', label: 'Investor' },
  { value: 'custom buyer', label: 'Custom Buyer' },
  { value: 'first home buyer', label: 'First Home Buyer' },
  { value: 'seasonal investor', label: 'Seasonal Investor' },
  { value: 'commercial buyer', label: 'Commercial Buyer' },
];

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
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([])
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    leadStatus: "",
    leadType: "",
    leadSource: "",
    leadResponse: "",
    clientType: "",
  })
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchLeads()
    fetchUsers()
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id === userId)
    return user ? user.name : 'Unassigned'
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

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-purple-100 text-purple-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed: "bg-gray-100 text-gray-800"
    }
    return statusColors[status] || statusColors.new
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

  const getLeadStatusColor = (status: Lead['leadStatus']) => {
    const colors = {
      cold: "bg-blue-100 text-blue-800",
      warm: "bg-yellow-100 text-yellow-800",
      hot: "bg-red-100 text-red-800",
      mild: "bg-green-100 text-green-800"
    }
    return colors[status] || colors.cold;
  }

  const getLeadTypeColor = (type: Lead['leadType']) => {
    const colors = {
      'Pre construction': "bg-purple-100 text-purple-800",
      'resale': "bg-indigo-100 text-indigo-800",
      'seller': "bg-pink-100 text-pink-800",
      'buyer': "bg-orange-100 text-orange-800"
    }
    return colors[type] || "bg-gray-100 text-gray-800";
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === "" || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.property?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilters = 
      (filters.leadStatus === "" || lead.leadStatus === filters.leadStatus) &&
      (filters.leadType === "" || lead.leadType === filters.leadType) &&
      (filters.leadSource === "" || lead.leadSource === filters.leadSource) &&
      (filters.leadResponse === "" || lead.leadResponse === filters.leadResponse) &&
      (filters.clientType === "" || lead.clientType === filters.clientType)

    return matchesSearch && matchesFilters
  })

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
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Assigned To</TableHead>
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
          <CardTitle>Lead Management</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => document.getElementById('fileInput')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Leads
            </Button>
              <input
                type="file"
              id="fileInput"
              className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
            />
            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <LeadForm open={isAddLeadOpen} onClose={() => setIsAddLeadOpen(false)} />
            </Dialog>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Leads</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Lead Status</Label>
                    <Select
                      value={filters.leadStatus}
                      onValueChange={(value) => setFilters({ ...filters, leadStatus: value === "all" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Lead Type</Label>
                    <Select
                      value={filters.leadType}
                      onValueChange={(value) => setFilters({ ...filters, leadType: value === "all" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {leadTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Lead Source</Label>
                    <Select
                      value={filters.leadSource}
                      onValueChange={(value) => setFilters({ ...filters, leadSource: value === "all" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {leadSources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Lead Response</Label>
                    <Select
                      value={filters.leadResponse}
                      onValueChange={(value) => setFilters({ ...filters, leadResponse: value === "all" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select response" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {leadResponses.map((response) => (
                          <SelectItem key={response.value} value={response.value}>
                            {response.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Client Type</Label>
                    <Select
                      value={filters.clientType}
                      onValueChange={(value) => setFilters({ ...filters, clientType: value === "all" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {clientTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters({
                          leadStatus: "",
                          leadType: "",
                          leadSource: "",
                          leadResponse: "",
                          clientType: "",
                        })
                      }}
                    >
                      Reset
                    </Button>
                    <Button onClick={() => setIsFilterDialogOpen(false)}>
                      Apply Filters
            </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
              <TableHead>Type</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
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
                  <Badge className={getLeadStatusColor(lead.leadStatus || 'cold')}>
                    {(lead.leadStatus || 'cold').charAt(0).toUpperCase() + (lead.leadStatus || 'cold').slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getLeadTypeColor(lead.leadType)}>
                    {(lead.leadType || 'buyer').charAt(0).toUpperCase() + (lead.leadType || 'buyer').slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{lead.property}</TableCell>
                <TableCell>
                  {formatDate(lead.date)}
                </TableCell>
                <TableCell>
                  {lead.assignedTo ? getUserName(lead.assignedTo) : 'Unassigned'}
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
                                router.push(`/lead/${lead._id}`)
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
                        {lead.tasks && lead.tasks.length > 0 && (
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

