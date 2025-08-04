import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'user_id',
      'provider_id', 
      'service_id',
      'appointment_date',
      'appointment_time',
      'appointment_period',
      'appointment_type',
      'patient_name',
      'patient_email',
      'status'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`[API] Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Ensure time format is correct (HH:MM:SS)
    let timeFormatted = body.appointment_time;
    if (timeFormatted && typeof timeFormatted === 'string') {
      if (timeFormatted.includes(':')) {
        const timeParts = timeFormatted.split(':');
        if (timeParts.length === 2) {
          timeFormatted = timeFormatted + ':00';
        }
      } else {
        timeFormatted = timeFormatted + ':00:00';
      }
    }

    // Prepare insert data
    const insertData = {
      user_id: body.user_id,
      provider_id: body.provider_id,
      service_id: body.service_id,
      appointment_date: body.appointment_date,
      appointment_time: timeFormatted,
      appointment_period: body.appointment_period,
      appointment_type: body.appointment_type,
      patient_name: body.patient_name,
      patient_phone: body.patient_phone || null,
      patient_email: body.patient_email,
      notes: body.notes || null,
      insurance_id: body.insurance_id || null,
      insurance_plan_name: body.insurance_plan_name || null,
      insurance_plan_type: body.insurance_plan_type || null,
      estimated_cost: body.estimated_cost || null,
      status: body.status
    };

    //console.log('[API] Formatted insert data:', insertData);

    // Insert into database
    //console.log('[API] Inserting appointment into database...');
    const { data, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[API] Database error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create appointment',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('[API] No data returned from insertion');
      return NextResponse.json(
        { error: 'No data returned from appointment creation' },
        { status: 500 }
      );
    }

    //console.log('[API] Appointment created successfully:', data);
    
    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error: any) {
    console.error('[API] Error creating appointment:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
