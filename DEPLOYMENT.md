# Guida al Deployment

## Preparazione per la Produzione

### 1. Build del Frontend React

```bash
npm run build
```

Questo creerà una cartella `build/` con i file ottimizzati di React.

### 2. Configurazione Variabili d'Ambiente

Crea un file `.env` nella cartella `server/` con:

```env
# Database MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=la_tua_password
DB_NAME=atelier_persicu

# Server
PORT=5000
NODE_ENV=production

# JWT Secret (IMPORTANTE: cambia questo in produzione!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# URL Frontend (se diverso dal backend)
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Avvio in Produzione

```bash
cd server
NODE_ENV=production node server.js
```

Oppure su Windows PowerShell:
```powershell
cd server
$env:NODE_ENV="production"
node server.js
```

L'applicazione sarà disponibile su `http://localhost:5000`

## Opzioni di Deployment

### Opzione 1: Railway (Consigliato - Gratuito)

1. Vai su [Railway.app](https://railway.app)
2. Crea un account e un nuovo progetto
3. Connetti il repository GitHub
4. Railway rileva automaticamente Node.js e MySQL
5. Configura le variabili d'ambiente nel dashboard Railway

**Vantaggi:**
- Gratuito per iniziare
- MySQL incluso
- Deploy automatico da Git
- SSL gratuito

### Opzione 2: Render

1. Vai su [Render.com](https://render.com)
2. Crea un nuovo Web Service
3. Connetti il repository GitHub
4. Imposta:
   - **Build Command**: `cd .. && npm install && npm run build`
   - **Start Command**: `cd server && npm install && npm start`
   - **Environment**: `Node`

### Opzione 3: Heroku

1. Installa Heroku CLI
2. Login: `heroku login`
3. Crea app: `heroku create nome-app`
4. Aggiungi add-on MySQL: `heroku addons:create cleardb:ignite`
5. Deploy: `git push heroku main`

### Opzione 4: DigitalOcean (VPS)

1. Crea un Droplet Ubuntu
2. Installa Node.js, MySQL, Nginx
3. Configura Nginx come reverse proxy
4. Usa PM2 per gestire il processo Node.js

### Opzione 5: Hosting Condiviso (se supporta Node.js)

Alcuni provider come Hostinger, SiteGround offrono hosting Node.js:
- Carica il codice
- Configura MySQL
- Imposta le variabili d'ambiente
- Avvia il server

## Script di Deploy Automatico

Per facilitare il deployment, puoi creare uno script:

**deploy.sh** (Linux/Mac):
```bash
#!/bin/bash
echo "Building React app..."
npm run build

echo "Installing server dependencies..."
cd server
npm install --production

echo "Starting server..."
NODE_ENV=production node server.js
```

**deploy.bat** (Windows):
```batch
@echo off
echo Building React app...
call npm run build

echo Installing server dependencies...
cd server
call npm install --production

echo Starting server...
set NODE_ENV=production
node server.js
```

## Note Importanti

1. **Database MySQL**: Assicurati che il database sia accessibile dal server di produzione
2. **Variabili d'Ambiente**: Non committare il file `.env` (dovrebbe essere nel `.gitignore`)
3. **JWT Secret**: Cambia il JWT_SECRET in produzione con una chiave sicura
4. **HTTPS**: In produzione, usa HTTPS (molti provider lo forniscono automaticamente)
5. **Backup Database**: Configura backup automatici del database

## Troubleshooting

### Porta già in uso
```bash
# Linux/Mac: trova e termina il processo
lsof -ti:5000 | xargs kill

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

### Database non accessibile
- Verifica le credenziali in `.env`
- Controlla che il database esista
- Verifica firewall/security group

### Build fallisce
- Controlla errori nel terminale
- Verifica che tutte le dipendenze siano installate
- Assicurati che Node.js sia nella versione corretta

