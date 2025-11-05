"use strict";
/**
 * Money Value Object - Domain Layer
 * Represents monetary amounts in Vietnamese healthcare system
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Currency Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
const ValueObject_1 = require("../../../../shared/domain/ValueObject");
/**
 * Money Value Object
 * Handles Vietnamese Dong (VND) with proper precision and formatting
 */
class Money extends ValueObject_1.ValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create Money from amount and currency
     */
    static create(amount, currency = "VND") {
        if (amount < 0) {
            throw new Error("Số tiền không được âm");
        }
        if (!this.isValidCurrency(currency)) {
            throw new Error(`Loại tiền tệ không hợp lệ: ${currency}`);
        }
        // Round to appropriate precision for currency
        const roundedAmount = this.roundToCurrencyPrecision(amount, currency);
        return new Money({
            amount: roundedAmount,
            currency: currency.toUpperCase(),
        });
    }
    /**
     * Create VND money
     */
    static createVND(amount) {
        return this.create(amount, "VND");
    }
    /**
     * Create USD money
     */
    static createUSD(amount) {
        return this.create(amount, "USD");
    }
    /**
     * Create zero money
     */
    static zero(currency = "VND") {
        return this.create(0, currency);
    }
    /**
     * Create from string representation
     */
    static fromString(value) {
        // Parse formats like "1,000,000 VND", "1000000", "$100.50"
        const cleanValue = value.replace(/[,\s]/g, "");
        let amount;
        let currency = "VND";
        if (cleanValue.includes("$")) {
            amount = parseFloat(cleanValue.replace("$", ""));
            currency = "USD";
        }
        else if (cleanValue.includes("VND") || cleanValue.includes("đ")) {
            amount = parseFloat(cleanValue.replace(/VND|đ/g, ""));
            currency = "VND";
        }
        else {
            amount = parseFloat(cleanValue);
        }
        if (isNaN(amount)) {
            throw new Error(`Không thể parse số tiền từ: ${value}`);
        }
        return this.create(amount, currency);
    }
    /**
     * Get amount
     */
    get amount() {
        return this.props.amount;
    }
    /**
     * Get currency
     */
    get currency() {
        return this.props.currency;
    }
    /**
     * Check if zero
     */
    isZero() {
        return this.props.amount === 0;
    }
    /**
     * Check if positive
     */
    isPositive() {
        return this.props.amount > 0;
    }
    /**
     * Check if negative (should not happen in our domain)
     */
    isNegative() {
        return this.props.amount < 0;
    }
    /**
     * Add money
     */
    add(other) {
        this.ensureSameCurrency(other);
        return Money.create(this.props.amount + other.props.amount, this.props.currency);
    }
    /**
     * Subtract money
     */
    subtract(other) {
        this.ensureSameCurrency(other);
        const result = this.props.amount - other.props.amount;
        if (result < 0) {
            throw new Error("Kết quả phép trừ không được âm");
        }
        return Money.create(result, this.props.currency);
    }
    /**
     * Multiply by factor
     */
    multiply(factor) {
        if (factor < 0) {
            throw new Error("Hệ số nhân không được âm");
        }
        return Money.create(this.props.amount * factor, this.props.currency);
    }
    /**
     * Divide by factor
     */
    divide(factor) {
        if (factor <= 0) {
            throw new Error("Hệ số chia phải lớn hơn 0");
        }
        return Money.create(this.props.amount / factor, this.props.currency);
    }
    /**
     * Calculate percentage
     */
    percentage(percent) {
        if (percent < 0 || percent > 100) {
            throw new Error("Phần trăm phải từ 0 đến 100");
        }
        return this.multiply(percent / 100);
    }
    /**
     * Apply discount
     */
    applyDiscount(discountPercent) {
        const discountAmount = this.percentage(discountPercent);
        return this.subtract(discountAmount);
    }
    /**
     * Apply tax
     */
    applyTax(taxPercent) {
        const taxAmount = this.percentage(taxPercent);
        return this.add(taxAmount);
    }
    /**
     * Apply Vietnamese VAT (10%)
     */
    applyVietnameseVAT() {
        return this.applyTax(10);
    }
    /**
     * Calculate Vietnamese VAT amount
     */
    getVietnameseVATAmount() {
        return this.percentage(10);
    }
    /**
     * Get amount without VAT (reverse calculation)
     */
    getAmountWithoutVAT() {
        // If current amount includes VAT, calculate original amount
        // Formula: original = current / 1.1
        return this.divide(1.1);
    }
    /**
     * Compare with another Money
     */
    compareTo(other) {
        this.ensureSameCurrency(other);
        if (this.props.amount < other.props.amount)
            return -1;
        if (this.props.amount > other.props.amount)
            return 1;
        return 0;
    }
    /**
     * Check if equal
     */
    equals(other) {
        return this.compareTo(other) === 0;
    }
    /**
     * Check if greater than
     */
    greaterThan(other) {
        return this.compareTo(other) > 0;
    }
    /**
     * Check if less than
     */
    lessThan(other) {
        return this.compareTo(other) < 0;
    }
    /**
     * Check if greater than or equal
     */
    greaterThanOrEqual(other) {
        return this.compareTo(other) >= 0;
    }
    /**
     * Check if less than or equal
     */
    lessThanOrEqual(other) {
        return this.compareTo(other) <= 0;
    }
    /**
     * Get maximum of two Money values
     */
    max(other) {
        return this.greaterThan(other) ? this : other;
    }
    /**
     * Get minimum of two Money values
     */
    min(other) {
        return this.lessThan(other) ? this : other;
    }
    /**
     * Format for display
     */
    format() {
        if (this.props.currency === "VND") {
            return this.formatVND();
        }
        else if (this.props.currency === "USD") {
            return this.formatUSD();
        }
        return `${this.props.amount.toLocaleString()} ${this.props.currency}`;
    }
    /**
     * Format VND
     */
    formatVND() {
        const formatted = Math.round(this.props.amount).toLocaleString("vi-VN");
        return `${formatted} đ`;
    }
    /**
     * Format USD
     */
    formatUSD() {
        return `$${this.props.amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }
    /**
     * Format for Vietnamese invoice
     */
    formatVietnameseInvoice() {
        const amount = Math.round(this.props.amount);
        const formatted = amount.toLocaleString("vi-VN");
        return `${formatted} đồng`;
    }
    /**
     * Convert to words (Vietnamese)
     */
    toVietnameseWords() {
        if (this.props.currency !== "VND") {
            throw new Error("Chỉ hỗ trợ chuyển đổi sang chữ cho VND");
        }
        return this.convertVNDToWords(Math.round(this.props.amount));
    }
    /**
     * Get currency symbol
     */
    getCurrencySymbol() {
        switch (this.props.currency) {
            case "VND":
                return "đ";
            case "USD":
                return "$";
            default:
                return this.props.currency;
        }
    }
    /**
     * Convert to different currency (simplified - in real app would use exchange rates)
     */
    convertTo(targetCurrency, exchangeRate) {
        if (!Money.isValidCurrency(targetCurrency)) {
            throw new Error(`Loại tiền tệ không hợp lệ: ${targetCurrency}`);
        }
        if (exchangeRate <= 0) {
            throw new Error("Tỷ giá hối đoái phải lớn hơn 0");
        }
        const convertedAmount = this.props.amount * exchangeRate;
        return Money.create(convertedAmount, targetCurrency);
    }
    /**
     * Split into multiple parts
     */
    split(parts) {
        if (parts <= 0) {
            throw new Error("Số phần phải lớn hơn 0");
        }
        const partAmount = this.props.amount / parts;
        const result = [];
        for (let i = 0; i < parts; i++) {
            result.push(Money.create(partAmount, this.props.currency));
        }
        return result;
    }
    /**
     * Allocate proportionally
     */
    allocate(ratios) {
        if (ratios.length === 0) {
            throw new Error("Tỷ lệ phân bổ không được rỗng");
        }
        const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);
        if (totalRatio <= 0) {
            throw new Error("Tổng tỷ lệ phải lớn hơn 0");
        }
        const result = [];
        let remainder = this.props.amount;
        for (let i = 0; i < ratios.length - 1; i++) {
            const allocation = Math.floor((this.props.amount * ratios[i]) / totalRatio);
            result.push(Money.create(allocation, this.props.currency));
            remainder -= allocation;
        }
        // Last allocation gets the remainder to handle rounding
        result.push(Money.create(remainder, this.props.currency));
        return result;
    }
    /**
     * Check if valid currency
     */
    static isValidCurrency(currency) {
        const validCurrencies = ["VND", "USD", "EUR", "JPY"];
        return validCurrencies.includes(currency.toUpperCase());
    }
    /**
     * Round to currency precision
     */
    static roundToCurrencyPrecision(amount, currency) {
        switch (currency.toUpperCase()) {
            case "VND":
                // VND doesn't use decimal places
                return Math.round(amount);
            case "USD":
            case "EUR":
                // USD and EUR use 2 decimal places
                return Math.round(amount * 100) / 100;
            case "JPY":
                // JPY doesn't use decimal places
                return Math.round(amount);
            default:
                return Math.round(amount * 100) / 100;
        }
    }
    /**
     * Ensure same currency for operations
     */
    ensureSameCurrency(other) {
        if (this.props.currency !== other.props.currency) {
            throw new Error(`Không thể thực hiện phép tính với các loại tiền tệ khác nhau: ${this.props.currency} và ${other.props.currency}`);
        }
    }
    /**
     * Convert VND to Vietnamese words
     */
    convertVNDToWords(amount) {
        if (amount === 0)
            return "Không đồng";
        const ones = [
            "",
            "một",
            "hai",
            "ba",
            "bốn",
            "năm",
            "sáu",
            "bảy",
            "tám",
            "chín",
        ];
        const tens = [
            "",
            "",
            "hai mươi",
            "ba mươi",
            "bốn mươi",
            "năm mươi",
            "sáu mươi",
            "bảy mươi",
            "tám mươi",
            "chín mươi",
        ];
        const scales = ["", "nghìn", "triệu", "tỷ"];
        // Simplified implementation - in real app would use a proper Vietnamese number-to-words library
        if (amount < 1000) {
            return `${this.convertHundreds(amount, ones, tens)} đồng`;
        }
        // For larger amounts, use a simplified approach
        return `${amount.toLocaleString("vi-VN")} đồng (bằng chữ)`;
    }
    /**
     * Convert hundreds place
     */
    convertHundreds(num, ones, tens) {
        let result = "";
        const hundred = Math.floor(num / 100);
        const remainder = num % 100;
        if (hundred > 0) {
            result += ones[hundred] + " trăm";
        }
        if (remainder > 0) {
            if (result)
                result += " ";
            if (remainder < 10) {
                result += ones[remainder];
            }
            else if (remainder < 20) {
                result += "mười";
                if (remainder > 10) {
                    result += " " + ones[remainder - 10];
                }
            }
            else {
                const ten = Math.floor(remainder / 10);
                const one = remainder % 10;
                result += tens[ten];
                if (one > 0) {
                    result += " " + ones[one];
                }
            }
        }
        return result;
    }
    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            amount: this.props.amount,
            currency: this.props.currency,
            formatted: this.format(),
            vietnameseFormatted: this.props.currency === "VND"
                ? this.formatVietnameseInvoice()
                : this.format(),
            currencySymbol: this.getCurrencySymbol(),
            isZero: this.isZero(),
            isPositive: this.isPositive(),
            vatAmount: this.props.currency === "VND"
                ? this.getVietnameseVATAmount().amount
                : null,
            amountWithVAT: this.props.currency === "VND" ? this.applyVietnameseVAT().amount : null,
        };
    }
    /**
     * String representation
     */
    toString() {
        return this.format();
    }
}
exports.Money = Money;
//# sourceMappingURL=Money.js.map