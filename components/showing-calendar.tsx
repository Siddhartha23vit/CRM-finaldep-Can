"use client"

import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { CalendarIcon, Plus } from "lucide-react"

interface Showing {
  id?: string
  date: Date
  time: string
  property: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface ShowingCalendarProps {
  showings: Showing[]
  onAddShowing: (showing: Showing) => void
}

export function ShowingCalendar({ showings, onAddShowing }: ShowingCalendarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [newShowing, setNewShowing] = useState<Partial<Showing>>({
    status: 'scheduled'
  })
  const { toast } = useToast()

  const handleAddShowing = () => {
    if (!selectedDate || !newShowing.time || !newShowing.property) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    const showing: Showing = {
      date: selectedDate,
      time: newShowing.time,
      property: newShowing.property,
      notes: newShowing.notes,
      status: 'scheduled'
    }

    onAddShowing(showing)
    setIsDialogOpen(false)
    setNewShowing({ status: 'scheduled' })
    setSelectedDate(undefined)

    toast({
      title: "Success",
      description: "Showing scheduled successfully",
    })
  }

  // Function to get showings for a specific date
  const getShowingsForDate = (date: Date) => {
    return showings.filter(showing => {
      const showingDate = new Date(showing.date)
      return showingDate.toDateString() === date.toDateString()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Property Showings</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Showing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule a Showing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={newShowing.time || ''}
                  onChange={(e) => setNewShowing({ ...newShowing, time: e.target.value })}
                />
              </div>
              <div>
                <Label>Property</Label>
                <Input
                  value={newShowing.property || ''}
                  onChange={(e) => setNewShowing({ ...newShowing, property: e.target.value })}
                  placeholder="Enter property address"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newShowing.notes || ''}
                  onChange={(e) => setNewShowing({ ...newShowing, notes: e.target.value })}
                  placeholder="Add any additional notes"
                />
              </div>
              <Button onClick={handleAddShowing}>Schedule Showing</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            hasShowing: (date) => getShowingsForDate(date).length > 0
          }}
          modifiersStyles={{
            hasShowing: { backgroundColor: '#e2e8f0' }
          }}
        />
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <h4 className="font-medium">Showings for {selectedDate.toLocaleDateString()}</h4>
          {getShowingsForDate(selectedDate).map((showing) => (
            <div
              key={showing.id}
              className="border rounded-md p-3 space-y-1"
            >
              <div className="flex justify-between">
                <span className="font-medium">{showing.time}</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  showing.status === 'completed' ? 'bg-green-100 text-green-800' :
                  showing.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {showing.status}
                </span>
              </div>
              <div>{showing.property}</div>
              {showing.notes && <div className="text-sm text-gray-500">{showing.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 