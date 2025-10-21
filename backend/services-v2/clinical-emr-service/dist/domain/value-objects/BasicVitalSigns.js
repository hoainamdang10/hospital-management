"use strict";
/**
 * BasicVitalSigns Value Object - Clinical EMR Service
 * Simplified vital signs for student-friendly implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicVitalSigns = void 0;
const ValueObject_1 = require("../../../shared/domain/ValueObject");
class BasicVitalSigns extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
        this.validate();
    }
    /**
     * Create BasicVitalSigns
     */
    static create(props) {
        return new BasicVitalSigns(props);
    }
    /**
     * Create empty vital signs
     */
    static createEmpty() {
        return new BasicVitalSigns({});
    }
    /**
     * Create from partial data
     */
    static createPartial(props) {
        return new BasicVitalSigns(props);
    }
    /**
     * Validate vital signs values
     */
    validate() {
        const { temperature, bloodPressure, heartRate, weight, height } = this.props;
        // Validate temperature (Celsius)
        if (temperature !== undefined) {
            if (typeof temperature !== 'number' || isNaN(temperature)) {
                throw new Error('Nhiệt độ phải là số');
            }
            if (temperature < 35.0 || temperature > 42.0) {
                throw new Error('Nhiệt độ phải từ 35.0°C đến 42.0°C');
            }
        }
        // Validate blood pressure format
        if (bloodPressure !== undefined) {
            if (typeof bloodPressure !== 'string') {
                throw new Error('Huyết áp phải là chuỗi');
            }
            const bpRegex = /^\d{2,3}\/\d{2,3}$/;
            if (!bpRegex.test(bloodPressure.trim())) {
                throw new Error('Huyết áp phải có định dạng "120/80"');
            }
            const [systolic, diastolic] = bloodPressure.split('/').map(Number);
            if (systolic < 70 || systolic > 250) {
                throw new Error('Huyết áp tâm thu phải từ 70 đến 250 mmHg');
            }
            if (diastolic < 40 || diastolic > 150) {
                throw new Error('Huyết áp tâm trương phải từ 40 đến 150 mmHg');
            }
            if (systolic <= diastolic) {
                throw new Error('Huyết áp tâm thu phải lớn hơn huyết áp tâm trương');
            }
        }
        // Validate heart rate (BPM)
        if (heartRate !== undefined) {
            if (typeof heartRate !== 'number' || isNaN(heartRate)) {
                throw new Error('Nhịp tim phải là số');
            }
            if (heartRate < 40 || heartRate > 200) {
                throw new Error('Nhịp tim phải từ 40 đến 200 BPM');
            }
        }
        // Validate weight (KG)
        if (weight !== undefined) {
            if (typeof weight !== 'number' || isNaN(weight)) {
                throw new Error('Cân nặng phải là số');
            }
            if (weight < 1.0 || weight > 300.0) {
                throw new Error('Cân nặng phải từ 1.0 đến 300.0 kg');
            }
        }
        // Validate height (CM)
        if (height !== undefined) {
            if (typeof height !== 'number' || isNaN(height)) {
                throw new Error('Chiều cao phải là số');
            }
            if (height < 30.0 || height > 250.0) {
                throw new Error('Chiều cao phải từ 30.0 đến 250.0 cm');
            }
        }
    }
    /**
     * Get temperature in Celsius
     */
    get temperature() {
        return this.props.temperature;
    }
    /**
     * Get blood pressure string
     */
    get bloodPressure() {
        return this.props.bloodPressure;
    }
    /**
     * Get systolic blood pressure
     */
    getSystolic() {
        if (!this.props.bloodPressure)
            return undefined;
        return parseInt(this.props.bloodPressure.split('/')[0]);
    }
    /**
     * Get diastolic blood pressure
     */
    getDiastolic() {
        if (!this.props.bloodPressure)
            return undefined;
        return parseInt(this.props.bloodPressure.split('/')[1]);
    }
    /**
     * Get heart rate in BPM
     */
    get heartRate() {
        return this.props.heartRate;
    }
    /**
     * Get weight in KG
     */
    get weight() {
        return this.props.weight;
    }
    /**
     * Get height in CM
     */
    get height() {
        return this.props.height;
    }
    /**
     * Calculate BMI if weight and height are available
     */
    calculateBMI() {
        if (!this.props.weight || !this.props.height)
            return undefined;
        const heightInMeters = this.props.height / 100;
        const bmi = this.props.weight / (heightInMeters * heightInMeters);
        return Math.round(bmi * 10) / 10; // Round to 1 decimal place
    }
    /**
     * Get BMI category in Vietnamese
     */
    getBMICategory() {
        const bmi = this.calculateBMI();
        if (!bmi)
            return undefined;
        if (bmi < 18.5)
            return 'Thiếu cân';
        if (bmi < 25)
            return 'Bình thường';
        if (bmi < 30)
            return 'Thừa cân';
        return 'Béo phì';
    }
    /**
     * Check if vital signs are complete
     */
    isComplete() {
        return !!(this.props.temperature &&
            this.props.bloodPressure &&
            this.props.heartRate &&
            this.props.weight &&
            this.props.height);
    }
    /**
     * Check if vital signs are empty
     */
    isEmpty() {
        return !(this.props.temperature ||
            this.props.bloodPressure ||
            this.props.heartRate ||
            this.props.weight ||
            this.props.height);
    }
    /**
     * Get available vital signs count
     */
    getAvailableCount() {
        let count = 0;
        if (this.props.temperature)
            count++;
        if (this.props.bloodPressure)
            count++;
        if (this.props.heartRate)
            count++;
        if (this.props.weight)
            count++;
        if (this.props.height)
            count++;
        return count;
    }
    /**
     * Update vital signs
     */
    update(updates) {
        return BasicVitalSigns.create({
            ...this.props,
            ...updates
        });
    }
    /**
     * Convert to plain object
     */
    toPlainObject() {
        return { ...this.props };
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return this.toPlainObject();
    }
    /**
     * Create from database value
     */
    static fromDatabase(value) {
        if (!value || typeof value !== 'object')
            return null;
        try {
            return BasicVitalSigns.create({
                temperature: value.temperature,
                bloodPressure: value.blood_pressure || value.bloodPressure,
                heartRate: value.heart_rate || value.heartRate,
                weight: value.weight,
                height: value.height
            });
        }
        catch (error) {
            console.warn('Invalid vital signs data from database:', error);
            return null;
        }
    }
    /**
     * Convert to database value
     */
    toDatabase() {
        return {
            temperature: this.props.temperature,
            blood_pressure: this.props.bloodPressure,
            heart_rate: this.props.heartRate,
            weight: this.props.weight,
            height: this.props.height
        };
    }
    /**
     * Get summary string in Vietnamese
     */
    getSummary() {
        const parts = [];
        if (this.props.temperature) {
            parts.push(`Nhiệt độ: ${this.props.temperature}°C`);
        }
        if (this.props.bloodPressure) {
            parts.push(`Huyết áp: ${this.props.bloodPressure} mmHg`);
        }
        if (this.props.heartRate) {
            parts.push(`Nhịp tim: ${this.props.heartRate} BPM`);
        }
        if (this.props.weight) {
            parts.push(`Cân nặng: ${this.props.weight} kg`);
        }
        if (this.props.height) {
            parts.push(`Chiều cao: ${this.props.height} cm`);
        }
        const bmi = this.calculateBMI();
        if (bmi) {
            parts.push(`BMI: ${bmi} (${this.getBMICategory()})`);
        }
        return parts.length > 0 ? parts.join(', ') : 'Chưa có thông tin sinh hiệu';
    }
}
exports.BasicVitalSigns = BasicVitalSigns;
//# sourceMappingURL=BasicVitalSigns.js.map