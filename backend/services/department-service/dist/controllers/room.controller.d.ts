import { Request, Response } from 'express';
export declare class RoomController {
    private roomRepository;
    constructor();
    getAllRooms(req: Request, res: Response): Promise<void>;
    getRoomAvailability(req: Request, res: Response): Promise<void>;
    getRoomById(req: Request, res: Response): Promise<void>;
    getRoomBookings(req: Request, res: Response): Promise<void>;
    createRoom(req: Request, res: Response): Promise<void>;
    updateRoom(req: Request, res: Response): Promise<void>;
    updateRoomStatus(req: Request, res: Response): Promise<void>;
    deleteRoom(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=room.controller.d.ts.map