# Paperchat

Paperchat is a minimal, real-time group chat web app optimized for e-ink eReader browsers (Kindle, Kobo) while remaining usable on any device. Users create or join chat rooms using a 4-digit PIN code, identify themselves with a custom device name, and exchange messages instantly.

## Local Setup

Follow these steps to run the application locally:

1. **Clone the repository** and navigate to the directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Supabase Database Setup

Create a new project on [Supabase](https://supabase.com) and execute the following SQL script in the SQL Editor to create the necessary tables, configure indexes, set up Row Level Security (RLS) policies, and enable Realtime subscriptions:

```sql
-- 1. Create Rooms Table
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code char(4) not null unique,
  name text,
  created_at timestamptz default now(),
  last_active timestamptz default now()
);
create index on rooms(code);

-- 2. Create Messages Table
create table messages (
  id uuid primary key default gen_random_uuid(),
  room_code char(4) not null references rooms(code) on delete cascade,
  uid text not null,
  display_name text not null,
  body text not null,
  created_at timestamptz default now()
);
create index on messages(room_code, created_at desc);

-- 3. Configure Row Level Security (RLS)
alter table rooms enable row level security;
alter table messages enable row level security;

-- Policies for rooms (Allow open read & write for MVP)
create policy "Allow public read access to rooms" on rooms for select using (true);
create policy "Allow public insert access to rooms" on rooms for insert with check (true);
create policy "Allow public update access to rooms" on rooms for update using (true);

-- Policies for messages (Allow open read & write)
create policy "Allow public read access to messages" on messages for select using (true);
create policy "Allow public insert access to messages" on messages for insert with check (true);

-- 4. Enable Supabase Realtime for messages table
alter publication supabase_realtime add table messages;
```

---

## Deploying to Vercel

1. Push your code to a GitHub repository.
2. Import the repository into your Vercel account.
3. In Vercel's Project Settings, add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will automatically detect Next.js and build the application.

---

## eReader Usage Tips

- Open the browser on your Kindle (Experimental Browser) or Kobo (Beta Browser).
- Navigate to your deployed Vercel application URL.
- Bookmarks are highly recommended for quickly joining or returning to recent rooms.
