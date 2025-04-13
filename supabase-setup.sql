-- Create a table for user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  reasoning TEXT,
  generation_time INTEGER,
  web_search_metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for message versions
CREATE TABLE IF NOT EXISTS message_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES chat_messages ON DELETE CASCADE,
  content TEXT NOT NULL,
  reasoning TEXT,
  generation_time INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create policies for chat sessions
CREATE POLICY IF NOT EXISTS "Users can view their own chat sessions" 
  ON chat_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own chat sessions" 
  ON chat_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own chat sessions" 
  ON chat_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own chat sessions" 
  ON chat_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for chat messages
CREATE POLICY IF NOT EXISTS "Users can view messages in their chat sessions" 
  ON chat_messages FOR SELECT 
  USING ((SELECT user_id FROM chat_sessions WHERE id = session_id) = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert messages in their chat sessions" 
  ON chat_messages FOR INSERT 
  WITH CHECK ((SELECT user_id FROM chat_sessions WHERE id = session_id) = auth.uid());

-- Create policies for message versions
CREATE POLICY IF NOT EXISTS "Users can view message versions in their chat sessions" 
  ON message_versions FOR SELECT 
  USING ((SELECT user_id FROM chat_sessions WHERE id = 
          (SELECT session_id FROM chat_messages WHERE id = message_id)) = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert message versions in their chat sessions" 
  ON message_versions FOR INSERT 
  WITH CHECK ((SELECT user_id FROM chat_sessions WHERE id = 
              (SELECT session_id FROM chat_messages WHERE id = message_id)) = auth.uid());

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a policy to allow the trigger function to insert into profiles
CREATE POLICY IF NOT EXISTS "Allow trigger to create profiles" 
  ON profiles FOR INSERT 
  WITH CHECK (true);
