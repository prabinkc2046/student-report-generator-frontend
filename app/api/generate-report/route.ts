import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_name, pronoun, attributes } = body;

    const response = await fetch('http://localhost:5001/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_name,
        pronoun,
        attributes
      }),
    });

    const data = await response.json();

    // Your Flask returns { "report": "..." } directly
    return NextResponse.json({
      success: true,
      report: data.report,
      char_count: data.report.length
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to backend server. Please ensure the Flask server is running on port 5001.' 
      },
      { status: 500 }
    );
  }
}