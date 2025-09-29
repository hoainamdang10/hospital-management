import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/backend/lib/auth/server';
import { supabase } from '@/backend/lib/supabase';
import { z } from 'zod';

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(5).max(500),
  permissions: z.array(z.string())
});

const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(5).max(500).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

// GET /api/admin/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('roles')
      .select(`
        *,
        role_permissions!inner(permission_id),
        user_roles(count)
      `)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: roles, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }

    // Transform data to include permission IDs and user count
    const transformedRoles = roles?.map(role => ({
      ...role,
      permissions: role.role_permissions?.map((rp: any) => rp.permission_id) || [],
      user_count: role.user_roles?.[0]?.count || 0
    })) || [];

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'roles_viewed',
      resource_type: 'role',
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: { search, status, limit, offset },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      roles: transformedRoles
    });

  } catch (error: any) {
    console.error('Get roles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create new role
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
    const validatedData = createRoleSchema.parse(body);

    // Start transaction
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        status: 'active',
        is_system_role: false,
        created_by: user.id
      })
      .select()
      .single();

    if (roleError) {
      console.error('Role creation error:', roleError);
      return NextResponse.json(
        { error: 'Failed to create role' },
        { status: 500 }
      );
    }

    // Add permissions
    if (validatedData.permissions.length > 0) {
      const rolePermissions = validatedData.permissions.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }));

      const { error: permissionsError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permissionsError) {
        console.error('Role permissions error:', permissionsError);
        // Rollback role creation
        await supabase.from('roles').delete().eq('id', role.id);
        return NextResponse.json(
          { error: 'Failed to assign permissions' },
          { status: 500 }
        );
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'role_created',
      resource_type: 'role',
      resource_id: role.id,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        roleName: validatedData.name,
        permissionCount: validatedData.permissions.length
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      role: {
        ...role,
        permissions: validatedData.permissions,
        user_count: 0
      }
    });

  } catch (error: any) {
    console.error('Create role error:', error);
    
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

// PUT /api/admin/roles/[id] - Update role
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const roleId = params.id;
    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Check if role exists and is not system role
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'Cannot modify system role' },
        { status: 403 }
      );
    }

    // Update role
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.status) updateData.status = validatedData.status;

    const { error: updateError } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', roleId);

    if (updateError) {
      console.error('Role update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    // Update permissions if provided
    if (validatedData.permissions) {
      // Delete existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Add new permissions
      if (validatedData.permissions.length > 0) {
        const rolePermissions = validatedData.permissions.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId
        }));

        const { error: permissionsError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions);

        if (permissionsError) {
          console.error('Role permissions update error:', permissionsError);
          return NextResponse.json(
            { error: 'Failed to update permissions' },
            { status: 500 }
          );
        }
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'role_updated',
      resource_type: 'role',
      resource_id: roleId,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        changes: validatedData,
        previousName: existingRole.name
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully'
    });

  } catch (error: any) {
    console.error('Update role error:', error);
    
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

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const roleId = params.id;

    // Check if role exists and is not system role
    const { data: existingRole, error: fetchError } = await supabase
      .from('roles')
      .select('*, user_roles(count)')
      .eq('id', roleId)
      .single();

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (existingRole.is_system_role) {
      return NextResponse.json(
        { error: 'Cannot delete system role' },
        { status: 403 }
      );
    }

    // Check if role is assigned to users
    const userCount = existingRole.user_roles?.[0]?.count || 0;
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. It is assigned to ${userCount} user(s)` },
        { status: 400 }
      );
    }

    // Delete role permissions first
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Delete role
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (deleteError) {
      console.error('Role deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      );
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action: 'role_deleted',
      resource_type: 'role',
      resource_id: roleId,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      user_role: user.role,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      details: {
        roleName: existingRole.name,
        roleDescription: existingRole.description
      },
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
