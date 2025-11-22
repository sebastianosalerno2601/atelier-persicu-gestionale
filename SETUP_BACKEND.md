# Setup Backend - Atelier Persicu

## 📋 Prerequisiti

1. **MySQL** installato sul tuo computer
   - Windows: Scarica da https://dev.mysql.com/downloads/mysql/
   - Mac: `brew install mysql` oppure scarica da MySQL
   - Linux: `sudo apt-get install mysql-server`

2. **Node.js** (già installato per React)

## 🚀 Installazione e Configurazione

### 1. Installa MySQL e crea un database

Se MySQL non è installato:
```bash
# Avvia il servizio MySQL (dopo l'installazione)
# Windows: Cerca "Services" e avvia "MySQL80"
# Mac/Linux: sudo service mysql start
```

### 2. Installa le dipendenze del backend

```bash
cd server
npm install
```

### 3. Configura le variabili d'ambiente

Crea un file `.env` nella cartella `server`:

```bash
cd server
copy .env.example .env  # Windows
# oppure
cp .env.example .env    # Mac/Linux
```

Modifica il file `.env` con le tue credenziali MySQL:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=atelier_persicu
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**Importante**: Sostituisci `your_mysql_password` con la password del tuo MySQL.

### 4. Avvia il server

```bash
cd server
npm start
```

Per sviluppo con auto-reload:
```bash
npm run dev
```

Il server creerà automaticamente:
- Il database `atelier_persicu`
- Tutte le tabelle necessarie
- L'utente superadmin (username: `admin`, password: `admin123`)

### 5. Configura il frontend

Aggiungi nel file `.env` nella root del progetto (dove c'è `package.json`):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Oppure modifica `src/utils/api.js` se preferisci.

### 6. Avvia il frontend

```bash
# Dalla root del progetto
npm start
```

## ✅ Verifica che tutto funzioni

1. Il server backend dovrebbe mostrare:
   ```
   ✅ Connesso al database MySQL
   ✅ Database inizializzato correttamente
   ✅ Superadmin creato (username: admin, password: admin123)
   🚀 Server in ascolto sulla porta 5000
   ```

2. Il frontend si connetterà automaticamente al backend quando fai login.

## 🔄 Migrazione dati da localStorage

Se hai già dati salvati nel localStorage del browser, dovrai:
1. Accedere all'app
2. Ricreare manualmente i dati nel database tramite l'interfaccia
3. Oppure posso creare uno script di migrazione (dimmi se ti serve)

## 🆘 Risoluzione Problemi

### Errore: "Can't connect to MySQL server"
- Verifica che MySQL sia avviato
- Controlla le credenziali in `.env`
- Verifica che l'utente MySQL abbia i permessi

### Errore: "Access denied for user"
- Controlla username e password in `.env`
- Verifica che l'utente MySQL esista e abbia i permessi

### Errore: "Database doesn't exist"
- Il database viene creato automaticamente al primo avvio
- Se l'errore persiste, crea manualmente: `CREATE DATABASE atelier_persicu;`

## 📝 Note

- I dati sono ora salvati nel database MySQL e non vengono più cancellati
- Puoi fare backup del database MySQL periodicamente
- Le credenziali default sono `admin` / `admin123` - cambiale dopo il primo login!

