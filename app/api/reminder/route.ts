import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client only on server side
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { event, phoneNumber } = await request.json();

    // Format the event date and time for the message
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString();
    
    const message = await client.messages.create({
      body: `Reminder: ${event.title} is starting in 15 minutes!\n` +
        `Date: ${formattedDate}\n` +
        `Time: ${event.time}\n` +
        `Location: ${event.location || 'Not specified'}\n` +
        `Type: ${event.type}\n` +
        `Description: ${event.description}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return NextResponse.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 