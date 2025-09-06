-- SQL script to add international shipping support to special_delivery_orders table
-- Run this in your Supabase SQL editor to enable international shipping features

-- First, update the product_type constraint to include international shipping cargo types
ALTER TABLE special_delivery_orders 
DROP CONSTRAINT IF EXISTS special_delivery_orders_product_type_check;

ALTER TABLE special_delivery_orders 
ADD CONSTRAINT special_delivery_orders_product_type_check 
CHECK (product_type IN ('electronics', 'documents', 'clothing', 'foodstuff', 'fragile', 'pharmaceuticals', 'other', 'hard_cargo', 'small_electronics'));

-- Add international shipping specific columns
ALTER TABLE special_delivery_orders 
ADD COLUMN IF NOT EXISTS origin_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS destination_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS customs_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(50) CHECK (cargo_type IN ('hard_cargo', 'small_electronics')),
ADD COLUMN IF NOT EXISTS transport_method VARCHAR(50) CHECK (transport_method IN ('air', 'sea', 'land', 'multimodal')),
ADD COLUMN IF NOT EXISTS transport_multiplier DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS cargo_rate_per_kg DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS distance_rate_per_km DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN special_delivery_orders.origin_country IS 'Country of origin for international shipments';
COMMENT ON COLUMN special_delivery_orders.destination_country IS 'Destination country for international shipments';
COMMENT ON COLUMN special_delivery_orders.customs_value IS 'Declared customs value for international shipments';
COMMENT ON COLUMN special_delivery_orders.cargo_type IS 'Type of cargo: hard_cargo (cars, machinery) or small_electronics';
COMMENT ON COLUMN special_delivery_orders.transport_method IS 'Method of transport: air, sea, land, or multimodal';
COMMENT ON COLUMN special_delivery_orders.transport_multiplier IS 'Pricing multiplier based on transport method (1.4 for air, 1.0 for others)';
COMMENT ON COLUMN special_delivery_orders.cargo_rate_per_kg IS 'Base rate per kg based on cargo type (1430 for hard cargo, 700 for electronics)';
COMMENT ON COLUMN special_delivery_orders.distance_rate_per_km IS 'Rate per km based on cargo type (140 for hard cargo, 200 for electronics)';

-- Create an index for international shipping queries
CREATE INDEX IF NOT EXISTS idx_special_delivery_international 
ON special_delivery_orders(service_type, origin_country, destination_country) 
WHERE service_type = 'international_shipping';

-- Create an index for cargo type queries
CREATE INDEX IF NOT EXISTS idx_special_delivery_cargo_type 
ON special_delivery_orders(cargo_type, transport_method) 
WHERE service_type = 'international_shipping';

-- Update the table constraints to ensure international shipping data integrity
-- This constraint ensures that international shipping orders have required fields
CREATE OR REPLACE FUNCTION validate_international_shipping_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate international shipping specific fields
    IF NEW.service_type = 'international_shipping' THEN
        -- Ensure required fields are present
        IF NEW.origin_country IS NULL OR NEW.destination_country IS NULL THEN
            RAISE EXCEPTION 'International shipping orders must have origin and destination countries';
        END IF;
        
        IF NEW.cargo_type IS NULL THEN
            RAISE EXCEPTION 'International shipping orders must specify cargo type';
        END IF;
        
        IF NEW.transport_method IS NULL THEN
            RAISE EXCEPTION 'International shipping orders must specify transport method';
        END IF;
        
        -- Set default values for pricing fields if not provided
        IF NEW.transport_multiplier IS NULL THEN
            NEW.transport_multiplier := CASE 
                WHEN NEW.transport_method = 'air' THEN 1.4
                ELSE 1.0
            END;
        END IF;
        
        IF NEW.cargo_rate_per_kg IS NULL THEN
            NEW.cargo_rate_per_kg := CASE 
                WHEN NEW.cargo_type = 'hard_cargo' THEN 1430.00
                WHEN NEW.cargo_type = 'small_electronics' THEN 700.00
                ELSE 1000.00
            END;
        END IF;
        
        IF NEW.distance_rate_per_km IS NULL THEN
            NEW.distance_rate_per_km := CASE 
                WHEN NEW.cargo_type = 'hard_cargo' THEN 140.00
                WHEN NEW.cargo_type = 'small_electronics' THEN 200.00
                ELSE 500.00
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_international_shipping_trigger ON special_delivery_orders;
CREATE TRIGGER validate_international_shipping_trigger
    BEFORE INSERT OR UPDATE ON special_delivery_orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_international_shipping_data();

-- Create a view for international shipping analytics
CREATE OR REPLACE VIEW international_shipping_analytics AS
SELECT 
    origin_country,
    destination_country,
    cargo_type,
    transport_method,
    COUNT(*) as order_count,
    AVG(total_cost) as avg_cost,
    AVG(weight_kg) as avg_weight,
    AVG(distance_km) as avg_distance,
    SUM(total_cost) as total_revenue
FROM special_delivery_orders 
WHERE service_type = 'international_shipping'
  AND status != 'cancelled'
GROUP BY origin_country, destination_country, cargo_type, transport_method
ORDER BY order_count DESC;

-- Grant permissions to authenticated users
GRANT SELECT ON international_shipping_analytics TO authenticated;

-- Insert some sample data for testing (optional - remove if not needed)
-- INSERT INTO special_delivery_orders (
--     order_number, service_type, sender_name, sender_phone, recipient_name, recipient_phone,
--     product_description, weight_kg, distance_km, total_cost, status,
--     origin_country, destination_country, cargo_type, transport_method, customs_value
-- ) VALUES (
--     'INT' || EXTRACT(EPOCH FROM NOW())::bigint || '001',
--     'international_shipping',
--     'Test Sender',
--     '+254700000000',
--     'Test Recipient', 
--     '+1234567890',
--     'Test cargo for international shipping',
--     50.0,
--     5000.0,
--     1215000.0, -- (50 * 1430) + (5000 * 1000) * 1.4 for air freight
--     'pending',
--     'Kenya',
--     'United States',
--     'hard_cargo',
--     'air',
--     25000.00
-- );

COMMIT;

-- Verification queries
-- Run these to verify the changes were applied correctly:

-- 1. Check if new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'special_delivery_orders' 
  AND column_name IN ('origin_country', 'destination_country', 'cargo_type', 'transport_method', 'customs_value')
ORDER BY column_name;

-- 2. Check constraints
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'special_delivery_orders'::regclass 
  AND (conname LIKE '%cargo_type%' OR conname LIKE '%transport_method%');

-- 3. Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'special_delivery_orders' 
  AND indexname LIKE '%international%' OR indexname LIKE '%cargo%';

-- 4. Test the view
SELECT * FROM international_shipping_analytics LIMIT 5;
