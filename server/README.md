# Backend Server - Atelier Persicu

## Installazione

1. Installa le dipendenze:
```bash
cd server
npm install
```

2. Installa MySQL sul tuo computer (se non già installato)
   - Windows: Scarica da https://dev.mysql.com/downloads/mysql/
   - Mac: `brew install mysql`
   - Linux: `sudo apt-get install mysql-server`

3. Crea il file `.env` nella cartella `server`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=atelier_persicu
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

4. Avvia il server:
```bash
npm start
```

Per sviluppo con auto-reload:
```bash
npm run dev
```

Il server creerà automaticamente il database e le tabelle al primo avvio.

## Credenziali Default

- Username: `admin`
- Password: `admin123`

## API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/appointments` - Ottieni appuntamenti
- `POST /api/appointments` - Crea appuntamento
- `PUT /api/appointments/:id` - Aggiorna appuntamento
- `DELETE /api/appointments/:id` - Elimina appuntamento
- `GET /api/employees` - Ottieni dipendenti
- `POST /api/employees` - Crea dipendente
- `PUT /api/employees/:id` - Aggiorna dipendente
- `DELETE /api/employees/:id` - Elimina dipendente
- `GET /api/utilities/:monthKey` - Ottieni utenze
- `POST /api/utilities/:monthKey` - Salva utenze
- `GET /api/product-expenses/:monthKey` - Ottieni spese prodotti
- `POST /api/product-expenses/:monthKey` - Aggiungi spesa prodotto
- `DELETE /api/product-expenses/:monthKey/:expenseId` - Elimina spesa
- `GET /api/bar-expenses/:monthKey` - Ottieni spese bar
- `POST /api/bar-expenses/:monthKey` - Aggiungi spesa bar
- `GET /api/maintenance/:monthKey` - Ottieni manutenzioni
- `POST /api/maintenance/:monthKey` - Salva manutenzioni

