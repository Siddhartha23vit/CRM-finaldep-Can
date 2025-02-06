"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid'
import type { Lead } from "@/lib/types"

export function LeadForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [leadData, setLeadData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "new",
    property: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const newLead: Partial<Lead> = {
        _id: uuidv4(),
        ...leadData,
        date: new Date().toISOString(),
        callHistory: [],
        strategy: {
          lastUpdated: new Date().toISOString(),
          tasks: [],
          notes: ""
        }
      }

      // Save to localStorage
      const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]')
      const updatedLeads = [...existingLeads, newLead]
      localStorage.setItem('leads', JSON.stringify(updatedLeads))

      // Trigger a storage event for other components to update
      window.dispatchEvent(new Event('storage'))

      toast({
        title: "Success",
        description: "Lead added successfully.",
      })

      // Reset form
      setLeadData({
        name: "",
        email: "",
        phone: "",
        status: "new",
        property: "",
        notes: "",
      })

      // Close dialog
      document.getElementById('addLeadDialog')?.close()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <dialog id="addLeadDialog" className="modal p-0">
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-lg w-[500px]">
        <h2 className="text-xl font-semibold">Add New Lead</h2>
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            required
            value={leadData.name}
            onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={leadData.email}
              onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              required
              value={leadData.phone}
              onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={leadData.status}
              onValueChange={(value) => setLeadData({ ...leadData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Input
              id="property"
              required
              value={leadData.property}
              onChange={(e) => setLeadData({ ...leadData, property: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={leadData.notes}
            onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('addLeadDialog')?.close()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Lead"}
          </Button>
        </div>
      </form>
    </dialog>
  )
} 