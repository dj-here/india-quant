# CampusEdge Production Deployment & Operations Guide

This guide details the step-by-step production rollout for **CampusEdge Learning Solutions** (`campusedge.in`), supporting both serverless zero-maintenance hosting (**Vercel + Neon/Supabase**) and dedicated self-hosted infrastructure (**Ubuntu VPS + Docker + Nginx + Let's Encrypt SSL**).

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Institutional & Student Clients"]
        TPO["College TPOs / Leadership"]
        Student["Engineering Students"]
    end

    subgraph CDN["Cloudflare / Edge Network"]
        SSL["SSL Termination & DDoS Protection"]
    end

    subgraph OptionA["Primary Architecture: Serverless"]
        Vercel["Vercel Edge / Node Runtime (Next.js 14)"]
        NeonDB[("Neon Serverless PostgreSQL (or Supabase)")]
        ResendAPI["Resend / Amazon SES (Transactional Email)"]
    end

    subgraph OptionB["Secondary Architecture: Self-Hosted VPS"]
        Nginx["Nginx Reverse Proxy + Let's Encrypt SSL"]
        DockerApp["Docker Container (CampusEdge Web App)"]
        DockerDB[("PostgreSQL 16 Container / RDS")]
    end

    Client --> SSL
    SSL -->|Option A| Vercel
    Vercel --> NeonDB
    Vercel --> ResendAPI

    SSL -->|Option B| Nginx
    Nginx --> DockerApp
    DockerApp --> DockerDB
```

---

## 1. Primary Deployment: Vercel + Neon / Supabase (Recommended)

This setup is ideal for rapid scaling, zero server patching, automatic global edge caching, and seamless CI/CD integration.

### Step 1: Provision Serverless PostgreSQL Database

#### Option A: Neon Serverless Postgres
1. Sign up at [neon.tech](https://neon.tech) and create a project named `campusedge-prod`.
2. Select the AWS region closest to your target audience (e.g., `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
3. Copy the pooled connection string:
   ```bash
   postgresql://campusedge_owner:AbCdEf123456@ep-sample-123456.ap-south-1.aws.neon.tech/campusedge?sslmode=require
   ```

#### Option B: Supabase
1. Create a project at [supabase.com](https://supabase.com) in `ap-south-1` (Mumbai).
2. Go to **Project Settings** → **Database** → **Connection string** (URI). Choose **Transaction pooler (port 6543)**.

### Step 2: Configure Environment Variables

Create the project on Vercel and define the following environment variables under **Settings → Environment Variables**:

| Variable Name | Production Value / Description | Sensitive |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` (from Neon/Supabase with SSL) | Yes |
| `NEXTAUTH_SECRET` | 32+ character random hex string (`openssl rand -base64 32`) | Yes |
| `NEXTAUTH_URL` | `https://campusedge.in` (production domain) | No |
| `ADMIN_DEFAULT_EMAIL` | `admin@campusedge.in` | No |
| `ADMIN_DEFAULT_PASSWORD` | Strong password (e.g. `CE-2026-SuperAdmin!`) | Yes |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxx` (from resend.com) | Yes |
| `NOTIFICATION_EMAIL` | `partnerships@campusedge.in` | No |
| `NEXT_PUBLIC_APP_URL` | `https://campusedge.in` | No |
| `NEXT_PUBLIC_COMPANY_NAME`| `CampusEdge Learning Solutions` | No |
| `NEXT_PUBLIC_CONTACT_EMAIL`| `partnerships@campusedge.in` | No |
| `NEXT_PUBLIC_CONTACT_PHONE`| `+91 98201 44550` | No |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`| `919820144550` | No |

### Step 3: Switch Prisma to PostgreSQL & Migrate

For production PostgreSQL, switch from SQLite to the PostgreSQL Prisma schema:

```bash
# 1. Point DATABASE_URL in your local or CI environment to the production DB
export DATABASE_URL="postgresql://user:pass@ep-sample-123.ap-south-1.aws.neon.tech/campusedge?sslmode=require"

# 2. Push schema to PostgreSQL database
pnpm dlx prisma db push --schema=packages/db/prisma/schema.postgresql.prisma

# 3. Seed initial 60+ diagnostic questions, admin user, and sample testimonials
node packages/db/dist/seed.js
```

### Step 4: Deploy on Vercel

```bash
# Install Vercel CLI (if not already installed)
pnpm add -g vercel

# Link project and deploy to production
vercel --prod
```

Or connect the GitHub repository directly to Vercel:
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

---

## 2. Secondary Deployment: Ubuntu VPS (Docker + Nginx + SSL)

For self-hosting on a single VPS (DigitalOcean Droplet, Hetzner, AWS EC2, Hostinger, or Linode) with 2 vCPUs and 4 GB RAM.

### Step 1: VPS Initial Hardening

```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Update packages
apt update && apt upgrade -y

# Setup non-root deploy user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Configure Uncomplicated Firewall (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Step 2: Install Docker & Docker Compose

```bash
# Install official Docker packages
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker service
systemctl enable docker
systemctl start docker
docker compose version
```

### Step 3: Clone Repository & Configure Environment

```bash
# Clone to /var/www/campusedge
sudo mkdir -p /var/www/campusedge
sudo chown -R deploy:deploy /var/www/campusedge
cd /var/www/campusedge

git clone https://github.com/your-org/campusedge-platform.git .

# Create production .env file
cp .env.example .env
nano .env
```

Set `DATABASE_URL="postgresql://campusedge_user:campusedge_secure_password_2026@postgres:5432/campusedge_db"`.

### Step 4: Build and Start Containers

```bash
# Build and run containers in background
docker compose up -d --build

# Verify container status
docker compose ps
docker compose logs -f web
```

### Step 5: Configure Nginx Reverse Proxy & SSL

Install Nginx and Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/campusedge.in`:
```nginx
server {
    server_name campusedge.in www.campusedge.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long assessment submissions
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    listen 80;
}
```

Enable site and acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/campusedge.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free Let's Encrypt SSL certificate
sudo certbot --nginx -d campusedge.in -d www.campusedge.in --non-interactive --agree-tos -m partnerships@campusedge.in
```

Certbot automatically configures auto-renewal via systemd timer.

---

## 3. Database Migration & Seeding Workflow

### Running Migrations

When models in `prisma/schema.postgresql.prisma` change:
```bash
# Push schema updates directly (development & small teams)
pnpm dlx prisma db push --schema=packages/db/prisma/schema.postgresql.prisma

# OR generate and run formal SQL migrations (strict production teams)
pnpm dlx prisma migrate dev --name <migration_name> --schema=packages/db/prisma/schema.postgresql.prisma
pnpm dlx prisma migrate deploy --schema=packages/db/prisma/schema.postgresql.prisma
```

### Seeding Fresh Database

To seed diagnostic questions and the default admin user:
```bash
node packages/db/dist/seed.js
```

Seeded credentials:
- **Email**: `admin@campusedge.in`
- **Password**: Defined by `ADMIN_DEFAULT_PASSWORD` (default: `CampusEdgeAdmin2026!`)

---

## 4. Automated Daily Backup (VPS PostgreSQL)

Add a daily automated backup script to `/usr/local/bin/backup-campusedge.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/campusedge"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker exec campusedge_postgres pg_dump -U campusedge_user campusedge_db | gzip > "$BACKUP_DIR/campusedge_$TIMESTAMP.sql.gz"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -delete
```

Add cron job (`crontab -e`):
```cron
0 2 * * * /usr/local/bin/backup-campusedge.sh > /dev/null 2>&1
```

---

## 5. Rollback Procedure

### Vercel
1. Navigate to **Deployments** in the Vercel Dashboard.
2. Select the previous stable deployment.
3. Click **Instant Rollback**. Traffic is redirected to the earlier build in under 5 seconds.

### Docker VPS
```bash
# Revert Git commit
git revert HEAD
# Rebuild containers
docker compose up -d --build
```
