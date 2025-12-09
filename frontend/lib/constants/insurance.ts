/**
 * Insurance Coverage Constants
 * Định nghĩa tỷ lệ chi trả bảo hiểm theo loại bảo hiểm
 */

// Tỷ lệ chi trả bảo hiểm cho khám bệnh (consultation) theo loại
export const CONSULTATION_COVERAGE_BY_TYPE: Record<string, number> = {
    'BHYT': 80,      // Bảo hiểm y tế (nhà nước) → 80% coverage
    'BHTN': 70,      // Bảo hiểm tai nạn → 70% coverage
    'private': 60,   // Bảo hiểm tư nhân → 60% coverage
    'self_pay': 0,   // Tự chi trả → 0% coverage
};

/**
 * Lấy tỷ lệ % bảo hiểm chi trả cho khám bệnh dựa trên loại bảo hiểm
 * @param coverageType - Loại bảo hiểm: 'BHYT' | 'BHTN' | 'private' | 'self_pay'
 * @returns Tỷ lệ % được bảo hiểm chi trả (0-100)
 */
export function getConsultationCoveragePercent(coverageType?: string): number {
    if (!coverageType) return 0;
    return CONSULTATION_COVERAGE_BY_TYPE[coverageType] || 0;
}

/**
 * Tính số tiền bảo hiểm chi trả
 * @param amount - Tổng phí khám
 * @param coverageType - Loại bảo hiểm
 * @returns Số tiền bảo hiểm chi trả
 */
export function calculateInsuranceDiscount(amount: number, coverageType?: string): number {
    const coveragePercent = getConsultationCoveragePercent(coverageType);
    return Math.round(amount * (coveragePercent / 100));
}

/**
 * Tính số tiền bệnh nhân cần trả sau khi trừ bảo hiểm
 * @param amount - Tổng phí khám
 * @param coverageType - Loại bảo hiểm
 * @returns Số tiền bệnh nhân cần trả
 */
export function calculatePatientPayment(amount: number, coverageType?: string): number {
    const insuranceDiscount = calculateInsuranceDiscount(amount, coverageType);
    return amount - insuranceDiscount;
}
