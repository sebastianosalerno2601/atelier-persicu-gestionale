# Guida Reinstallazione PostgreSQL su Windows

## 📥 Passo 1: Scarica PostgreSQL

1. Vai su: https://www.postgresql.org/download/windows/
2. Clicca su **"Download the installer"**
3. Scarica **PostgreSQL 15** o **16** (versione più recente)
4. Oppure vai direttamente a: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

## 🔧 Passo 2: Installa PostgreSQL

1. Esegui il file `.exe` scaricato
2. Durante l'installazione:
   - **Porta**: Lascia `5432` (default)
   - **Locale**: Lascia `[Default locale]` o seleziona `Italian, Italy`
   - **Password**: **IMPORTANTE** - Scegli una password e **RICORDALA** (es. `postgres123`)
   - **Username**: Lascia `postgres` (default)

3. **NON deselezionare**:
   - ✅ Stack Builder (può essere utile)
   - ✅ pgAdmin 4 (interfaccia grafica opzionale)

4. Completa l'installazione

## ✅ Passo 3: Verifica Installazione

1. Apri **PowerShell** o **Prompt dei comandi**
2. Verifica che PostgreSQL sia installato:
   ```powershell
   psql --version
   ```

3. Verifica che il servizio sia in esecuzione:
   - Premi `Win + R`
   - Digita `services.msc`
   - Cerca **"postgresql-x64-XX"** (dove XX è la versione)
   - Deve essere **"In esecuzione"**

## 🔐 Passo 4: Configura il File .env

Crea/modifica il file `server/.env` con queste impostazioni:

```env
# Server
PORT=5000
NODE_ENV=development

# Database Locale PostgreSQL
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=atelier_persicu_local
DB_PORT=5432

# JWT Secret (non cambiare se già in produzione)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Database Produzione (NON modificare - usato solo su Render)
# DATABASE_URL=postgresql://...
```

**IMPORTANTE**: Sostituisci `postgres123` con la password che hai scelto durante l'installazione!

## 🗄️ Passo 5: Crea il Database

1. Apri **PowerShell** nella cartella del progetto
2. Connettiti a PostgreSQL:
   ```powershell
   psql -U postgres
   ```
   (Ti chiederà la password che hai impostato durante l'installazione)

3. Crea il database:
   ```sql
   CREATE DATABASE atelier_persicu_local;
   ```

4. Esci da psql:
   ```sql
   \q
   ```

## 🚀 Passo 6: Inizializza il Database

1. Vai nella cartella `server`:
   ```powershell
   cd server
   ```

2. Avvia il server (creerà automaticamente tutte le tabelle):
   ```powershell
   npm start
   ```

   Oppure se hai nodemon:
   ```powershell
   npm run dev
   ```

3. Il server creerà automaticamente:
   - Tutte le tabelle necessarie
   - L'utente superadmin (username: `AntonioPersico`, password: `AntonioPersico1`)

## ✅ Verifica che Tutto Funzioni

1. Il server dovrebbe avviarsi senza errori
2. Dovresti vedere messaggi come:
   ```
   ✅ Database inizializzato correttamente
   🚀 Server in ascolto sulla porta 5000
   ```

3. Prova ad accedere all'applicazione:
   - Frontend: http://localhost:3000
   - Login con: `AntonioPersico` / `AntonioPersico1`

## 🆘 Problemi Comuni

### Errore: "psql non è riconosciuto come comando"
- **Soluzione**: Aggiungi PostgreSQL al PATH:
  1. Cerca "Variabili d'ambiente" in Windows
  2. Aggiungi al PATH: `C:\Program Files\PostgreSQL\XX\bin` (dove XX è la versione)

### Errore: "Connection refused" o "ECONNREFUSED"
- **Soluzione**: Avvia il servizio PostgreSQL:
  1. Premi `Win + R`
  2. Digita `services.msc`
  3. Trova **"postgresql-x64-XX"**
  4. Clicca destro → **Avvia**

### Errore: "Password authentication failed"
- **Soluzione**: Verifica la password nel file `server/.env` corrisponda a quella impostata durante l'installazione

### Errore: "Database does not exist"
- **Soluzione**: Crea il database manualmente (vedi Passo 5)

### Non ricordo la password di PostgreSQL
- **Soluzione**: Reimposta la password:
  1. Apri `services.msc`
  2. Ferma il servizio PostgreSQL
  3. Modifica il file `C:\Program Files\PostgreSQL\XX\data\pg_hba.conf`
  4. Cambia `md5` in `trust` per la riga `host all all 127.0.0.1/32`
  5. Riavvia PostgreSQL
  6. Connettiti senza password: `psql -U postgres`
  7. Cambia password: `ALTER USER postgres WITH PASSWORD 'nuova_password';`
  8. Rimetti `md5` nel file `pg_hba.conf`
  9. Riavvia PostgreSQL

## 📝 Note

- Il database locale è **completamente separato** da quello di produzione (Supabase)
- I dati locali non vengono sincronizzati con produzione
- Puoi fare backup del database locale quando vuoi


