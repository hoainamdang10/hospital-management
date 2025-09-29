import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { RoomRepository } from '../repositories/room.repository';

export class RoomController {
  private roomRepository: RoomRepository;

  constructor() {
    this.roomRepository = new RoomRepository();
  }
  // Get all rooms with optional filters and pagination
  async getAllRooms(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Extract query parameters
      const {
        search,
        department_id,
        room_type,
        status,
        is_active,
        min_capacity,
        max_capacity,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        search: search as string,
        department_id: department_id as string,
        room_type: room_type as string,
        status: status as string,
        is_active: is_active ? is_active === 'true' : undefined,
        min_capacity: min_capacity ? parseInt(min_capacity as string) : undefined,
        max_capacity: max_capacity ? parseInt(max_capacity as string) : undefined
      };

      const result = await this.roomRepository.findAll(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.rooms,
        message: 'Rooms retrieved successfully',
        timestamp: new Date().toISOString(),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check room availability
  async getRoomAvailability(req: Request, res: Response): Promise<void> {
    try {
      const {
        department_id,
        room_type,
        available_only
      } = req.query;

      const filters = {
        department_id: department_id as string,
        room_type: room_type as string,
        available_only: available_only === 'true'
      };

      const availability = await this.roomRepository.getAvailability(filters);

      res.json({
        success: true,
        data: availability,
        message: 'Room availability retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get room by ID
  async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // TODO: Implement room fetching by ID logic
      res.status(404).json({
        success: false,
        error: 'Room not found',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get room bookings
  async getRoomBookings(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // TODO: Implement room bookings logic
      res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create new room
  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const roomData = req.body;

      const newRoom = await this.roomRepository.create(roomData);

      res.status(201).json({
        success: true,
        data: newRoom,
        message: 'Room created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update room
  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // TODO: Implement room update logic
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Room update not yet implemented',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update room status
  async updateRoomStatus(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // TODO: Implement room status update logic
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Room status update not yet implemented',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Soft delete room
  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // TODO: Implement room deletion logic
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Room deletion not yet implemented',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}
