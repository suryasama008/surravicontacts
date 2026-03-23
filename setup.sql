-- ============================================================
-- ContactBase - Complete Supabase Setup
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- 1. COMPANIES
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  types text[] default '{}',
  country text,
  city text,
  address text,
  phones text[] default '{}',
  emails text[] default '{}',
  website text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CONTACTS
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phones text[] default '{}',
  job_title text,
  company_id uuid references companies(id) on delete set null,
  company_name text,
  emails text[] default '{}',
  city text,
  address text,
  tags text[] default '{}',
  notes text,
  company_history jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (full_name, company_name)
);

-- 3. MATERIALS LIBRARY
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz default now()
);

-- 4. COMPANY <-> MATERIALS (junction)
create table if not exists company_materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  material_id uuid not null references materials(id) on delete cascade,
  price numeric(12,2) default null,
  notes text default null,
  unique (company_id, material_id)
);

-- 5. EXTENSIONS (must come before indexes that use them)
create extension if not exists pg_trgm;

-- 6. INDEXES
create index if not exists contacts_full_name_idx on contacts (full_name);
create index if not exists contacts_company_id_idx on contacts (company_id);
create index if not exists contacts_city_idx on contacts (city);
create index if not exists contacts_name_trgm_idx on contacts using gin (full_name gin_trgm_ops);
create index if not exists companies_name_trgm_idx on companies using gin (name gin_trgm_ops);
create index if not exists materials_name_trgm_idx on materials using gin (name gin_trgm_ops);

-- 6. AUTO updated_at TRIGGER
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create or replace trigger companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- 7. COMPANY CHANGE HISTORY TRIGGER
-- When company_id changes, old company is auto-saved to company_history
create or replace function handle_company_change()
returns trigger as $$
begin
  if old.company_id is distinct from new.company_id
     and old.company_name is not null then
    new.company_history = coalesce(old.company_history, '[]'::jsonb) || jsonb_build_object(
      'name', old.company_name,
      'company_id', old.company_id,
      'until', extract(year from now())::int
    );
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger company_history_trigger
  before update on contacts
  for each row execute function handle_company_change();

-- 8. ROW LEVEL SECURITY
alter table contacts enable row level security;
alter table companies enable row level security;
alter table materials enable row level security;
alter table company_materials enable row level security;

-- Allow all operations for anon (personal use, no auth)
create policy "allow all contacts" on contacts for all to anon using (true) with check (true);
create policy "allow all companies" on companies for all to anon using (true) with check (true);
create policy "allow all materials" on materials for all to anon using (true) with check (true);
create policy "allow all company_materials" on company_materials for all to anon using (true) with check (true);

-- ============================================================
-- 9. SEED: MATERIALS from Surravi Phharma product list
-- ============================================================

insert into materials (name, category) values

-- Empty Capsules
('Empty Capsules - Gelatin (Plain)', 'Empty Capsules'),
('Empty Capsules - Gelatin (Coloured)', 'Empty Capsules'),
('Empty Capsules - HPMC Vegetarian', 'Empty Capsules'),

-- Excipients
('Citric Acid Anhydrous', 'Excipients'),
('Citric Acid Monohydrate', 'Excipients'),
('Aerosil (Colloidal Silicon Dioxide)', 'Excipients'),
('Aspartame', 'Excipients'),
('Lactose', 'Excipients'),
('Mannitol', 'Excipients'),
('Xanthan Gum', 'Excipients'),
('Neomalt', 'Excipients'),
('D-Panthenol', 'Excipients'),
('Co-Enzyme Q10', 'Excipients'),
('Maltodextrin', 'Excipients'),
('Sucralose', 'Excipients'),
('PVP K30', 'Excipients'),
('Malic Acid', 'Excipients'),
('Glycerin', 'Excipients'),
('Sodium Bicarbonate', 'Excipients'),
('Sodium Carbonate', 'Excipients'),
('Fructose', 'Excipients'),
('Xylitol', 'Excipients'),
('Maltitol', 'Excipients'),
('FOS (Fructo-Oligosaccharides)', 'Excipients'),
('HPMC E5', 'Excipients'),
('HPMC E15', 'Excipients'),
('Talc', 'Excipients'),

-- Vitamins
('Biotin', 'Vitamins'),
('Vitamin B1 (Thiamine)', 'Vitamins'),
('Vitamin B2 (Riboflavin)', 'Vitamins'),
('Vitamin B6 (Pyridoxine)', 'Vitamins'),
('Vitamin B12 (Cyanocobalamin)', 'Vitamins'),
('Vitamin C (Ascorbic Acid)', 'Vitamins'),
('Vitamin A (Retinol / Retinyl Palmitate)', 'Vitamins'),
('Vitamin D2', 'Vitamins'),
('Vitamin D3', 'Vitamins'),
('Vitamin E', 'Vitamins'),

-- Colours
('Titanium Dioxide', 'Colours'),
('Red Iron Oxide', 'Colours'),
('Yellow Iron Oxide', 'Colours'),
('Black Iron Oxide', 'Colours'),
('Sunset Yellow / Lake Sunset Yellow', 'Colours'),
('Erythrosine / Lake Erythrosine', 'Colours'),
('Ponceau 4R / Lake Ponceau 4R', 'Colours'),
('Tartrazine / Lake Tartrazine', 'Colours'),
('Brilliant Blue / Lake Brilliant Blue', 'Colours'),
('Quinoline Yellow / Lake Quinoline Yellow', 'Colours'),
('Mica Particles', 'Colours'),
('Allura Red / Lake Allura Red', 'Colours'),

-- Phosphates
('Dicalcium Phosphate Anhydrous (DCP)', 'Phosphates'),
('Dicalcium Phosphate Dihydrate (DCP)', 'Phosphates'),
('Disodium Phosphate Anhydrous (DSHP)', 'Phosphates'),
('Disodium Phosphate Dihydrate (DSP)', 'Phosphates'),
('Monosodium Phosphate Anhydrous', 'Phosphates'),
('Monosodium Phosphate Monohydrate', 'Phosphates'),
('Monosodium Phosphate Dihydrate', 'Phosphates'),
('Tricalcium Phosphate', 'Phosphates'),
('Monocalcium Phosphate Anhydrous', 'Phosphates'),
('Heavy Calcium Carbonate', 'Phosphates'),
('Light Calcium Carbonate', 'Phosphates'),

-- Oils & Butters
('Aloe Butter', 'Oils & Butters'),
('Shea Butter', 'Oils & Butters'),
('Mango Butter', 'Oils & Butters'),
('Cocoa Butter', 'Oils & Butters'),
('Hydrogenated Vegetable Oil', 'Oils & Butters'),
('Flax Seed Oil (Linseed Oil)', 'Oils & Butters'),
('MCT Oil', 'Oils & Butters'),
('Soya Bean Oil', 'Oils & Butters'),
('Sunflower Oil', 'Oils & Butters'),
('Safflower Oil', 'Oils & Butters'),

-- Amino Acids
('Alpha Lipoic Acid', 'Amino Acids'),
('L-Proline', 'Amino Acids'),
('L-Valine', 'Amino Acids'),
('L-Phenylalanine', 'Amino Acids'),
('L-Arginine', 'Amino Acids'),
('L-Leucine', 'Amino Acids'),
('L-Tryptophan', 'Amino Acids'),
('L-Serine', 'Amino Acids'),
('L-Carnitine', 'Amino Acids'),
('L-Alanine', 'Amino Acids'),
('L-Threonine', 'Amino Acids'),
('L-Isoleucine', 'Amino Acids'),

-- Food & Nutra
('Skimmed Milk Powder (SMP)', 'Food & Nutra'),
('Rice Protein', 'Food & Nutra'),
('Pea Protein', 'Food & Nutra'),
('Whey Protein Concentrate', 'Food & Nutra'),
('Whey Protein Isolate', 'Food & Nutra'),
('Whey Protein Hydrolysed', 'Food & Nutra'),
('Soya Protein Isolate', 'Food & Nutra'),
('Food Grade Titanium Dioxide', 'Food & Nutra'),
('Food Grade Xanthan Gum', 'Food & Nutra'),
('Tara Gum', 'Food & Nutra'),
('Potassium Sorbate', 'Food & Nutra'),
('Cocoa Powder', 'Food & Nutra'),

-- Flavours
('Mango Flavour', 'Flavours'),
('Strawberry Flavour', 'Flavours'),
('Vanilla Flavour', 'Flavours'),
('Mixed Fruit Flavour', 'Flavours'),
('Apple Fruit Flavour', 'Flavours'),
('Pineapple Flavour', 'Flavours')

on conflict (name) do nothing;

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================

-- ============================================================
-- UPGRADE: if you already ran setup.sql before, run this too
-- ============================================================
alter table company_materials add column if not exists price numeric(12,2) default null;
alter table company_materials add column if not exists notes text default null;

-- ============================================================
-- UPGRADE: Add address column if missing (run if upgrading)
-- ============================================================
alter table companies add column if not exists address text;
