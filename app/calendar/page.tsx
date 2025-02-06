"use client"

import { useState, useEffect } from 'react'
import { DashboardLayout } from "@/components/layout"
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface Showing {
  id: string
  date: Date
  time: string
  property: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  leadName: string
  leadId: string
}

export default function CalendarPage() {
  const [showings, setShowings] = useState<Showing[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()
  const { toast } = useToast()

  useEffect(() => {
    fetchAllShowings()
  }, [])

  const fetchAllShowings = async () => {
    try {
      const response = await fetch('/api/showings')
      if (!response.ok) {
        throw new Error('Failed to fetch showings')
      }
      const data = await response.json()
      setShowings(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch showings",
      })
    }
  }

  const getShowingsForDate = (date: Date) => {
    return showings.filter(showing => {
      const showingDate = new Date(showing.date)
      return showingDate.toDateString() === date.toDateString()
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Property Showings Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                  modifiers={{
                    hasShowing: (date) => getShowingsForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasShowing: { 
                      backgroundColor: 'var(--primary-50)',
                      color: 'var(--primary-900)',
                      fontWeight: 'bold'
                    }
                  }}
                  styles={{
                    head_cell: {
                      width: '100%',
                      fontSize: '1rem',
                      padding: '1rem',
                      color: 'var(--primary-700)'
                    },
                    cell: {
                      width: '100%',
                      height: '100%',
                      fontSize: '1rem',
                      padding: '1rem'
                    },
                    nav_button_previous: {
                      width: '2.5rem',
                      height: '2.5rem'
                    },
                    nav_button_next: {
                      width: '2.5rem',
                      height: '2.5rem'
                    },
                    caption: {
                      fontSize: '1.25rem',
                      padding: '1rem'
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Showings Details Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>
                {selectedDate ? 
                  `Showings for ${selectedDate.toLocaleDateString()}` : 
                  'Select a date to view showings'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-4">
                  {getShowingsForDate(selectedDate).length > 0 ? (
                    getShowingsForDate(selectedDate).map((showing) => (
                      <div
                        key={showing.id}
                        className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-lg">
                              {showing.time}
                            </div>
                            <div className="text-primary-600 font-medium">
                              {showing.property}
                            </div>
                          </div>
                          <Badge
                            variant={
                              showing.status === 'completed' ? 'success' :
                              showing.status === 'cancelled' ? 'destructive' :
                              'default'
                            }
                            className="capitalize"
                          >
                            {showing.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Lead: {showing.leadName}
                        </div>
                        {showing.notes && (
                          <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                            {showing.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      No showings scheduled for this date
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-6">
                  Select a date to view scheduled showings
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

