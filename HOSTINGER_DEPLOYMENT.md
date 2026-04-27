# Cynos – Deployment Guide for Hostinger

This app is built as a standard React + FastAPI + MongoDB stack and can run on any host that supports Python 3.10+, Node, and MongoDB. Below is the recommended setup for **Hostinger VPS** (cheapest plan that supports custom apps).

> ⚠️ **Hostinger Shared Hosting** does **not** support Python apps — you must use a **VPS plan** (KVM 1, KVM 2, etc.) or **Hostinger Cloud Hosting**. Shared/Premium-Web plans only run PHP.

---

## 0. Prerequisites
- Hostinger **VPS** (Ubuntu 22.04+) with root SSH access — or any Linux server.
- Domain name pointed at the VPS IP (A record).
- A **MongoDB Atlas** cluster (free M0 tier is enough) → easier than self-hosting Mongo.
- Your code pushed to GitHub (use Emergent's "Save to GitHub" button).

---

## 1. SSH into the VPS and install dependencies

```bash
ssh root@<your-vps-ip>
apt update && apt install -y python3-pip python3-venv nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn pm2
```

## 2. Clone the repo

```bash
cd /var/www
git clone https://github.com/<your-username>/cynos.git
cd cynos
```

## 3. Configure backend `.env`

```bash
cat > /var/www/cynos/backend/.env << 'EOF'
MONGO_URL="mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net"
DB_NAME="cynos_db"
CORS_ORIGINS="https://yourdomain.com"
JWT_SECRET="<run: openssl rand -hex 32>"
ADMIN_EMAIL="admin@cynos.in"
ADMIN_PASSWORD="<strong-password>"
SENDGRID_API_KEY="SG.xxxxx"
EMAIL_FROM="gizzify@gmail.com"
EMAIL_FROM_NAME="Cynos"
EMAIL_ADMIN="gizzify@gmail.com"
QIKINK_CLIENT_ID="609057680284274"
QIKINK_CLIENT_SECRET="a60e43561afb3e259785b7f721b950ef3412f6fdde738e595d954c7c57631830"
QIKINK_BASE_URL="https://api.qikink.com"          # use https://sandbox.qikink.com for testing
QIKINK_ENABLED="true"
EOF
```

## 4. Install Python deps & run backend with PM2

```bash
cd /var/www/cynos/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start with pm2 (auto-restart on crash, runs in background)
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001" --name cynos-api
pm2 startup
pm2 save
```

## 5. Build & host frontend

```bash
cd /var/www/cynos/frontend
echo 'REACT_APP_BACKEND_URL=https://yourdomain.com' > .env
yarn install
yarn build
# build output goes to /var/www/cynos/frontend/build
```

## 6. Nginx reverse proxy (front + API on same domain)

```bash
cat > /etc/nginx/sites-available/cynos << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # API → FastAPI on port 8001
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend static build
    root /var/www/cynos/frontend/build;
    index index.html;
    location / {
        try_files $uri /index.html;
    }
}
EOF

ln -s /etc/nginx/sites-available/cynos /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 7. SSL with Let's Encrypt (free)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 8. Verify
- Visit `https://yourdomain.com` — storefront loads.
- `https://yourdomain.com/api/products/bestsellers` returns JSON.
- Place a test order → check Qikink dashboard + your inbox (after SendGrid sender verification).

---

## Updates / redeploys

```bash
cd /var/www/cynos
git pull
cd backend && source .venv/bin/activate && pip install -r requirements.txt && pm2 restart cynos-api
cd ../frontend && yarn build
# nginx auto-serves new build
```

---

## Troubleshooting checklist

| Symptom | Fix |
|--------|-----|
| `Invalid AccessToken or Client Id` from Qikink | Confirm `QIKINK_CLIENT_ID` & `QIKINK_CLIENT_SECRET` in `.env`; restart pm2 |
| `Invalid SKU` from Qikink | The product needs a real Qikink SKU set in admin → Products → Edit → Qikink SKU |
| Email not arriving | Verify sender in SendGrid (Single Sender Verification for `gizzify@gmail.com`) + check spam |
| 502 Bad Gateway | `pm2 status` → restart cynos-api; check `pm2 logs cynos-api` |
| CORS error in browser | Set `CORS_ORIGINS=https://yourdomain.com` in backend `.env` and `pm2 restart cynos-api` |
