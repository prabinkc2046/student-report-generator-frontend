// app/api/extract-students-data/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to Flask backend
    const flaskFormData = new FormData();
    flaskFormData.append('file', file);
    
    const response = await fetch('http://localhost:5001/api/upload-students', {
      method: 'POST',
      body: flaskFormData,
    });
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}