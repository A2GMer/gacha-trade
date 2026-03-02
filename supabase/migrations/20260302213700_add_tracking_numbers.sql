-- Add tracking numbers for trades
ALTER TABLE trades ADD COLUMN proposer_tracking_number text;
ALTER TABLE trades ADD COLUMN receiver_tracking_number text;
