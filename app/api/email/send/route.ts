import { NextResponse } from "next/server";
import { emailService } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const { to, cc, bcc, subject, content } = await request.json();

    if (!to || !to.length || !subject || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email addresses
    const allEmails = [...to, ...(cc || []), ...(bcc || [])];
    if (!allEmails.every(email => email.includes('@'))) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const result = await emailService.sendLeadEmail(to, subject, content, cc, bcc);
    console.log('Email sent successfully:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Send email error:", error);
    
    // Better error handling for ProtonMail specific errors
    const errorMessage = error.message || "Failed to send email";
    const statusCode = error.code === 'EAUTH' ? 401 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 