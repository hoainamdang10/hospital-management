-- Payment System Database Schema
-- This file creates the necessary tables for PayOS payment integration

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    appointment_id VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('payos', 'cash')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    user_id UUID NOT NULL,
    
    -- PayOS specific fields
    payment_link_id VARCHAR(100),
    checkout_url TEXT,
    qr_code TEXT,
    transaction_id VARCHAR(100),
    
    -- Additional payment info
    patient_info JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    failure_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_order_code ON payments(order_code);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Create payment receipts view for detailed receipt information
CREATE OR REPLACE VIEW payment_receipts_view AS
SELECT 
    p.id as payment_id,
    p.order_code,
    p.amount,
    p.status,
    p.payment_method,
    p.transaction_id,
    p.created_at,
    p.appointment_id,
    p.description,
    
    -- Patient Info
    prof.full_name as patient_name,
    prof.patient_id,
    prof.phone as patient_phone,
    prof.email as patient_email,
    
    -- Appointment Info (from appointments table if exists)
    COALESCE(
        (p.patient_info->>'doctorName')::text,
        'Dr. Unknown'
    ) as doctor_name,
    COALESCE(
        (p.patient_info->>'department')::text,
        'General Medicine'
    ) as department,
    COALESCE(
        (p.patient_info->>'appointmentDate')::text,
        p.created_at::text
    ) as appointment_date,
    COALESCE(
        (p.patient_info->>'timeSlot')::text,
        '09:00 - 10:00'
    ) as time_slot,
    
    -- Billing Details (calculated from amount)
    ROUND(p.amount / 1.1, 2) as consultation_fee,
    ROUND(p.amount * 0.05, 2) as service_fee,
    ROUND(p.amount * 0.1, 2) as vat,
    p.amount as total,
    
    -- Hospital Info (static for now)
    'BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG' as hospital_name,
    '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh' as hospital_address,
    '028-1234-5678' as hospital_phone,
    '0123456789' as hospital_tax_code,
    
    -- Doctor ID (extracted from appointment if available)
    COALESCE(
        (p.patient_info->>'doctorId')::text,
        'DOC-001'
    ) as doctor_id,
    
    p.user_id
FROM payments p
JOIN profiles prof ON p.user_id = prof.id
WHERE prof.role = 'patient';

-- Create payment statistics view
CREATE OR REPLACE VIEW payment_statistics_view AS
SELECT 
    DATE_TRUNC('day', created_at) as payment_date,
    payment_method,
    status,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM payments
GROUP BY DATE_TRUNC('day', created_at), payment_method, status
ORDER BY payment_date DESC;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate order codes
CREATE OR REPLACE FUNCTION generate_order_code(prefix TEXT DEFAULT 'HOS')
RETURNS TEXT AS $$
DECLARE
    timestamp_part BIGINT;
    random_part INTEGER;
    order_code TEXT;
BEGIN
    timestamp_part := EXTRACT(EPOCH FROM NOW()) * 1000;
    random_part := FLOOR(RANDOM() * 1000);
    order_code := prefix || timestamp_part::TEXT || LPAD(random_part::TEXT, 3, '0');
    RETURN order_code;
END;
$$ LANGUAGE plpgsql;

-- Insert sample payment data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
INSERT INTO payments (
    order_code,
    appointment_id,
    amount,
    description,
    payment_method,
    status,
    user_id,
    patient_info
) VALUES 
(
    generate_order_code('HOS'),
    'APT-202412-001',
    500000,
    'Thanh toán khám bệnh - Khoa Tim mạch',
    'payos',
    'success',
    (SELECT id FROM profiles WHERE email = 'patient@hospital.com' LIMIT 1),
    '{"doctorName": "BS. Nguyễn Văn A", "department": "Khoa Tim mạch", "appointmentDate": "2024-12-29", "timeSlot": "09:00 - 10:00"}'::jsonb
),
(
    generate_order_code('CASH'),
    'APT-202412-002',
    300000,
    'Thanh toán tiền mặt - Khoa Nội tổng hợp',
    'cash',
    'pending',
    (SELECT id FROM profiles WHERE email = 'patient@hospital.com' LIMIT 1),
    '{"doctorName": "BS. Trần Thị B", "department": "Khoa Nội tổng hợp", "appointmentDate": "2024-12-30", "timeSlot": "14:00 - 15:00"}'::jsonb
);
*/

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO authenticated;
GRANT SELECT ON payment_receipts_view TO authenticated;
GRANT SELECT ON payment_statistics_view TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create RLS (Row Level Security) policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own payments
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own payments (limited fields)
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for backend services)
CREATE POLICY "Service role full access" ON payments
    FOR ALL USING (current_setting('role') = 'service_role');

COMMENT ON TABLE payments IS 'Payment transactions for hospital services with PayOS integration';
COMMENT ON VIEW payment_receipts_view IS 'Detailed view for generating payment receipts';
COMMENT ON VIEW payment_statistics_view IS 'Aggregated payment statistics for reporting';
COMMENT ON FUNCTION generate_order_code IS 'Generate unique order codes for payments';
COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update the updated_at timestamp';

-- Create notification function for payment status changes
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM pg_notify(
            'payment_status_changed',
            json_build_object(
                'payment_id', NEW.id,
                'order_code', NEW.order_code,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'user_id', NEW.user_id,
                'amount', NEW.amount,
                'appointment_id', NEW.appointment_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status notifications
DROP TRIGGER IF EXISTS payment_status_change_trigger ON payments;
CREATE TRIGGER payment_status_change_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_status_change();

COMMENT ON FUNCTION notify_payment_status_change IS 'Send notifications when payment status changes';
COMMENT ON TRIGGER payment_status_change_trigger ON payments IS 'Trigger to notify payment status changes';
