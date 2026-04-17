import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_name, gender, attributes } = body;

    // Forward the request to your Flask backend
    const response = await fetch('http://localhost:5001/generate_report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_name,
        gender,
        attributes
      }),
    });

    const data = await response.json();

    // Return the response to the client
    return NextResponse.json(data, { status: response.status });
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