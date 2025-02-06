'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  Calendar,
  BrainCircuit,
  X,
  Send,
  Phone,
  Lightbulb,
  Loader2,
  Plus,
  User2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getGeminiResponse, AssistantContext } from '@/lib/gemini';
import { getUpcomingEvents, createCalendarEvent, type CalendarEvent } from '@/lib/calendar';
import { format } from 'date-fns';

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<AssistantContext>({ type: 'general' });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Fetch calendar events when calendar context is activated
  useEffect(() => {
    if (currentContext.type === 'calendar') {
      fetchCalendarEvents();
    }
  }, [currentContext.type]);

  const fetchCalendarEvents = async () => {
    try {
      const events = await getUpcomingEvents(localStorage.getItem('calendar_token') || '');
      setCalendarEvents(events);
      const eventsMessage = formatEventsMessage(events);
      setMessages(prev => [...prev, { type: 'ai', content: eventsMessage }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "Please connect your Google Calendar to view and manage your events." 
      }]);
    }
  };

  const formatEventsMessage = (events: CalendarEvent[]) => {
    if (events.length === 0) return "You have no upcoming events.";
    
    return "Your upcoming events:\n" + events.map(event => {
      const start = new Date(event.start.dateTime);
      return `• ${event.summary} - ${format(start, 'MMM d, h:mm a')}`;
    }).join('\n');
  };

  const handleContextButton = (type: AssistantContext['type']) => {
    setCurrentContext({ type });
    setIsOpen(true);
    setShowCalendarView(type === 'calendar');
    
    const contextMessages = {
      strategy: "Hi, I'm Alex! I'm ready to help you with strategy planning. What would you like to know?",
      calendar: "Hi, I'm Alex! I can help you manage your calendar. You can:\n• View upcoming events\n• Create new events\n• Get reminders\nWhat would you like to do?",
      call: "Hi, I'm Alex! I can assist with call management and reminders. How can I help?",
    };
    
    if (type !== 'general') {
      setMessages([{ type: 'ai', content: contextMessages[type] }]);
    } else {
      setMessages([{ 
        type: 'ai', 
        content: "Hi! I'm Alex, your Get Home Realty Assistant. How can I help you today?" 
      }]);
    }
  };

  const handleCreateEvent = async (eventDetails: string) => {
    try {
      // Parse event details using AI
      const parsedEvent = await getGeminiResponse(
        `Parse this event request into JSON format with summary, description, start, and end dates: ${eventDetails}`,
        { type: 'calendar' }
      );
      
      const eventData = JSON.parse(parsedEvent);
      const newEvent = await createCalendarEvent(
        localStorage.getItem('calendar_token') || '',
        {
          summary: eventData.summary,
          description: eventData.description,
          start: new Date(eventData.start),
          end: new Date(eventData.end),
        }
      );

      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: `✅ Event created: ${newEvent.summary} on ${format(new Date(newEvent.start.dateTime), 'MMM d, h:mm a')}` 
      }]);
      
      // Refresh calendar events
      fetchCalendarEvents();
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "Sorry, I couldn't create the event. Please make sure to include event name, date, and time." 
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    setIsLoading(true);
    
    try {
      if (currentContext.type === 'calendar' && input.toLowerCase().includes('create')) {
        await handleCreateEvent(input);
      } else {
        const aiResponse = await getGeminiResponse(input, {
          ...currentContext,
          data: currentContext.type === 'calendar' ? { events: calendarEvents } : undefined
        });
        setMessages(prev => [...prev, { type: 'ai', content: aiResponse }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "I apologize, but I'm having trouble processing your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-96 h-[32rem] p-4 flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {currentContext.type === 'calendar' ? (
                <Calendar className="h-5 w-5 text-red-500" />
              ) : (
                <BrainCircuit className="h-5 w-5 text-red-500" />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-lg text-red-500">Get Home Realty</span>
                <span className="text-sm text-gray-500">
                  {currentContext.type === 'calendar' ? 'Alex - Calendar Assistant' : 'Alex - AI Assistant'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {currentContext.type === 'calendar' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCalendarView(!showCalendarView)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-2">
                    <BrainCircuit className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3 max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-red-500 text-white ml-12'
                      : 'bg-gray-100 dark:bg-gray-800'
                  } ${
                    message.type === 'user' 
                      ? 'rounded-tr-sm' 
                      : 'rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {message.type === 'ai' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Alex - Get Home Realty Assistant
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2">
                    <User2 className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-2">
                  <BrainCircuit className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl p-3 bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
            <Input
              placeholder={
                currentContext.type === 'calendar'
                  ? "Ask Alex about your schedule or create an event..."
                  : "Ask Alex anything about real estate..."
              }
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg"
            onClick={() => handleContextButton('general')}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-10 w-10 shadow-lg"
            onClick={() => handleContextButton('calendar')}
          >
            <Calendar className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-10 w-10 shadow-lg"
            onClick={() => handleContextButton('strategy')}
          >
            <Lightbulb className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-10 w-10 shadow-lg"
            onClick={() => handleContextButton('call')}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
} 