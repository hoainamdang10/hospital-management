import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .limit(1);

    if (testError) {
      console.error('Database test error:', testError);
      return res.status(500).json({
        error: 'Database connection failed',
        details: testError.message
      });
    }

    // Test doctors table
    const { data: doctorsData, error: doctorsError } = await supabaseAdmin
      .from('doctors')
      .select('doctor_id, full_name, specialty')
      .limit(5);

    if (doctorsError) {
      console.error('Doctors table error:', doctorsError);
      return res.status(500).json({
        error: 'Doctors table access failed',
        details: doctorsError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      data: {
        profiles_count: testData?.length || 0,
        doctors_count: doctorsData?.length || 0,
        sample_doctors: doctorsData || []
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
