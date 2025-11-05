/**
 * Validation Middleware - Presentation Layer
 * Request validation wrapper for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Input Validation, Security, Vietnamese Healthcare Standards
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateGenerateInvoice,
  validateProcessPayment,
  validateInsurance,
  validateInvoiceId,
  validatePatientId,
  validateInsuranceClaim,
  validatePayOSWebhook,
  validateBHYTWebhook,
  validateBHTNWebhook
} from './validationMiddleware';

/**
 * Validation middleware map
 */
const validationMap: Record<string, any[]> = {
  // Invoice validations
  'createInvoice': validateGenerateInvoice,
  'generateInvoice': validateGenerateInvoice,
  'invoiceId': validateInvoiceId,
  
  // Payment validations
  'processPayment': validateProcessPayment,
  'payment': validateProcessPayment,
  
  // Insurance validations
  'validateInsurance': validateInsurance,
  'insurance': validateInsurance,
  'insuranceClaim': validateInsuranceClaim,
  'submitClaim': validateInsuranceClaim,
  
  // Patient validations
  'patientId': validatePatientId,
  
  // Webhook validations
  'payosWebhook': validatePayOSWebhook,
  'bhytWebhook': validateBHYTWebhook,
  'bhtnWebhook': validateBHTNWebhook
};

/**
 * Validate request wrapper
 * Usage: validateRequest('createInvoice')
 */
export function validateRequest(validationType: string) {
  const validators = validationMap[validationType];
  
  if (!validators) {
    console.warn(`No validators found for type: ${validationType}`);
    return (req: Request, res: Response, next: NextFunction) => next();
  }
  
  return validators;
}

/**
 * Custom validation middleware for specific fields
 */
export function validateField(
  field: string,
  validator: (value: any) => boolean,
  errorMessage: string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field] || req.params[field] || req.query[field];
    
    if (!validator(value)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
          field
        }
      });
      return;
    }
    
    next();
  };
}

/**
 * Validate Vietnamese currency amount
 */
export function validateVNDAmount(req: Request, res: Response, next: NextFunction): void {
  const amount = req.body.amount;
  
  if (!amount || typeof amount !== 'number') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Số tiền không hợp lệ',
        field: 'amount'
      }
    });
    return;
  }
  
  if (amount < 1000) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Số tiền phải ít nhất 1,000 VND',
        field: 'amount'
      }
    });
    return;
  }
  
  if (amount > 1000000000) { // 1 billion VND
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Số tiền vượt quá giới hạn cho phép',
        field: 'amount'
      }
    });
    return;
  }
  
  next();
}

/**
 * Validate date range
 */
export function validateDateRange(req: Request, res: Response, next: NextFunction): void {
  const { fromDate, toDate } = req.query;
  
  if (fromDate && toDate) {
    const from = new Date(fromDate as string);
    const to = new Date(toDate as string);
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Định dạng ngày không hợp lệ'
        }
      });
      return;
    }
    
    if (from > to) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc'
        }
      });
      return;
    }
  }
  
  next();
}

