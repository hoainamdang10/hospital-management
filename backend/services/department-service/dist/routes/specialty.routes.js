"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const specialty_controller_1 = require("../controllers/specialty.controller");
const specialty_validators_1 = require("../validators/specialty.validators");
const router = express_1.default.Router();
const specialtyController = new specialty_controller_1.SpecialtyController();
router.get('/', specialty_validators_1.validateSpecialtySearch, specialtyController.getAllSpecialties.bind(specialtyController));
router.get('/stats', specialtyController.getSpecialtyStats.bind(specialtyController));
router.get('/:specialtyId', specialty_validators_1.validateSpecialtyId, specialtyController.getSpecialtyById.bind(specialtyController));
router.get('/:specialtyId/doctors', specialty_validators_1.validateSpecialtyId, specialtyController.getSpecialtyDoctors.bind(specialtyController));
router.post('/', specialty_validators_1.validateCreateSpecialty, specialtyController.createSpecialty.bind(specialtyController));
router.put('/:specialtyId', specialty_validators_1.validateSpecialtyId, specialty_validators_1.validateUpdateSpecialty, specialtyController.updateSpecialty.bind(specialtyController));
router.delete('/:specialtyId', specialty_validators_1.validateSpecialtyId, specialtyController.deleteSpecialty.bind(specialtyController));
exports.default = router;
//# sourceMappingURL=specialty.routes.js.map