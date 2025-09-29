import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Validation schemas
const createBackupSchema = z.object({
  type: z.enum(['full', 'incremental', 'differential']),
  tables: z.array(z.string()).optional(),
  compressed: z.boolean().default(true),
  retention_days: z.number().min(1).max(365).default(30)
});

// GET /api/admin/data-management/backups - List all backups
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { data: backups, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch backups' },
        { status: 500 }
      );
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'backups_viewed',
      resource_type: 'backup',
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      backups: backups || []
    });

  } catch (error: any) {
    console.error('Get backups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/data-management/backups - Create new backup
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBackupSchema.parse(body);

    const backupId = `backup_${Date.now()}`;
    const backupName = `${validatedData.type}_backup_${new Date().toISOString().split('T')[0]}`;
    
    // Create backup record
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .insert({
        id: backupId,
        name: backupName,
        type: validatedData.type,
        status: 'in_progress',
        tables_included: validatedData.tables || [],
        retention_days: validatedData.retention_days,
        compressed: validatedData.compressed,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (backupError) {
      console.error('Backup creation error:', backupError);
      return NextResponse.json(
        { error: 'Failed to create backup record' },
        { status: 500 }
      );
    }

    // Start backup process asynchronously
    performBackup(backupId, validatedData)
      .then(async (result) => {
        await supabase
          .from('backups')
          .update({
            status: 'completed',
            size: result.size,
            file_path: result.filePath,
            completed_at: new Date().toISOString()
          })
          .eq('id', backupId);

        // Log completion
        await supabase.from('audit_logs').insert({
          action: 'backup_completed',
          resource_type: 'backup',
          resource_id: backupId,
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          user_role: user.role,
          details: { backupType: validatedData.type, size: result.size },
          timestamp: new Date().toISOString()
        });
      })
      .catch(async (error) => {
        console.error('Backup process failed:', error);
        await supabase
          .from('backups')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', backupId);

        // Log failure
        await supabase.from('audit_logs').insert({
          action: 'backup_failed',
          resource_type: 'backup',
          resource_id: backupId,
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          user_role: user.role,
          details: { error: error.message },
          status: 'failed',
          timestamp: new Date().toISOString()
        });
      });

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'backup_created',
      resource_type: 'backup',
      resource_id: backupId,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        backupType: validatedData.type,
        tablesCount: validatedData.tables?.length || 0,
        compressed: validatedData.compressed
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      backup,
      message: 'Backup started successfully'
    });

  } catch (error: any) {
    console.error('Create backup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to perform the actual backup
async function performBackup(backupId: string, options: any) {
  const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('Database URL not configured');
  }

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${backupId}_${timestamp}.sql`;
  const filePath = path.join(backupDir, fileName);

  let pgDumpCommand = `pg_dump "${dbUrl}" -f "${filePath}"`;

  // Add table-specific options if specified
  if (options.tables && options.tables.length > 0) {
    const tableOptions = options.tables.map((table: string) => `-t ${table}`).join(' ');
    pgDumpCommand += ` ${tableOptions}`;
  }

  // Add compression if requested
  if (options.compressed) {
    pgDumpCommand += ' --compress=9';
  }

  // Execute backup command
  try {
    const { stdout, stderr } = await execAsync(pgDumpCommand);
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('Backup warnings:', stderr);
    }

    // Get file size
    const stats = await fs.stat(filePath);
    const sizeInMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;

    return {
      filePath,
      size: `${sizeInMB} MB`,
      stdout,
      stderr
    };
  } catch (error: any) {
    // Clean up failed backup file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error('Failed to clean up backup file:', cleanupError);
    }
    
    throw new Error(`Backup failed: ${error.message}`);
  }
}

// Helper function to restore backup
export async function restoreBackup(backupId: string, userId: string) {
  try {
    // Get backup info
    const { data: backup, error } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      throw new Error('Backup not found');
    }

    if (backup.status !== 'completed') {
      throw new Error('Backup is not completed');
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    // Create restore command
    const restoreCommand = `psql "${dbUrl}" -f "${backup.file_path}"`;

    // Execute restore
    const { stdout, stderr } = await execAsync(restoreCommand);

    // Log restore event
    await supabase.from('audit_logs').insert({
      action: 'backup_restored',
      resource_type: 'backup',
      resource_id: backupId,
      user_id: userId,
      details: {
        backupName: backup.name,
        backupType: backup.type,
        restoredAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Backup restored successfully',
      stdout,
      stderr
    };

  } catch (error: any) {
    // Log restore failure
    await supabase.from('audit_logs').insert({
      action: 'backup_restore_failed',
      resource_type: 'backup',
      resource_id: backupId,
      user_id: userId,
      details: { error: error.message },
      status: 'failed',
      timestamp: new Date().toISOString()
    });

    throw error;
  }
}

// Helper function to clean up old backups
export async function cleanupOldBackups() {
  try {
    const { data: backups, error } = await supabase
      .from('backups')
      .select('*')
      .eq('status', 'completed');

    if (error) {
      console.error('Failed to fetch backups for cleanup:', error);
      return;
    }

    const now = new Date();
    const expiredBackups = backups?.filter(backup => {
      const createdAt = new Date(backup.created_at);
      const expiryDate = new Date(createdAt.getTime() + backup.retention_days * 24 * 60 * 60 * 1000);
      return now > expiryDate;
    }) || [];

    for (const backup of expiredBackups) {
      try {
        // Delete file
        if (backup.file_path) {
          await fs.unlink(backup.file_path);
        }

        // Delete database record
        await supabase
          .from('backups')
          .delete()
          .eq('id', backup.id);

        console.log(`Cleaned up expired backup: ${backup.name}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup backup ${backup.id}:`, cleanupError);
      }
    }

    return {
      cleaned: expiredBackups.length,
      message: `Cleaned up ${expiredBackups.length} expired backups`
    };

  } catch (error) {
    console.error('Backup cleanup error:', error);
    throw error;
  }
}
