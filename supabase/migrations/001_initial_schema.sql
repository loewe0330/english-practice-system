-- 英语知识清单智能练习系统 MVP schema.
-- MVP 阶段允许 anon 读写，便于无登录前端验证流程；正式上线前必须改为基于 auth.uid()/角色的细粒度权限。

create table if not exists public.grades (
  id text primary key,
  stage text not null default 'primary',
  grade integer not null,
  semester text not null,
  display_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id text primary key,
  grade_id text not null references public.grades(id) on delete cascade,
  stage text not null default 'primary',
  grade integer not null,
  semester text not null,
  display_name text not null,
  name text not null,
  publisher text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.units (
  id text primary key,
  grade_id text not null references public.grades(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  unit_no integer not null,
  display_name text not null,
  name text not null,
  title text not null,
  sort_order integer not null default 0,
  phonics jsonb not null default '[]'::jsonb,
  writing jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_words (
  id text primary key,
  grade_id text not null references public.grades(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  unit_id text not null references public.units(id) on delete cascade,
  english text not null,
  chinese text not null,
  part_of_speech text not null default '',
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_phrases (
  id text primary key,
  grade_id text not null references public.grades(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  unit_id text not null references public.units(id) on delete cascade,
  english text not null,
  chinese text not null,
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_sentences (
  id text primary key,
  grade_id text not null references public.grades(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  unit_id text not null references public.units(id) on delete cascade,
  english text not null,
  chinese text not null,
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grammar_points (
  id text primary key,
  grade_id text not null references public.grades(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  unit_id text not null references public.units(id) on delete cascade,
  title text not null,
  explanation text not null default '',
  examples jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extension_categories (
  id text primary key,
  grade_id text,
  recommended_grade_ids jsonb not null default '[]'::jsonb,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extension_words (
  id text primary key,
  grade_id text,
  category_id text not null references public.extension_categories(id) on delete cascade,
  recommended_grade_ids jsonb not null default '[]'::jsonb,
  english text not null,
  chinese text not null,
  part_of_speech text not null default '',
  difficulty text not null default '基础',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extension_phrases (
  id text primary key,
  grade_id text,
  category_id text not null references public.extension_categories(id) on delete cascade,
  recommended_grade_ids jsonb not null default '[]'::jsonb,
  english text not null,
  chinese text not null,
  difficulty text not null default '基础',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_attempts (
  id text primary key,
  paper_id text not null,
  title text not null default '',
  created_at timestamptz,
  submitted_at timestamptz not null,
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  blank_count integer not null default 0,
  spelling_error_count integer not null default 0,
  punctuation_error_count integer not null default 0,
  score numeric not null default 0,
  source_summary text not null default '',
  paper jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_answers (
  id text primary key,
  attempt_id text not null references public.practice_attempts(id) on delete cascade,
  question_id text not null,
  grade_id text,
  book_id text,
  unit_id text,
  category_id text,
  source_type text,
  source_item_id text,
  question_type text,
  source_label text not null default '',
  prompt text not null default '',
  student_answer text not null default '',
  correct_answer text not null default '',
  is_correct boolean not null default false,
  error_type text not null default 'wrong',
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.wrong_book_items (
  id text primary key,
  question_id text not null,
  grade_id text,
  book_id text,
  unit_id text,
  category_id text,
  source_type text not null,
  source_item_id text,
  question_type text not null default 'zh_to_en',
  source_label text not null default '',
  prompt text not null default '',
  correct_answer text not null default '',
  student_answer text not null default '',
  error_type text not null default 'wrong',
  wrong_count integer not null default 1,
  error_count integer not null default 1,
  first_wrong_at timestamptz not null,
  last_wrong_at timestamptz not null,
  mastered boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.grades enable row level security;
alter table public.books enable row level security;
alter table public.units enable row level security;
alter table public.knowledge_words enable row level security;
alter table public.knowledge_phrases enable row level security;
alter table public.knowledge_sentences enable row level security;
alter table public.grammar_points enable row level security;
alter table public.extension_categories enable row level security;
alter table public.extension_words enable row level security;
alter table public.extension_phrases enable row level security;
alter table public.practice_attempts enable row level security;
alter table public.practice_answers enable row level security;
alter table public.wrong_book_items enable row level security;

drop policy if exists "anon read grades" on public.grades;
create policy "anon read grades" on public.grades for select to anon using (true);
drop policy if exists "anon write grades" on public.grades;
create policy "anon write grades" on public.grades for all to anon using (true) with check (true);

drop policy if exists "anon read books" on public.books;
create policy "anon read books" on public.books for select to anon using (true);
drop policy if exists "anon write books" on public.books;
create policy "anon write books" on public.books for all to anon using (true) with check (true);

drop policy if exists "anon read units" on public.units;
create policy "anon read units" on public.units for select to anon using (true);
drop policy if exists "anon write units" on public.units;
create policy "anon write units" on public.units for all to anon using (true) with check (true);

drop policy if exists "anon read knowledge_words" on public.knowledge_words;
create policy "anon read knowledge_words" on public.knowledge_words for select to anon using (true);
drop policy if exists "anon write knowledge_words" on public.knowledge_words;
create policy "anon write knowledge_words" on public.knowledge_words for all to anon using (true) with check (true);

drop policy if exists "anon read knowledge_phrases" on public.knowledge_phrases;
create policy "anon read knowledge_phrases" on public.knowledge_phrases for select to anon using (true);
drop policy if exists "anon write knowledge_phrases" on public.knowledge_phrases;
create policy "anon write knowledge_phrases" on public.knowledge_phrases for all to anon using (true) with check (true);

drop policy if exists "anon read knowledge_sentences" on public.knowledge_sentences;
create policy "anon read knowledge_sentences" on public.knowledge_sentences for select to anon using (true);
drop policy if exists "anon write knowledge_sentences" on public.knowledge_sentences;
create policy "anon write knowledge_sentences" on public.knowledge_sentences for all to anon using (true) with check (true);

drop policy if exists "anon read grammar_points" on public.grammar_points;
create policy "anon read grammar_points" on public.grammar_points for select to anon using (true);
drop policy if exists "anon write grammar_points" on public.grammar_points;
create policy "anon write grammar_points" on public.grammar_points for all to anon using (true) with check (true);

drop policy if exists "anon read extension_categories" on public.extension_categories;
create policy "anon read extension_categories" on public.extension_categories for select to anon using (true);
drop policy if exists "anon write extension_categories" on public.extension_categories;
create policy "anon write extension_categories" on public.extension_categories for all to anon using (true) with check (true);

drop policy if exists "anon read extension_words" on public.extension_words;
create policy "anon read extension_words" on public.extension_words for select to anon using (true);
drop policy if exists "anon write extension_words" on public.extension_words;
create policy "anon write extension_words" on public.extension_words for all to anon using (true) with check (true);

drop policy if exists "anon read extension_phrases" on public.extension_phrases;
create policy "anon read extension_phrases" on public.extension_phrases for select to anon using (true);
drop policy if exists "anon write extension_phrases" on public.extension_phrases;
create policy "anon write extension_phrases" on public.extension_phrases for all to anon using (true) with check (true);

drop policy if exists "anon read practice_attempts" on public.practice_attempts;
create policy "anon read practice_attempts" on public.practice_attempts for select to anon using (true);
drop policy if exists "anon write practice_attempts" on public.practice_attempts;
create policy "anon write practice_attempts" on public.practice_attempts for all to anon using (true) with check (true);

drop policy if exists "anon read practice_answers" on public.practice_answers;
create policy "anon read practice_answers" on public.practice_answers for select to anon using (true);
drop policy if exists "anon write practice_answers" on public.practice_answers;
create policy "anon write practice_answers" on public.practice_answers for all to anon using (true) with check (true);

drop policy if exists "anon read wrong_book_items" on public.wrong_book_items;
create policy "anon read wrong_book_items" on public.wrong_book_items for select to anon using (true);
drop policy if exists "anon write wrong_book_items" on public.wrong_book_items;
create policy "anon write wrong_book_items" on public.wrong_book_items for all to anon using (true) with check (true);
