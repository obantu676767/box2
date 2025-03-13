-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create energy_data table
CREATE TABLE energy_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT NOT NULL,
  energy_consumption DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own devices" 
  ON devices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices" 
  ON devices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" 
  ON devices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" 
  ON devices FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own energy data" 
  ON energy_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own energy data" 
  ON energy_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create sample data for testing
-- This would be removed in production
INSERT INTO devices (user_id, name, type, status)
VALUES 
  ('YOUR_USER_ID', 'Living Room Lights', 'light', true),
  ('YOUR_USER_ID', 'Kitchen Appliances', 'appliance', false),
  ('YOUR_USER_ID', 'Bedroom AC', 'climate', true),
  ('YOUR_USER_ID', 'Home Office', 'office', true),
  ('YOUR_USER_ID', 'Entertainment System', 'entertainment', false);

-- Insert sample energy data
INSERT INTO energy_data (user_id, device_id, device_name, energy_consumption, timestamp)
VALUES
  ('YOUR_USER_ID', 'DEVICE_ID_1', 'Living Room Lights', 0.5, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'DEVICE_ID_1', 'Living Room Lights', 0.7, NOW() - INTERVAL '2 days'),
  ('YOUR_USER_ID', 'DEVICE_ID_2', 'Kitchen Appliances', 2.3, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'DEVICE_ID_3', 'Bedroom AC', 1.8, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'DEVICE_ID_3', 'Bedroom AC', 1.9, NOW() - INTERVAL '2 days'),
  ('YOUR_USER_ID', 'DEVICE_ID_4', 'Home Office', 1.2, NOW() - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'DEVICE_ID_5', 'Entertainment System', 0.9, NOW() - INTERVAL '3 days');

