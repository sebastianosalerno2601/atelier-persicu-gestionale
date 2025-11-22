# Guida Setup Railway (Gratuito) 🚀

Railway è la migliore opzione gratuita per il tuo progetto Atelier Persicu perché include MySQL gratuito e non spegne il server dopo inattività.

## 📋 Prerequisiti

1. Account GitHub (gratuito)
2. Account Railway (gratuito) - [railway.app](https://railway.app)
3. Database MySQL già configurato (puoi usare quello locale o crearne uno su Railway)

## 🚀 Setup Passo-Passo

### 1. Preparare il Progetto per Git

Assicurati che il progetto sia pronto per Git:

```bash
# Inizializza Git (se non già fatto)
git init

# Aggiungi file .gitignore se non esiste
```

Crea/modifica `.gitignore`:
```
node_modules/
server/node_modules/
build/
.env
server/.env
.DS_Store
*.log
```

### 2. Push su GitHub

1. Vai su [GitHub.com](https://github.com)
2. Crea un nuovo repository (pubblico o privato)
3. Segui le istruzioni per pushare il codice:

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/nome-repo.git
git push -u origin main
```

### 3. Creare Progetto su Railway

1. Vai su [railway.app](https://railway.app)
2. Clicca "Start a New Project"
3. Seleziona "Deploy from GitHub repo"
4. Autorizza Railway ad accedere a GitHub
5. Seleziona il tuo repository

### 4. Configurare Database MySQL

1. Nel dashboard Railway, clicca "+ New"
2. Seleziona "Database" → "Add MySQL"
3. Railway creerà automaticamente un database MySQL
4. Clicca sul database per vedere le credenziali (le useremo dopo)

### 5. Configurare Variabili d'Ambiente

Nel dashboard Railway, vai alla sezione "Variables":

```
DB_HOST=containers-us-west-XXX.railway.app
DB_USER=root
DB_PASSWORD=password_fornitoda_railway
DB_NAME=railway
DB_PORT=3306

PORT=5000
NODE_ENV=production

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456789

REACT_APP_API_URL=https://tuo-progetto.up.railway.app/api
```

**⚠️ IMPORTANTE:**
- Sostituisci `DB_HOST`, `DB_USER`, `DB_PASSWORD` con i valori reali del tuo database Railway
- Cambia `JWT_SECRET` con una chiave sicura (usa un generatore casuale)
- Sostituisci `REACT_APP_API_URL` con l'URL del tuo progetto Railway

### 6. Configurare Build e Start Commands

Nel dashboard Railway, vai su "Settings" → "Deploy":

**Build Command:**
```bash
cd .. && npm install && npm run build
```

**Start Command:**
```bash
cd server && npm install && npm start
```

**Root Directory:**
```
/
```

### 7. Inizializzare il Database

Railway dovrebbe avviare automaticamente il deploy. Una volta completato:

1. Vai su "View Logs" per vedere se ci sono errori
2. Se vedi errori sul database, potrebbe essere necessario inizializzare le tabelle

**Opzione A - Usando Railway CLI:**
```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login
railway login

# Connetti al progetto
railway link

# Esegui script di inizializzazione
cd server
railway run node initTables.js
```

**Opzione B - Manualmente via SSH/Shell:**
Nel dashboard Railway, apri la shell del database e esegui le query SQL necessarie.

### 8. Verificare il Deploy

1. Vai su "Settings" → "Networking"
2. Railway avrà creato un dominio pubblico (es: `tuo-progetto.up.railway.app`)
3. Clicca sul dominio per aprire l'applicazione
4. Verifica che tutto funzioni

## 🔧 Configurazioni Aggiuntive

### Dominio Personalizzato (Opzionale)

1. Vai su "Settings" → "Networking"
2. Clicca "Generate Domain" se non già fatto
3. Per dominio personalizzato: aggiungi il tuo dominio e configura DNS

### Variabili d'Ambiente Sensibili

Non committare mai il file `.env` su Git. Usa sempre le variabili d'ambiente di Railway.

### Monitoraggio e Logs

- Railway offre monitoring gratuito
- Vedi i logs in tempo reale nel dashboard
- Ricevi notifiche su errori critici

## 💰 Costi

**Gratuito:**
- $5 di crediti gratuiti al mese
- Sufficiente per:
  - 1 applicazione Node.js
  - 1 database MySQL piccolo
  - Traffico moderato

**Quando potresti superare i crediti:**
- Molto traffico (migliaia di richieste/giorno)
- Database molto grande (>1GB)
- Storage elevato

In tal caso, considererai un piano a pagamento ($5-20/mese).

## 🆚 Confronto con Altre Piattaforme

| Piattaforma | MySQL Gratuito | Spegne dopo Inattività | Facilità Setup | Migliore Per |
|------------|----------------|------------------------|----------------|--------------|
| **Railway** | ✅ Sì | ❌ No | ⭐⭐⭐⭐⭐ | **Il tuo progetto** |
| Render | ✅ Sì | ⚠️ Sì (15 min) | ⭐⭐⭐⭐ | Progetti semplici |
| Heroku | ❌ No (piano $) | ⚠️ Sì | ⭐⭐⭐ | Progetti legacy |
| Fly.io | ⚠️ Limitato | ❌ No | ⭐⭐⭐ | Microservizi |

## 🐛 Troubleshooting

### Database non si connette
- Verifica le variabili d'ambiente `DB_*`
- Controlla che il database sia nella stessa "organization" del progetto
- Verifica la porta (di solito 3306 ma Railway può usare una porta custom)

### Build fallisce
- Controlla i logs nel dashboard Railway
- Verifica che `package.json` abbia tutti gli script necessari
- Assicurati che `build` command punti correttamente alla directory

### App non risponde
- Verifica che la porta sia configurata correttamente (Railway usa `PORT` env var)
- Controlla che il server ascolti su `process.env.PORT || 5000`
- Vedi i logs per errori runtime

### Errore 404 su route React
- Verifica che in produzione il server serva i file statici di React
- Controlla che `server.js` abbia la configurazione per `NODE_ENV=production`

## 📚 Risorse

- [Railway Docs](https://docs.railway.app)
- [Railway Community](https://discord.gg/railway)
- [MySQL su Railway](https://docs.railway.app/databases/mysql)

## ✅ Checklist Finale

- [ ] Progetto su GitHub
- [ ] Account Railway creato
- [ ] Database MySQL creato su Railway
- [ ] Variabili d'ambiente configurate
- [ ] Build e Start commands configurati
- [ ] Database inizializzato con tabelle
- [ ] Deploy completato con successo
- [ ] Applicazione accessibile via URL pubblico
- [ ] Login funzionante
- [ ] Database persistente

---

**Buon deploy! 🎉**

Se hai domande o problemi, consulta i logs su Railway o la documentazione.

