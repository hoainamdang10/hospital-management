"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomRepository = void 0;
const database_config_1 = require("../config/database.config");
class RoomRepository {
    async findAll(filters = {}, page = 1, limit = 20) {
        try {
            let query = database_config_1.supabaseAdmin
                .from('rooms')
                .select(`
          *,
          department:departments(
            department_id,
            department_name,
            department_code
          )
        `);
            if (filters.search) {
                query = query.or(`room_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
            }
            if (filters.department_id) {
                query = query.eq('department_id', filters.department_id);
            }
            if (filters.room_type) {
                query = query.eq('room_type', filters.room_type);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            if (filters.min_capacity) {
                query = query.gte('capacity', filters.min_capacity);
            }
            if (filters.max_capacity) {
                query = query.lte('capacity', filters.max_capacity);
            }
            const { count } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('*', { count: 'exact', head: true });
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);
            query = query.order('room_number', { ascending: true });
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to fetch rooms: ${error.message}`);
            }
            const totalPages = Math.ceil((count || 0) / limit);
            return {
                rooms: data || [],
                total: count || 0,
                totalPages
            };
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findById(roomId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select(`
          *,
          department:departments(
            department_id,
            department_name,
            department_code
          )
        `)
                .eq('room_id', roomId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch room: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async create(roomData) {
        try {
            const roomId = await this.generateRoomId(roomData.department_id);
            const newRoom = {
                room_id: roomId,
                room_number: roomData.room_number,
                department_id: roomData.department_id,
                room_type_id: roomData.room_type_id || 'RT0006',
                capacity: roomData.capacity,
                status: 'available',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            if (roomData.notes)
                newRoom.notes = roomData.notes;
            if (roomData.location)
                newRoom.location = roomData.location;
            const { data, error } = await database_config_1.supabaseAdmin
                .from('rooms')
                .insert(newRoom)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create room: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async update(roomId, updateData) {
        try {
            const updatedData = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await database_config_1.supabaseAdmin
                .from('rooms')
                .update(updatedData)
                .eq('room_id', roomId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to update room: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async delete(roomId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('rooms')
                .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
                .eq('room_id', roomId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return false;
                }
                throw new Error(`Failed to delete room: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAvailability(filters = {}) {
        try {
            let query = database_config_1.supabaseAdmin
                .from('rooms')
                .select('room_id, room_number, department_id, room_type, capacity, status')
                .eq('is_active', true);
            if (filters.department_id) {
                query = query.eq('department_id', filters.department_id);
            }
            if (filters.room_type) {
                query = query.eq('room_type', filters.room_type);
            }
            if (filters.available_only) {
                query = query.eq('status', 'available');
            }
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to fetch room availability: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getByDepartment(departmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('*')
                .eq('department_id', departmentId)
                .eq('is_active', true)
                .order('room_number', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch rooms by department: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getStats() {
        try {
            const { count: totalRooms } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('*', { count: 'exact', head: true });
            const { count: activeRooms } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            const { count: availableRooms } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'available')
                .eq('is_active', true);
            const { data: typeData } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('room_type')
                .eq('is_active', true);
            const roomTypeDistribution = typeData?.reduce((acc, item) => {
                acc[item.room_type] = (acc[item.room_type] || 0) + 1;
                return acc;
            }, {}) || {};
            const { data: capacityData } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('capacity')
                .eq('is_active', true);
            const averageCapacity = capacityData && capacityData.length > 0
                ? Math.round(capacityData.reduce((sum, item) => sum + item.capacity, 0) / capacityData.length * 100) / 100
                : 0;
            return {
                total_rooms: totalRooms || 0,
                active_rooms: activeRooms || 0,
                available_rooms: availableRooms || 0,
                occupied_rooms: (activeRooms || 0) - (availableRooms || 0),
                room_type_distribution: roomTypeDistribution,
                average_capacity: averageCapacity,
                utilization_rate: activeRooms ? Math.round((((activeRooms || 0) - (availableRooms || 0)) / activeRooms) * 100) : 0
            };
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateRoomId(departmentId) {
        try {
            const { data: deptData } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('department_code')
                .eq('department_id', departmentId)
                .single();
            const deptCode = deptData?.department_code || 'ROOM';
            const { data, error } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('room_id')
                .like('room_id', `${deptCode}-ROOM-%`)
                .order('room_id', { ascending: false })
                .limit(1);
            if (error) {
                throw new Error(`Failed to generate room ID: ${error.message}`);
            }
            let nextNumber = 1;
            if (data && data.length > 0) {
                const lastId = data[0].room_id;
                const parts = lastId.split('-');
                const lastNumber = parseInt(parts[parts.length - 1]);
                nextNumber = lastNumber + 1;
            }
            return `${deptCode}-ROOM-${nextNumber.toString().padStart(3, '0')}`;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.RoomRepository = RoomRepository;
//# sourceMappingURL=room.repository.js.map