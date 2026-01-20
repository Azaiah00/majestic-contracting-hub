/**
 * ===========================================
 * LEAD EXTRACTION API - Gemini AI
 * ===========================================
 * Extracts structured lead data from raw text
 * using Google Gemini AI.
 */

import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Check if Gemini is configured
    if (!GEMINI_API_KEY) {
      // Return mock data for demo if no API key
      console.warn('GEMINI_API_KEY not configured, using mock extraction');
      return NextResponse.json(extractMock(text));
    }

    // Call Gemini API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `You are a lead extraction assistant for a home contracting company in Virginia.

Extract the following information from the text below and return it as JSON:
- name: Client's full name
- email: Email address (if found)
- phone: Phone number (if found)
- location: City/town name
- zip_code: 5-digit ZIP code
- service_type: The type of home improvement service they need (e.g., "Kitchen Remodel", "Bathroom Remodel", "New Construction", "Deck", "Roofing", "Painting", "Flooring", etc.)
- project_scope: Brief description of what they want done
- estimated_value: Estimated project value as a number (no $ or commas), if mentioned

Return ONLY valid JSON, no markdown or explanation. If a field is not found, omit it from the response.

Text to analyze:
"""
${text}
"""`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to call Gemini API');
    }

    const data = await response.json();
    
    // Extract the text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON from the response
    // Handle case where Gemini wraps it in markdown code blocks
    let jsonStr = textResponse.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const extractedData = JSON.parse(jsonStr);

    // Validate required fields
    if (!extractedData.name || !extractedData.location || !extractedData.zip_code) {
      return NextResponse.json(
        { error: 'Could not extract required information (name, location, zip code)' },
        { status: 400 }
      );
    }

    return NextResponse.json(extractedData);

  } catch (error: any) {
    console.error('Lead extraction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract lead data' },
      { status: 500 }
    );
  }
}

/**
 * Mock extraction for demo/testing when Gemini is not configured.
 * Attempts basic pattern matching on the text.
 */
function extractMock(text: string) {
  // Basic patterns to extract info
  const nameMatch = text.match(/(?:name is|I'm|I am)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const zipMatch = text.match(/\b(2[0-3]\d{3})\b/); // VA zip codes start with 20-23
  const valueMatch = text.match(/\$?([\d,]+)(?:k|K|000)?/);
  
  // Service keywords
  const serviceKeywords: Record<string, string> = {
    'kitchen': 'Kitchen Remodel',
    'bathroom': 'Bathroom Remodel',
    'bath': 'Bathroom Remodel',
    'basement': 'Basement Remodel',
    'deck': 'Deck',
    'roof': 'Roofing',
    'paint': 'Painting',
    'floor': 'Flooring',
    'addition': 'Home Addition',
    'new home': 'New Construction',
    'build': 'New Construction',
    'renovation': 'Full Renovation',
    'remodel': 'Full Renovation',
    'fence': 'Fence',
    'siding': 'Siding',
    'window': 'Windows/Doors',
    'door': 'Windows/Doors',
    'drywall': 'Drywall',
    'shed': 'She-Shed',
    'concrete': 'Concrete',
  };

  let serviceType = 'Full Renovation'; // default
  for (const [keyword, service] of Object.entries(serviceKeywords)) {
    if (text.toLowerCase().includes(keyword)) {
      serviceType = service;
      break;
    }
  }

  // Extract city - look for common VA cities
  const cityKeywords = ['Fairfax', 'Arlington', 'Alexandria', 'Richmond', 'Norfolk', 'Virginia Beach', 'Reston', 'McLean', 'Loudoun', 'Ashburn', 'Sterling', 'Herndon', 'Manassas', 'Centreville', 'Chantilly'];
  let location = 'Fairfax'; // default
  for (const city of cityKeywords) {
    if (text.toLowerCase().includes(city.toLowerCase())) {
      location = city;
      break;
    }
  }

  // Parse value
  let estimatedValue: number | undefined;
  if (valueMatch) {
    let value = parseInt(valueMatch[1].replace(/,/g, ''));
    // If it ends with k/K or is less than 1000, multiply by 1000
    if (valueMatch[0].toLowerCase().includes('k') || value < 1000) {
      value *= 1000;
    }
    estimatedValue = value;
  }

  return {
    name: nameMatch?.[1] || 'Unknown Client',
    email: emailMatch?.[0] || undefined,
    phone: phoneMatch?.[0] || undefined,
    location: location,
    zip_code: zipMatch?.[1] || '22030',
    service_type: serviceType,
    project_scope: text.substring(0, 200),
    estimated_value: estimatedValue,
  };
}
