import express from 'express';
import { RoomController } from '../controllers/room.controller';
import {
  validateRoomId,
  validateCreateRoom,
  validateUpdateRoom,
  validateRoomSearch
} from '../validators/room.validators';

const router = express.Router();
const roomController = new RoomController();

// GET /api/rooms - Get all rooms with optional filters
router.get(
  '/',
  validateRoomSearch,
  roomController.getAllRooms.bind(roomController)
);

// GET /api/rooms/availability - Check room availability
router.get(
  '/availability',
  roomController.getRoomAvailability.bind(roomController)
);

// GET /api/rooms/:roomId - Get room by ID
router.get(
  '/:roomId',
  validateRoomId,
  roomController.getRoomById.bind(roomController)
);

// GET /api/rooms/:roomId/bookings - Get room bookings
router.get(
  '/:roomId/bookings',
  validateRoomId,
  roomController.getRoomBookings.bind(roomController)
);

// POST /api/rooms - Create new room
router.post(
  '/',
  validateCreateRoom,
  roomController.createRoom.bind(roomController)
);

// PUT /api/rooms/:roomId - Update room
router.put(
  '/:roomId',
  validateRoomId,
  validateUpdateRoom,
  roomController.updateRoom.bind(roomController)
);

// PUT /api/rooms/:roomId/status - Update room status
router.put(
  '/:roomId/status',
  validateRoomId,
  roomController.updateRoomStatus.bind(roomController)
);

// DELETE /api/rooms/:roomId - Soft delete room
router.delete(
  '/:roomId',
  validateRoomId,
  roomController.deleteRoom.bind(roomController)
);

export default router;
