# 📦 Guida: Aggiungere Progetto su GitHub

Il progetto è già stato inizializzato con Git e tutti i file sono stati committati.

## 🚀 Passi per Aggiungere su GitHub

### Step 1: Crea Repository su GitHub

1. **Vai su GitHub.com**
   - Apri [github.com](https://github.com)
   - Fai login con il tuo account (o creane uno se non ce l'hai)

2. **Crea Nuovo Repository**
   - Clicca sul pulsante **"+"** in alto a destra
   - Seleziona **"New repository"**

3. **Configura Repository**
   - **Repository name**: `atelier-persicu-gestionale`
   - **Description**: `Gestionale per Atelier Persicu - Appuntamenti, Dipendenti, Spese`
   - **Visibilità**: 
     - ✅ **Private** (raccomandato - solo tu puoi vederlo)
     - ⚪ Public (visibile a tutti)
   - ⚠️ **IMPORTANTE**: 
     - ❌ **NON** spuntare "Add a README file"
     - ❌ **NON** spuntare "Add .gitignore"
     - ❌ **NON** spuntare "Choose a license"
   - Il repository deve essere **vuoto**!

4. **Crea Repository**
   - Clicca **"Create repository"**

### Step 2: Copia URL del Repository

Dopo aver creato il repository, GitHub mostrerà una pagina con istruzioni. 

**Copia l'URL HTTPS** del repository. Sembrerà così:
```
https://github.com/TUO_USERNAME/atelier-persicu-gestionale.git
```

**Oppure SSH** (se hai configurato SSH):
```
git@github.com:TUO_USERNAME/atelier-persicu-gestionale.git
```

### Step 3: Collega Repository Locale a GitHub

Torna al terminale e esegui questi comandi (sostituisci `TUO_USERNAME` e l'URL con quello tuo):

```bash
# Aggiungi il repository remoto (sostituisci con il tuo URL)
git remote add origin https://github.com/sebastianosalerno2601/atelier-persicu-gestionale.git

# Imposta il branch principale come "main"
git branch -M main

# Fai il push su GitHub
git push -u origin main
```

**Se GitHub chiede autenticazione:**
- Username: Il tuo username GitHub
- Password: Usa un **Personal Access Token** (non la password)
  - Vai su GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Genera un nuovo token con permessi `repo`
  - Usa il token come password

### Step 4: Verifica

Vai sul repository GitHub nel browser e dovresti vedere tutti i tuoi file! 🎉

---

## 🔐 Autenticazione GitHub

### Opzione 1: Personal Access Token (Raccomandato)

1. Vai su [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Clicca **"Generate new token"** → **"Generate new token (classic)"**
3. Dai un nome (es: "Laptop Windows")
4. Seleziona scadenza (es: "90 days" o "No expiration")
5. Spunta la checkbox **`repo`** (controllo completo del repository)
6. Clicca **"Generate token"**
7. **Copia il token** (lo vedrai solo una volta!)
8. Usa il token come password quando Git chiede le credenziali

### Opzione 2: GitHub CLI (Avanzato)

Installa GitHub CLI e autentica:
```bash
winget install GitHub.cli
gh auth login
```

### Opzione 3: SSH Key (Avanzato)

Se preferisci SSH, configura una chiave SSH:
- Guida: [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

## ✅ Verifica Completamento

Dopo il push, dovresti vedere:

1. ✅ Repository GitHub creato
2. ✅ Tutti i file presenti su GitHub
3. ✅ Branch `main` attivo

**Ora puoi procedere con Railway!** Vedi `RAILWAY_QUICK_START.md`

---

## 🐛 Problemi Comuni

### Errore: "remote origin already exists"

**Soluzione:**
```bash
# Rimuovi il remote esistente
git remote remove origin

# Aggiungi di nuovo
git remote add origin https://github.com/TUO_USERNAME/atelier-persicu-gestionale.git
```

### Errore: "Authentication failed"

**Soluzione:**
1. Usa un Personal Access Token invece della password
2. Vedi sezione "Autenticazione GitHub" sopra

### Errore: "Repository not found"

**Soluzione:**
1. Verifica che il repository esista su GitHub
2. Verifica che l'URL sia corretto
3. Verifica che tu abbia i permessi sul repository

---

## 📝 Comandi Utili

```bash
# Verifica stato Git
git status

# Verifica remote configurati
git remote -v

# Aggiungi file modificati
git add .

# Commit modifiche
git commit -m "Descrizione modifiche"

# Push modifiche su GitHub
git push

# Pull modifiche da GitHub
git pull
```

