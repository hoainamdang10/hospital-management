"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const room_controller_1 = require("../controllers/room.controller");
const room_validators_1 = require("../validators/room.validators");
const router = express_1.default.Router();
const roomController = new room_controller_1.RoomController();
router.get('/', room_validators_1.validateRoomSearch, roomController.getAllRooms.bind(roomController));
router.get('/availability', roomController.getRoomAvailability.bind(roomController));
router.get('/:roomId', room_validators_1.validateRoomId, roomController.getRoomById.bind(roomController));
router.get('/:roomId/bookings', room_validators_1.validateRoomId, roomController.getRoomBookings.bind(roomController));
router.post('/', room_validators_1.validateCreateRoom, roomController.createRoom.bind(roomController));
router.put('/:roomId', room_validators_1.validateRoomId, room_validators_1.validateUpdateRoom, roomController.updateRoom.bind(roomController));
router.put('/:roomId/status', room_validators_1.validateRoomId, roomController.updateRoomStatus.bind(roomController));
router.delete('/:roomId', room_validators_1.validateRoomId, roomController.deleteRoom.bind(roomController));
exports.default = router;
//# sourceMappingURL=room.routes.js.map