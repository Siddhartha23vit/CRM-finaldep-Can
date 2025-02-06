'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

interface EventFormData {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'viewing' | 'meeting' | 'open-house' | 'follow-up' | 'call';
  description: string;
  location?: string;
  attendees?: string;
  contactPhone?: string;
  contactEmail?: string;
  propertyDetails?: string;
  notes?: string;
  enableReminder?: boolean;
}

export default function AddEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormData>({
    id: '',
    title: '',
    date: '',
    time: '',
    type: 'meeting',
    description: '',
    enableReminder: true,
  });

  // Initialize the ID and reminder manager on the client side
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      id: Math.random().toString(36).substring(7)
    }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Only access localStorage on the client side
      if (typeof window !== 'undefined') {
        // Get existing events
        const existingEvents = JSON.parse(localStorage.getItem('calendar_events') || '[]');
        
        // Add new event
        const updatedEvents = [...existingEvents, formData];
        
        // Save to localStorage
        localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));

        // Schedule reminder if enabled and phone number is provided
        if (formData.enableReminder && formData.contactPhone) {
          // Dynamically import the reminder manager only when needed
          const { reminderManager } = await import('@/lib/reminder-manager');
          await reminderManager.scheduleReminder(
            {
              id: formData.id,
              title: formData.title,
              date: new Date(formData.date),
              time: formData.time,
              type: formData.type,
              description: formData.description,
              location: formData.location,
              contactPhone: formData.contactPhone,
              contactEmail: formData.contactEmail,
            },
            formData.contactPhone
          );
        }
      }
      
      // Navigate back to calendar
      router.push('/calendar');
    } catch (error) {
      console.error('Error saving event:', error);
      // You might want to show an error toast here
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          <h1 className="text-2xl font-bold">Add New Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewing">Viewing</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="open-house">Open House</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                required
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees</Label>
              <Input
                id="attendees"
                value={formData.attendees || ''}
                onChange={(e) => handleInputChange('attendees', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyDetails">Property Details</Label>
            <Textarea
              id="propertyDetails"
              value={formData.propertyDetails || ''}
              onChange={(e) => handleInputChange('propertyDetails', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableReminder"
              checked={formData.enableReminder}
              onCheckedChange={(checked) => handleInputChange('enableReminder', checked)}
            />
            <Label htmlFor="enableReminder">
              Enable SMS reminder (15 minutes before event)
            </Label>
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
            >
              Save Event
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 