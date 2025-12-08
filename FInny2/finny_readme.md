# 🦊 Finny - Intelligenter PDF-Formular-Assistent

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![AI](https://img.shields.io/badge/AI-Comet%20Kimi%20K2--Thinking-orange.svg)](https://cometapi.com)

Ein intelligenter AI-Assistent, der dich Schritt für Schritt durch PDF-Formulare führt und dabei hilft, sie korrekt auszufüllen.

## ✨ Features

- 🤖 **Comet Kimi K2-Thinking AI** - Hochintelligente Formular-Assistenz
- 📋 **Automatische Feldextraktion** - Erkennt alle PDF-Formularfelder
- 💬 **Natürlicher Chat** - Stelle Fragen, erhalte Hilfe in Echtzeit
- ✅ **Smart Validation** - Überprüft Eingaben auf Richtigkeit
- 🎯 **Befehle-System** - Navigation, Status, Hilfe und mehr
- 📥 **PDF Download** - Ausgefülltes Formular herunterladen
- 🌐 **Responsive Design** - Funktioniert auf Desktop & Mobile

## 🚀 Live Demo

[https://your-app.onrender.com](https://your-app.onrender.com)

## 📦 Installation

### Voraussetzungen

- Node.js 18+ 
- npm 9+
- API Keys für PDF.co und Comet API

### Lokale Installation

```bash
# Repository klonen
git clone https://github.com/yourusername/finny-pdf-assistant.git
cd finny-pdf-assistant

# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
# Fülle deine API Keys in .env ein!

# Server starten
npm start

# Für Development mit Auto-Reload
npm run dev
```

Der Server läuft dann auf: `http://localhost:3001`

## 🔑 API Keys erforderlich

### 1. PDF.co API Key
- Registriere dich auf [pdf.co](https://pdf.co/api)
- Hole dir einen kostenlosen Test-Key
- Trage ihn in `.env` ein: `PDF_CO_API_KEY=your_key`

### 2. Comet API Key
- Registriere dich auf [cometapi.com](https://cometapi.com)
- Hole dir deinen API Key
- Trage ihn in `.env` ein: `COMET_API_KEY=sk-xxxxx`

## 🌐 Deployment auf Render

### Automatisches Deployment

1. **Repository auf GitHub pushen**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/finny-pdf-assistant.git
   git push -u origin main
   ```

2. **Render Account erstellen**
   - Gehe zu [render.com](https://render.com)
   - Melde dich mit GitHub an

3. **Neuen Web Service erstellen**
   - "New" → "Web Service"
   - Verbinde dein GitHub Repository
   - Render erkennt automatisch `render.yaml`

4. **Environment Variables setzen**
   - Gehe zu "Environment" im Dashboard
   - Füge hinzu:
     - `PDF_CO_API_KEY` = dein Key
     - `COMET_API_KEY` = dein Key
     - `NODE_ENV` = production
     - `PORT` = 3001

5. **Deploy starten**
   - Klicke auf "Deploy"
   - Warte 2-3 Minuten
   - Deine App ist live! 🎉

## 📁 Projektstruktur

```
finny-pdf-assistant/
├── server.js              # Backend Server (Express + Comet API)
├── index.html             # Frontend (HTML + JavaScript)
├── package.json           # Dependencies & Scripts
├── .env.example           # Environment Template
├── .gitignore            # Git Ignore Rules
├── render.yaml           # Render Deployment Config
├── README.md             # Diese Datei
└── public/               # Static Files (optional)
    └── bg-removed-result.png  # Finny Logo
```

## 🎮 Verwendung

### 1. PDF hochladen
- Klicke auf "PDF hochladen" oder ziehe eine PDF-Datei hinein
- Warte auf die Feldextraktion

### 2. Formular ausfüllen
- Folge Finnys Anweisungen im Chat
- Bei Fragen gib "hilfe" ein
- Nutze Befehle für Navigation

### 3. Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `hilfe` | Erklärt das aktuelle Feld |
| `beispiel` | Zeigt Beispiele |
| `weiter` | Überspringt das Feld |
| `zurück` | Geht zum vorherigen Feld |
| `status` | Zeigt Fortschritt |
| `befehle` | Liste aller Befehle |
| `fertig` | Beendet die Eingabe |

### 4. PDF herunterladen
- Öffne die Vorschau
- Überprüfe deine Daten
- Klicke auf "PDF Download"

## 🛠️ Technologie-Stack

- **Backend:** Node.js + Express
- **AI:** Comet API (Kimi K2-Thinking Model)
- **PDF Processing:** PDF.co API
- **Frontend:** Vanilla JavaScript + HTML5/CSS3
- **File Upload:** Multer
- **HTTP Client:** Axios

## 📝 API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/health` | GET | Health Check |
| `/api/upload-pdf` | POST | PDF hochladen |
| `/api/extract-fields` | POST | Felder extrahieren |
| `/api/chat` | POST | Chat mit KI |
| `/api/fill-pdf` | POST | PDF ausfüllen |

## 🔒 Sicherheit

- ✅ API Keys nur in Environment Variables
- ✅ CORS konfiguriert
- ✅ File Size Limits (25MB)
- ✅ Input Validation
- ✅ Error Handling
- ⚠️ **WICHTIG:** Niemals `.env` Datei committen!

## 🐛 Troubleshooting

### Server startet nicht
```bash
# Port bereits belegt?
lsof -ti:3001 | xargs kill -9

# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

### API Fehler
- Überprüfe API Keys in `.env`
- Teste Keys mit `curl` oder Postman
- Check API Limits/Quota

### PDF Upload funktioniert nicht
- Max. Dateigröße: 25MB
- Nur PDF Dateien erlaubt
- PDF.co API Key korrekt?

## 🤝 Contributing

Contributions sind willkommen! 

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Changes (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📜 License

MIT License - siehe [LICENSE](LICENSE) Datei

## 👤 Autor

Dein Name - [@yourhandle](https://twitter.com/yourhandle)

## 🙏 Credits

- **AI Model:** Comet API - Kimi K2-Thinking
- **PDF Processing:** PDF.co API
- **Icons:** Font Awesome / Emoji

## 📞 Support

Bei Fragen oder Problemen:
- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/finny-pdf-assistant/issues)

---

Made with ❤️ and 🦊 by Your Name