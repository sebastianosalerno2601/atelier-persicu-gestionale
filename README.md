# Atelier Persicu - Gestionale

Gestionale moderno per la catena di barbiere Atelier Persicu con sedi ad Arzano(NA) e Vomero(NA).

## Caratteristiche

- ✨ Design moderno con animazioni fluide
- 🎨 Palette colori nero e bianco
- 📱 Completamente responsive (mobile, tablet, desktop)
- 🔐 Sistema di autenticazione superadmin
- 📅 Gestione appuntamenti con calendario 09:00-21:00
- 👥 Gestione dipendenti (solo superadmin)
- 💰 Calcolo automatico guadagni giornalieri
- 💳 Gestione pagamenti (Carta, Contanti, Scontistica, Da Pagare)

## Installazione

```bash
npm install
```

## Avvio

```bash
npm start
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000)

## Credenziali Predefinite

**Superadmin:**
- Username: `admin`
- Password: `admin123`

## Funzionalità

### Appuntamenti

- Visualizzazione calendario per ogni dipendente
- Creazione/modifica appuntamenti cliccando sulle fasce orarie
- Calcolo automatico durata in base al tipo di lavorazione:
  - Taglio: 45 minuti - 15€
  - Taglio breve: 30 minuti - 15€
  - Taglio e barba: 60 minuti - 20€
  - Taglio e barba breve: 45 minuti - 20€
  - Taglio, barba e colore: 60 minuti - Prezzo da aggiornare
  - Barba: 10 minuti - 5€
- Visualizzazione guadagno giornaliero per dipendente
- Gestione metodo di pagamento

### Dipendenti

- Creazione dipendenti con:
  - Nome e cognome
  - Email
  - Codice fiscale
  - Anno di nascita
  - Retribuzione mensile fissa
- Creazione credenziali di accesso (opzionale)

## Tecnologie

- React 18
- React Router DOM
- CSS3 con animazioni
- LocalStorage per persistenza dati

## Note

- I dati sono salvati nel localStorage del browser
- Design ottimizzato per dispositivi mobile


