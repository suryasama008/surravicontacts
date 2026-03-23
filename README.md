# ContactBase — Setup Guide

## 1. Run the database setup

1. Go to https://supabase.com → your project → **SQL Editor**
2. Click **New query**
3. Open `setup.sql` from this folder, copy all content, paste it, click **Run**
4. Done — all tables, triggers and 99 materials are created

## 2. Install and run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 3. Deploy to Netlify

1. Push this folder to a GitHub repository
2. Go to netlify.com → **Add new site** → **Import from Git**
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Add environment variables (same as .env.local):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Deploy

## 4. Password protect (recommended)

In Netlify dashboard → your site → **Site configuration** → **Access control** → **Password protection** → set one password.

Anyone opening your site will need to type this password. Simple, no accounts needed.

## How to use

### Import your Excel contacts
1. Go to **Import Excel** page
2. Select **Contacts** tab
3. Make sure your Excel has these column names:
   - `full_name` (required)
   - `phone`, `phone_2`, `email`, `email_2`
   - `job_title`, `company_name`, `city`, `address`, `notes`, `tags`
4. Upload the file → preview → Import

### Import companies + materials
1. Go to **Import Excel** → **Companies** tab
2. Your Excel needs **2 sheets**:
   - Sheet 1: `company_name`, `types`, `country`, `city`, `address`, `phone`, `email`
   - Sheet 2: `company_name`, `material_name`, `category`
3. Upload → Import

### Add a company manually
1. Click **Companies** → **Add company**
2. Fill in details, select type (checkboxes)
3. Scroll to **Materials** section — search and check which materials this company supplies
4. Save

### Change a contact's company
1. Open the contact → **Edit**
2. Change the company dropdown
3. You'll see a notice: *"Previous company will be saved to history"*
4. Save — the old company is automatically stored in history

## Excel format reference

### Contacts sheet
| Column | Required | Notes |
|--------|----------|-------|
| full_name | YES | First + last in one cell |
| phone | no | International format |
| phone_2 | no | Second number |
| email | no | |
| email_2 | no | |
| job_title | no | |
| company_name | no | Must match company name exactly |
| city | no | Short city name |
| address | no | Paste freely |
| tags | no | Comma or semicolon separated |
| notes | no | |

### Companies sheet (Sheet 1)
| Column | Required |
|--------|----------|
| company_name | YES |
| types | no | manufacturer;importer;exporter;distributor |
| country | no |
| city | no |
| address | no |
| phone | no |
| email | no |
| website | no |
| notes | no |

### Materials sheet (Sheet 2)
| Column | Required |
|--------|----------|
| company_name | YES | Must match Sheet 1 |
| material_name | YES | |
| category | no | e.g. Vitamins, Excipients |
