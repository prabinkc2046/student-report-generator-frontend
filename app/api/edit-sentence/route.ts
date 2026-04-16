import { NextRequest, NextResponse } from 'next/server';

const FLASK_API_URL = 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${FLASK_API_URL}/edit_sentence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error calling Flask API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to backend service' },
      { status: 500 }
    );
  }
}