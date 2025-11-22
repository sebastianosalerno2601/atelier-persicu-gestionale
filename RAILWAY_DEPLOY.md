# 🚀 Guida al Deploy su Railway

Questa guida ti accompagnerà passo-passo nel deploy del gestionale Atelier Persicu su Railway.

## 📋 Prerequisiti

- [ ] Account Railway (crea su [railway.app](https://railway.app))
- [ ] Repository Git (GitHub/GitLab) del progetto
- [ ] Account GitHub/GitLab (gratuito)

---

## 🎯 Step 1: Preparazione Repository Git

Prima di deployare, assicurati che il progetto sia su GitHub o GitLab:

### 1.1 Crea repository su GitHub

1. Vai su [github.com](https://github.com)
2. Clicca **"New repository"**
3. Nome: `atelier-persicu-gestionale`
4. Visibilità: **Private** (raccomandato) o **Public**
5. **Non inizializzare** con README, .gitignore, o licenza
6. Clicca **"Create repository"**

### 1.2 Inizializza Git nel progetto (se non già fatto)

Apri il terminale nella cartella del progetto:

```bash
# Se Git non è già inizializzato
git init
git add .
git commit -m "Initial commit: Atelier Persicu gestionale"

# Aggiungi il repository remoto (sostituisci USERNAME con il tuo)
git remote add origin https://github.com/USERNAME/atelier-persicu-gestionale.git
git branch -M main
git push -u origin main
```

---

## 🎯 Step 2: Setup Railway

### 2.1 Crea Account Railway

1. Vai su [railway.app](https://railway.app)
2. Clicca **"Start a New Project"**
3. Scegli **"Login with GitHub"** (o GitLab)
4. Autorizza Railway ad accedere al tuo account

### 2.2 Crea Nuovo Progetto

1. Clicca **"New Project"**
2. Scegli **"Deploy from GitHub repo"**
3. Seleziona il repository `atelier-persicu-gestionale`
4. Railway inizierà automaticamente a deployare

---

## 🎯 Step 3: Aggiungi Database MySQL

### 3.1 Crea Servizio MySQL

1. Nel progetto Railway, clicca **"+ New"**
2. Seleziona **"Database"** → **"Add MySQL"**
3. Railway creerà automaticamente un database MySQL
4. **Annota le credenziali** che Railway fornisce (appariranno nelle variabili d'ambiente)

### 3.2 Variabili d'Ambiente MySQL

Railway creerà automaticamente queste variabili d'ambiente per il database:
- `MYSQL_HOST` → `DB_HOST`
- `MYSQL_USER` → `DB_USER`
- `MYSQLPASSWORD` → `DB_PASSWORD`
- `MYSQLDATABASE` → `DB_NAME`
- `MYSQLPORT` → `DB_PORT`

Railway usa prefissi diversi, quindi dobbiamo mappare queste variabili.

---

## 🎯 Step 4: Configura Variabili d'Ambiente

### 4.1 Variabili per il Database

Nel progetto Railway, vai su **"Variables"** e aggiungi/modifica:

```bash
# Database (Railway fornisce automaticamente queste)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}

# JWT Secret (genera un valore casuale sicuro)
JWT_SECRET=il_tuo_secret_jwt_super_sicuro_cambia_questo

# Port (Railway lo fornisce automaticamente)
PORT=${{PORT}}

# Node Environment
NODE_ENV=production
```

**Come generare JWT_SECRET sicuro:**

Nel terminale locale:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia il risultato e usalo come `JWT_SECRET`.

### 4.2 Mapping Variabili Railway → Node.js

Railway MySQL fornisce variabili con prefissi diversi. Devo aggiornare `server/config/database.js` per usare i nomi corretti:

**Opzione 1: Usare variabili Railway direttamente**
```javascript
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
// etc.
```

**Opzione 2: Mapping automatico nel codice**

Vedi la sezione "Modifiche al Codice" sotto.

---

## 🎯 Step 5: Modifiche al Codice

### 5.1 Aggiorna Configurazione Database

Aggiorna `server/config/database.js` per usare le variabili Railway:

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'atelier_persicu',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'local',
  dateStrings: true
});
```

### 5.2 Script di Build (Già Configurati ✅)

Gli script necessari sono già configurati nel `package.json`:

- `npm start`: Avvia il server in produzione
- `npm run build`: Compila React per produzione
- `npm run build:all`: Installa dipendenze e compila tutto
- `npm run install:all`: Installa dipendenze di frontend e backend

**Non serve modificare nulla!** 🎉

---

## 🎯 Step 6: Configura Build su Railway

### 6.1 Configura Railway Project (Automatico ✅)

Railway rileva automaticamente la configurazione dai file:
- `railway.json` o `railway.toml` (già creati)
- `package.json` (script già configurati)
- `Procfile` (comando di start già configurato)

**Non serve configurare manualmente!** Railway userà automaticamente:
- **Build Command**: `npm run build:all`
- **Start Command**: `npm start` (dalla Procfile o package.json)
- **Root Directory**: `/` (root)

Se vuoi verificare o modificare:
1. Vai su **"Settings"** del progetto
2. Clicca su **"Service"**
3. Verifica/Modifica **"Build Command"** e **"Start Command"** se necessario

### 6.2 Verifica Build Logs

1. Vai su **"Deployments"**
2. Clicca sull'ultimo deploy
3. Verifica che il build sia completato con successo
4. Se ci sono errori, controlla i logs

---

## 🎯 Step 7: Test del Deploy

### 7.1 Verifica URL

Railway fornisce un URL pubblico (es: `https://atelier-persicu-gestionale.up.railway.app`)

1. Clicca su **"Settings"** → **"Domains"**
2. Copia l'URL generato
3. Apri nel browser
4. Dovresti vedere la pagina di login

### 7.2 Test Login

1. Usa le credenziali superadmin:
   - **Username**: `superadmin`
   - **Password**: `superadmin123` (o quella configurata)
2. Verifica che il login funzioni
3. Testa alcune funzionalità (crea appuntamento, etc.)

---

## 🎯 Step 8: Dominio Personalizzato (Opzionale)

### 8.1 Aggiungi Dominio

1. Vai su **"Settings"** → **"Domains"**
2. Clicca **"Generate Domain"** se non ancora fatto
3. Oppure aggiungi un dominio personalizzato:
   - Clicca **"Custom Domain"**
   - Inserisci il tuo dominio (es: `gestionale.atelierpersicu.com`)
   - Segui le istruzioni per configurare DNS

### 8.2 Configura DNS

Nel tuo provider DNS, aggiungi record CNAME:
```
Tipo: CNAME
Nome: gestionale (o @ per root domain)
Valore: your-app.up.railway.app
TTL: 3600
```

---

## 🎯 Step 9: Monitoraggio e Logs

### 9.1 Visualizza Logs

1. Vai su **"Deployments"**
2. Clicca sull'ultimo deploy
3. Vai su **"Logs"** per vedere i log in tempo reale

### 9.2 Monitora Utilizzo

1. Vai su **"Settings"** → **"Usage"**
2. Verifica i crediti utilizzati
3. Con $5 gratuiti, hai ampio margine!

---

## 🐛 Troubleshooting

### Errore: "Cannot connect to database"

**Soluzione:**
1. Verifica le variabili d'ambiente MySQL
2. Assicurati che il servizio MySQL sia attivo
3. Controlla i logs per errori di connessione

### Errore: "Build failed"

**Soluzione:**
1. Verifica i logs di build
2. Assicurati che tutte le dipendenze siano nel `package.json`
3. Controlla che Node.js version sia >=18

### Errore: "Page not found" dopo il login

**Soluzione:**
1. Verifica che `server/server.js` serva correttamente i file statici React
2. Controlla che il build di React sia nella cartella `build/`
3. Verifica che il path sia corretto: `path.join(__dirname, '../build')`

### App non si avvia

**Soluzione:**
1. Verifica il comando di start: deve essere `npm start` dalla root
2. Controlla che `server/server.js` esista
3. Verifica i logs per errori specifici

---

## 📝 Checklist Finale

- [ ] Repository Git creato e pushato
- [ ] Progetto Railway creato
- [ ] Database MySQL aggiunto
- [ ] Variabili d'ambiente configurate
- [ ] Script di build funzionante
- [ ] Deploy completato con successo
- [ ] Login testato e funzionante
- [ ] Funzionalità base testate

---

## 🎉 Completato!

Il tuo gestionale è ora online su Railway! 🚀

**URL pubblico**: `https://your-app.up.railway.app`

**Costi stimati**: ~$1-2/mese (dentro i $5 gratuiti!)

---

## 📞 Supporto

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Pricing: [railway.app/pricing](https://railway.app/pricing)

