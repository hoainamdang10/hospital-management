import { Request, Response } from "express";
import { GetPatientSummaryUseCase } from "../../../application/use-cases/GetPatientSummaryUseCase";
import { GetMedicalRecordHistoryUseCase } from "../../../application/use-cases/GetMedicalRecordHistoryUseCase";
import { SearchClinicalDataUseCase } from "../../../application/use-cases/SearchClinicalDataUseCase";
import { GetServiceMetricsUseCase } from "../../../application/use-cases/GetServiceMetricsUseCase";
import { ExportPatientDataUseCase } from "../../../application/use-cases/ExportPatientDataUseCase";
import { ILogger } from "../../../shared/logger";

export class ClinicalSummaryController {
  constructor(
    private readonly getPatientSummaryUseCase: GetPatientSummaryUseCase,
    private readonly getMedicalRecordHistoryUseCase: GetMedicalRecordHistoryUseCase,
    private readonly searchClinicalDataUseCase: SearchClinicalDataUseCase,
    private readonly getServiceMetricsUseCase: GetServiceMetricsUseCase,
    private readonly exportPatientDataUseCase: ExportPatientDataUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * GET /api/v2/clinical-emr/patients/:patientId/summary
   * Get comprehensive patient clinical summary
   */
  async getPatientSummary(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      this.logger.info("Getting patient summary", { patientId });

      const result = await this.getPatientSummaryUseCase.execute({ patientId });

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      this.logger.error("Error getting patient summary", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  /**
   * GET /api/v2/clinical-emr/medical-records/:recordId/history
   * Get medical record change history
   */
  async getMedicalRecordHistory(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;

      this.logger.info("Getting medical record history", { recordId });

      const result = await this.getMedicalRecordHistoryUseCase.execute({ recordId });

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      this.logger.error("Error getting medical record history", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  /**
   * GET /api/v2/clinical-emr/search
   * Search across clinical data
   */
  async searchClinicalData(req: Request, res: Response): Promise<void> {
    try {
      const { q: searchTerm, limit } = req.query;

      if (!searchTerm || typeof searchTerm !== 'string') {
        res.status(400).json({
          success: false,
          error: "Search term is required"
        });
        return;
      }

      this.logger.info("Searching clinical data", {
        searchTerm,
        limit: limit ? parseInt(limit as string) : 50
      });

      const result = await this.searchClinicalDataUseCase.execute({
        searchTerm,
        limit: limit ? parseInt(limit as string) : undefined
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      this.logger.error("Error searching clinical data", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  /**
   * GET /api/v2/clinical-emr/metrics
   * Get service metrics and statistics
   */
  async getServiceMetrics(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info("Getting service metrics");

      const result = await this.getServiceMetricsUseCase.execute({});

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      this.logger.error("Error getting service metrics", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }

  /**
   * GET /api/v2/clinical-emr/patients/:patientId/export
   * Export complete patient clinical data
   */
  async exportPatientData(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { format } = req.query;

      this.logger.info("Exporting patient data", {
        patientId,
        format: format || 'json'
      });

      const result = await this.exportPatientDataUseCase.execute({
        patientId,
        format: format as 'json' | 'xml' | undefined
      });

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error
        });
        return;
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="patient-${patientId}-export-${new Date().toISOString().split('T')[0]}.json"`
      );

      res.status(200).json(result.data);
    } catch (error) {
      this.logger.error("Error exporting patient data", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
}
