"use strict";
// ============================================================================
// ADVANCED ICD-10 ROUTES
// Advanced ICD-10 code management and search routes
// ============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const healthcare_service_1 = require("../services/healthcare.service");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
const healthcareService = new healthcare_service_1.HealthcareService();
// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================
const validateSearchQuery = [
    (0, express_validator_1.query)("q")
        .notEmpty()
        .withMessage("Search query is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Search query must be between 2 and 100 characters"),
];
const validateLimit = [
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
];
const validateCategory = [
    (0, express_validator_1.param)("category")
        .notEmpty()
        .withMessage("Category is required")
        .isLength({ min: 1, max: 50 })
        .withMessage("Category must be between 1 and 50 characters"),
];
const validateICD10Code = [
    (0, express_validator_1.param)("code")
        .notEmpty()
        .withMessage("ICD-10 code is required")
        .matches(/^[A-Z]\d{2}(\.\d{1,2})?$/)
        .withMessage("Invalid ICD-10 code format"),
];
// ============================================================================
// ROUTES
// ============================================================================
/**
 * @swagger
 * /api/icd10/search:
 *   get:
 *     summary: Search ICD-10 codes
 *     tags: [ICD-10]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", validateSearchQuery, validateLimit, async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;
        logger_1.default.info("Searching ICD-10 codes:", { query, limit });
        const results = await healthcareService.searchICD10Codes(query, parseInt(limit));
        res.json({
            success: true,
            data: results,
            message: `Found ${results.total} ICD-10 codes`,
        });
    }
    catch (error) {
        logger_1.default.error("Error searching ICD-10 codes:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Failed to search ICD-10 codes",
                details: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
});
/**
 * @swagger
 * /api/icd10/validate/{code}:
 *   get:
 *     summary: Validate ICD-10 code
 *     tags: [ICD-10]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: ICD-10 code to validate
 *     responses:
 *       200:
 *         description: Validation result
 */
router.get("/validate/:code", validateICD10Code, async (req, res) => {
    try {
        const { code } = req.params;
        logger_1.default.info("Validating ICD-10 code:", code);
        const validation = await healthcareService.validateICD10Code(code);
        res.json({
            success: true,
            data: {
                code: code,
                is_valid: validation.isValid,
                ...(validation.code && { details: validation.code }),
            },
            message: validation.isValid
                ? "Valid ICD-10 code"
                : "Invalid ICD-10 code",
        });
    }
    catch (error) {
        logger_1.default.error("Error validating ICD-10 code:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Failed to validate ICD-10 code",
                details: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
});
/**
 * @swagger
 * /api/icd10/category/{category}:
 *   get:
 *     summary: Get ICD-10 codes by category
 *     tags: [ICD-10]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: ICD-10 category
 *     responses:
 *       200:
 *         description: ICD-10 codes in category
 */
router.get("/category/:category", validateCategory, async (req, res) => {
    try {
        const { category } = req.params;
        logger_1.default.info("Getting ICD-10 codes by category:", category);
        const codes = await healthcareService.getICD10CodesByCategory(category);
        res.json({
            success: true,
            data: {
                category,
                codes,
                total: codes.length,
            },
            message: `Found ${codes.length} codes in category: ${category}`,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting ICD-10 codes by category:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Failed to get ICD-10 codes by category",
                details: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
});
/**
 * @swagger
 * /api/icd10/categories:
 *   get:
 *     summary: Get all ICD-10 categories
 *     tags: [ICD-10]
 *     responses:
 *       200:
 *         description: List of ICD-10 categories
 */
router.get("/categories", async (req, res) => {
    try {
        logger_1.default.info("Getting all ICD-10 categories");
        // Mock categories (replace with actual implementation)
        const categories = [
            "Diseases of the circulatory system",
            "Endocrine, nutritional and metabolic diseases",
            "Diseases of the respiratory system",
            "Diseases of the musculoskeletal system",
            "Symptoms, signs and abnormal clinical findings",
        ];
        res.json({
            success: true,
            data: {
                categories,
                total: categories.length,
            },
            message: `Found ${categories.length} ICD-10 categories`,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting ICD-10 categories:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Failed to get ICD-10 categories",
                details: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
});
/**
 * @swagger
 * /api/icd10/stats:
 *   get:
 *     summary: Get ICD-10 usage statistics
 *     tags: [ICD-10]
 *     responses:
 *       200:
 *         description: ICD-10 usage statistics
 */
router.get("/stats", async (req, res) => {
    try {
        logger_1.default.info("Getting ICD-10 usage statistics");
        // Mock statistics (replace with actual implementation)
        const stats = {
            total_codes: 5,
            categories: 5,
            most_used_codes: [
                {
                    code: "I10",
                    description: "Essential (primary) hypertension",
                    usage_count: 45,
                },
                {
                    code: "E11",
                    description: "Type 2 diabetes mellitus",
                    usage_count: 32,
                },
                {
                    code: "J44",
                    description: "Other chronic obstructive pulmonary disease",
                    usage_count: 28,
                },
            ],
            usage_by_category: {
                "Diseases of the circulatory system": 45,
                "Endocrine, nutritional and metabolic diseases": 32,
                "Diseases of the respiratory system": 28,
                "Diseases of the musculoskeletal system": 15,
                "Symptoms, signs and abnormal clinical findings": 12,
            },
            last_updated: new Date().toISOString(),
        };
        res.json({
            success: true,
            data: stats,
            message: "ICD-10 statistics retrieved successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error getting ICD-10 statistics:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Failed to get ICD-10 statistics",
                details: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=advanced-icd10.routes.js.map