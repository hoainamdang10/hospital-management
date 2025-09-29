import { Room, CreateRoomRequest, UpdateRoomRequest, RoomWithDetails } from '../types/department.types';
export declare class RoomRepository {
    findAll(filters?: any, page?: number, limit?: number): Promise<{
        rooms: RoomWithDetails[];
        total: number;
        totalPages: number;
    }>;
    findById(roomId: string): Promise<RoomWithDetails | null>;
    create(roomData: CreateRoomRequest): Promise<Room>;
    update(roomId: string, updateData: UpdateRoomRequest): Promise<Room | null>;
    delete(roomId: string): Promise<boolean>;
    getAvailability(filters?: any): Promise<any[]>;
    getByDepartment(departmentId: string): Promise<Room[]>;
    getStats(): Promise<any>;
    private generateRoomId;
}
//# sourceMappingURL=room.repository.d.ts.map