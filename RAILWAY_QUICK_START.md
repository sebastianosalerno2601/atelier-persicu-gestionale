# ⚡ Quick Start: Deploy su Railway (5 Minuti)

Guida rapida per deploy immediato del gestionale su Railway.

## 🚀 Passi Rapidi

### 1. Push su GitHub (se non già fatto)
```bash
git init
git add .
git commit -m "Ready for Railway deployment"
git remote add origin https://github.com/TUO_USERNAME/atelier-persicu-gestionale.git
git push -u origin main
```

### 2. Crea Progetto Railway
1. Vai su [railway.app](https://railway.app) e login con GitHub
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Seleziona il repository

### 3. Aggiungi MySQL
1. Nel progetto, clicca **"+ New"** → **"Database"** → **"Add MySQL"**
2. Railway creerà automaticamente il database

### 4. Configura Variabili d'Ambiente
Nel progetto Railway, vai su **"Variables"** e aggiungi:

```bash
# JWT Secret (genera uno casuale)
JWT_SECRET=genera_un_secret_casuale_qui

# Node Environment
NODE_ENV=production

# Database (Railway lo fornisce automaticamente, questi sono i mapping)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}
```

**Genera JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy Automatico
Railway deployerà automaticamente! Controlla i logs su **"Deployments"**.

### 6. Verifica URL
1. Vai su **"Settings"** → **"Domains"**
2. Clicca **"Generate Domain"** per ottenere l'URL pubblico
3. Apri l'URL nel browser
4. Login con:
   - Username: `superadmin`
   - Password: `superadmin123`

## ✅ Fatto!

Il tuo gestionale è online! 🎉

**Costi**: ~$1-2/mese (dentro i $5 gratuiti!)

---

📖 **Per dettagli completi**: Vedi `RAILWAY_DEPLOY.md`

