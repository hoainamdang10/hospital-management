"use strict";
/**
 * MedicalInfo Value Object
 * Patient medical information with Vietnamese healthcare standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalInfo = void 0;
const ValueObject_1 = require("../../../shared/domain/ValueObject");
class MedicalInfo extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    static create(props) {
        // Validate height and weight if provided
        if (props.height && (props.height < 50 || props.height > 250)) {
            throw new Error('Chiều cao phải từ 50cm đến 250cm');
        }
        if (props.weight && (props.weight < 1 || props.weight > 500)) {
            throw new Error('Cân nặng phải từ 1kg đến 500kg');
        }
        // Calculate BMI if both height and weight are provided
        let bmi;
        if (props.height && props.weight) {
            const heightInMeters = props.height / 100;
            bmi = props.weight / (heightInMeters * heightInMeters);
            bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal place
        }
        // Validate medications
        const validatedMedications = props.currentMedications.map(med => {
            if (!med.name || med.name.trim().length === 0) {
                throw new Error('Tên thuốc không được để trống');
            }
            if (!med.dosage || med.dosage.trim().length === 0) {
                throw new Error('Liều lượng thuốc không được để trống');
            }
            if (!med.frequency || med.frequency.trim().length === 0) {
                throw new Error('Tần suất dùng thuốc không được để trống');
            }
            return {
                ...med,
                name: med.name.trim(),
                dosage: med.dosage.trim(),
                frequency: med.frequency.trim()
            };
        });
        return new MedicalInfo({
            ...props,
            bmi,
            allergies: props.allergies.map(allergy => allergy.trim()).filter(a => a.length > 0),
            chronicConditions: props.chronicConditions.map(condition => condition.trim()).filter(c => c.length > 0),
            currentMedications: validatedMedications,
            dietaryRestrictions: props.dietaryRestrictions.map(restriction => restriction.trim()).filter(r => r.length > 0),
            familyMedicalHistory: props.familyMedicalHistory.map(history => history.trim()).filter(h => h.length > 0)
        });
    }
    // Getters
    get bloodType() {
        return this.props.bloodType;
    }
    get allergies() {
        return this.props.allergies.slice();
    }
    get chronicConditions() {
        return this.props.chronicConditions.slice();
    }
    get currentMedications() {
        return this.props.currentMedications.slice();
    }
    get emergencyMedicalInfo() {
        return this.props.emergencyMedicalInfo;
    }
    get height() {
        return this.props.height;
    }
    get weight() {
        return this.props.weight;
    }
    get bmi() {
        return this.props.bmi;
    }
    get smokingStatus() {
        return this.props.smokingStatus;
    }
    get alcoholConsumption() {
        return this.props.alcoholConsumption;
    }
    get exerciseFrequency() {
        return this.props.exerciseFrequency;
    }
    get dietaryRestrictions() {
        return this.props.dietaryRestrictions.slice();
    }
    get familyMedicalHistory() {
        return this.props.familyMedicalHistory.slice();
    }
    // Business methods
    hasAllergies() {
        return this.props.allergies.length > 0;
    }
    hasChronicConditions() {
        return this.props.chronicConditions.length > 0;
    }
    isOnMedication() {
        return this.props.currentMedications.some(med => med.isActive);
    }
    hasAllergyTo(substance) {
        return this.props.allergies.some(allergy => allergy.toLowerCase().includes(substance.toLowerCase()));
    }
    hasChronicCondition(condition) {
        return this.props.chronicConditions.some(chronic => chronic.toLowerCase().includes(condition.toLowerCase()));
    }
    isCurrentlyTaking(medicationName) {
        return this.props.currentMedications.some(med => med.isActive && med.name.toLowerCase().includes(medicationName.toLowerCase()));
    }
    getActiveMedications() {
        return this.props.currentMedications.filter(med => med.isActive);
    }
    getInactiveMedications() {
        return this.props.currentMedications.filter(med => !med.isActive);
    }
    // BMI analysis methods
    getBMICategory() {
        if (!this.props.bmi)
            return 'Chưa xác định';
        if (this.props.bmi < 18.5)
            return 'Thiếu cân';
        if (this.props.bmi < 25)
            return 'Bình thường';
        if (this.props.bmi < 30)
            return 'Thừa cân';
        return 'Béo phì';
    }
    getBMIStatus() {
        if (!this.props.bmi)
            return 'unknown';
        if (this.props.bmi < 18.5)
            return 'underweight';
        if (this.props.bmi < 25)
            return 'normal';
        if (this.props.bmi < 30)
            return 'overweight';
        return 'obese';
    }
    isHealthyWeight() {
        return this.getBMIStatus() === 'normal';
    }
    // Risk assessment methods
    hasHighRiskFactors() {
        return this.props.smokingStatus === 'current' ||
            this.props.alcoholConsumption === 'heavy' ||
            this.getBMIStatus() === 'obese' ||
            this.hasChronicConditions();
    }
    getLifestyleRiskScore() {
        let score = 0;
        // Smoking risk
        if (this.props.smokingStatus === 'current')
            score += 3;
        else if (this.props.smokingStatus === 'former')
            score += 1;
        // Alcohol risk
        if (this.props.alcoholConsumption === 'heavy')
            score += 3;
        else if (this.props.alcoholConsumption === 'moderate')
            score += 1;
        // Exercise risk
        if (this.props.exerciseFrequency === 'none')
            score += 2;
        else if (this.props.exerciseFrequency === 'rare')
            score += 1;
        // BMI risk
        const bmiStatus = this.getBMIStatus();
        if (bmiStatus === 'obese')
            score += 3;
        else if (bmiStatus === 'overweight' || bmiStatus === 'underweight')
            score += 1;
        // Chronic conditions
        score += this.props.chronicConditions.length;
        return score;
    }
    getRiskLevel() {
        const score = this.getLifestyleRiskScore();
        if (score <= 2)
            return 'low';
        if (score <= 5)
            return 'moderate';
        return 'high';
    }
    // Vietnamese healthcare specific methods
    requiresSpecialDiet() {
        return this.props.dietaryRestrictions.length > 0 ||
            this.hasChronicCondition('tiểu đường') ||
            this.hasChronicCondition('cao huyết áp') ||
            this.hasChronicCondition('tim mạch');
    }
    requiresRegularMonitoring() {
        return this.hasChronicConditions() ||
            this.isOnMedication() ||
            this.getRiskLevel() === 'high';
    }
    canDonateBlood() {
        return this.props.bloodType !== undefined &&
            !this.hasChronicConditions() &&
            this.props.smokingStatus !== 'current' &&
            this.props.weight && this.props.weight >= 45 &&
            this.getRiskLevel() !== 'high';
    }
    // Update methods
    updateVitalStats(height, weight) {
        return MedicalInfo.create({
            ...this.props,
            height,
            weight
        });
    }
    addAllergy(allergy) {
        if (this.hasAllergyTo(allergy)) {
            throw new Error('Dị ứng này đã được ghi nhận');
        }
        return MedicalInfo.create({
            ...this.props,
            allergies: [...this.props.allergies, allergy.trim()]
        });
    }
    removeAllergy(allergy) {
        return MedicalInfo.create({
            ...this.props,
            allergies: this.props.allergies.filter(a => a.toLowerCase() !== allergy.toLowerCase())
        });
    }
    addMedication(medication) {
        return MedicalInfo.create({
            ...this.props,
            currentMedications: [...this.props.currentMedications, medication]
        });
    }
    stopMedication(medicationName) {
        const updatedMedications = this.props.currentMedications.map(med => med.name.toLowerCase() === medicationName.toLowerCase()
            ? { ...med, isActive: false, endDate: new Date() }
            : med);
        return MedicalInfo.create({
            ...this.props,
            currentMedications: updatedMedications
        });
    }
    updateLifestyle(smokingStatus, alcoholConsumption, exerciseFrequency) {
        return MedicalInfo.create({
            ...this.props,
            smokingStatus: smokingStatus || this.props.smokingStatus,
            alcoholConsumption: alcoholConsumption || this.props.alcoholConsumption,
            exerciseFrequency: exerciseFrequency || this.props.exerciseFrequency
        });
    }
    equals(other) {
        return (this.props.bloodType === other.props.bloodType &&
            JSON.stringify(this.props.allergies.sort()) === JSON.stringify(other.props.allergies.sort()) &&
            JSON.stringify(this.props.chronicConditions.sort()) === JSON.stringify(other.props.chronicConditions.sort()) &&
            this.props.height === other.props.height &&
            this.props.weight === other.props.weight &&
            this.props.smokingStatus === other.props.smokingStatus &&
            this.props.alcoholConsumption === other.props.alcoholConsumption &&
            this.props.exerciseFrequency === other.props.exerciseFrequency);
    }
}
exports.MedicalInfo = MedicalInfo;
//# sourceMappingURL=MedicalInfo.js.map