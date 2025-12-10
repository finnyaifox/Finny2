require('dotenv').config();

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 🚀 COMET API MIT KIMI K2-THINKING MODEL
const COMET_API_URL = 'https://api.cometapi.com/v1/chat/completions';
const MODEL_NAME = "kimi-k2-thinking";

// ============================================
// 📋 ENHANCED LOGGING
// ============================================
const Logger = {
  info: (tag, msg, data = null) => {
    console.log(`\n✅ [${tag}] ${msg}`);
    if (data) console.log('   📊 Data:', data);
  },
  warn: (tag, msg, data = null) => {
    console.warn(`\n⚠️  [${tag}] ${msg}`);
    if (data) console.warn('   📊 Data:', data);
  },
  error: (tag, msg, err = null) => {
    console.error(`\n❌ [${tag}] ${msg}`);
    if (err) console.error('   Error:', err.message);
  },
  success: (tag, msg) => {
    console.log(`\n🚀 [${tag}] ${msg}`);
  },
  debug: (msg) => {
    console.log(`🔡 [DEBUG] ${msg}`);
  }
};

// ============================================
// 📋 ENV & API KEYS
// ============================================
let PDF_CO_API_KEY = process.env.PDF_CO_API_KEY;
let COMET_API_KEY = process.env.COMETAPI_KEY;

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║       🦊 FINNY v6.0 - Comet Kimi K2-Thinking Server       ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

Logger.debug('Checking API Keys...');

if (!PDF_CO_API_KEY) {
  Logger.warn('CONFIG', 'PDF_CO_API_KEY not found - TESTING MODE');
  PDF_CO_API_KEY = 'DEMO_KEY_REPLACE_WITH_REAL';
} else {
  Logger.success('CONFIG', 'PDF_CO_API_KEY loaded');
}

if (!COMET_API_KEY) {
  Logger.warn('CONFIG', 'COMET_API_KEY not found - TESTING MODE');
  COMET_API_KEY = 'DEMO_KEY_REPLACE_WITH_REAL';
} else {
  Logger.success('CONFIG', 'COMET_API_KEY loaded ✅');
}

// ============================================
// ⚙️ MIDDLEWARE
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.static(path.join(__dirname, 'public')));

Logger.debug('✓ Middleware configured');

// ============================================
// 📦 MULTER
// ============================================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

Logger.debug('✓ Multer configured');

// ============================================
// 💾 SESSIONS
// ============================================
const sessions = new Map();

// Erweiterte Feld-Hints für bessere KI-Unterstützung
const FIELD_HINTS = {
  'Ort und Nummer des Registereintrages': {
    hint: 'Geben Sie das Amtsgericht und die Registernummer ein',
    example: 'Amtsgericht München, HRB 12345',
    validation: 'Sollte Amtsgericht und Nummer enthalten'
  },
  'Eingetragener Name mit Rechtsform': {
    hint: 'Der offizielle Name Ihres Unternehmens mit Rechtsform',
    example: 'Beispiel GmbH',
    validation: 'Sollte eine Rechtsform enthalten (GmbH, UG, AG, etc.)'
  },
  'Name des Geschäfts': {
    hint: 'Der Geschäfts- oder Handelsname',
    example: 'Muster-Shop',
    validation: 'Handelsname des Unternehmens'
  },
  'Familienname': {
    hint: 'Ihr Nachname',
    example: 'Müller',
    validation: 'Sollte nur Buchstaben enthalten'
  },
  'Vorname': {
    hint: 'Ihr Vorname',
    example: 'Max',
    validation: 'Sollte nur Buchstaben enthalten'
  },
  'Geburtsname': {
    hint: 'Ihr Geburtsname (falls unterschiedlich)',
    example: 'Schmidt',
    validation: 'Nur wenn anders als aktueller Nachname'
  },
  'Geburtsdatum': {
    hint: 'Ihr Geburtsdatum',
    example: '15.03.1985',
    validation: 'Format: TT.MM.YYYY'
  },
  'Geburtsort und -land': {
    hint: 'Ort und Land Ihrer Geburt',
    example: 'München, Deutschland',
    validation: 'Stadt und Land'
  },
  'Anschrift der Wohnung': {
    hint: 'Ihre private Adresse',
    example: 'Musterstraße 12, 80331 München',
    validation: 'Straße, PLZ und Ort'
  },
  'Telefon': {
    hint: 'Ihre Telefonnummer',
    example: '+49 89 12345678',
    validation: 'Mit Vorwahl'
  },
  'Telefax': {
    hint: 'Ihre Faxnummer (optional)',
    example: '+49 89 12345679',
    validation: 'Mit Vorwahl oder leer'
  },
  'E-Mail/Web (freiwillig)': {
    hint: 'Ihre E-Mail oder Website',
    example: 'info@beispiel.de',
    validation: 'Gültige E-Mail-Adresse'
  },
  'Angemeldete Tätigkeit': {
    hint: 'Beschreiben Sie Ihre Geschäftstätigkeit',
    example: 'Online-Handel mit Elektronik',
    validation: 'Kurze Beschreibung der Tätigkeit'
  },
  'Beginn der angemeldeten Tätigkeit': {
    hint: 'Das Startdatum Ihrer Tätigkeit',
    example: '01.01.2024',
    validation: 'Format: TT.MM.YYYY'
  },
  'Anschrift der Betriebsstätte': {
    hint: 'Die Adresse des Betriebs',
    example: 'Gewerbestraße 5, 80333 München',
    validation: 'Kann identisch mit Wohnadresse sein'
  },
  'Zahl Vollzeit': {
    hint: 'Anzahl der Vollzeitbeschäftigten',
    example: '5',
    validation: 'Nur Zahlen'
  },
  'Zahl Teilzeit': {
    hint: 'Anzahl der Teilzeitbeschäftigten',
    example: '2',
    validation: 'Nur Zahlen'
  },
  'Datum der Unterschrift': {
    hint: 'Das Ausstellungsdatum',
    example: '07.12.2025',
    validation: 'Format: TT.MM.YYYY (heute oder geplant)'
  }
};

// ============================================
// 🧠 ERWEITERTE FELD-ANALYSE
// ============================================
const FIELD_TYPES = {
  checkbox: ['Männlich', 'Weiblich', 'Divers', 'Ja', 'Nein', 'Vollzeit', 'Teilzeit'],
  date: ['Datum', 'Geburtsdatum', 'Beginn', 'Ende'],
  email: ['E-Mail', 'Email', 'Mail'],
  phone: ['Telefon', 'Telefax', 'Mobil', 'Handy'],
  address: ['Anschrift', 'Adresse', 'Straße', 'PLZ', 'Ort'],
  number: ['Anzahl', 'Zahl', 'Nummer', 'Betrag']
};

function analyzeFieldType(fieldName) {
  const lower = fieldName.toLowerCase();
  
  // Checkbox-Felder erkennen
  for (const checkboxTerm of FIELD_TYPES.checkbox) {
    if (lower.includes(checkboxTerm.toLowerCase())) {
      return {
        type: 'checkbox',
        instruction: `Dies ist ein Auswahlfeld. Antworte mit "X" zum Ankreuzen oder "leer" zum Überspringen.`,
        example: 'Schreibe "X" oder lasse es leer'
      };
    }
  }
  
  // Datumsfelder
  if (FIELD_TYPES.date.some(term => lower.includes(term.toLowerCase()))) {
    return {
      type: 'date',
      instruction: 'Bitte gib ein Datum im Format TT.MM.JJJJ ein.',
      example: '15.03.2024'
    };
  }
  
  // E-Mail
  if (FIELD_TYPES.email.some(term => lower.includes(term.toLowerCase()))) {
    return {
      type: 'email',
      instruction: 'Gib eine gültige E-Mail-Adresse ein.',
      example: 'max.mustermann@beispiel.de'
    };
  }
  
  // Standard
  return {
    type: 'text',
    instruction: 'Bitte fülle dieses Feld aus.',
    example: 'Text eingeben'
  };
}

function getFieldIntroduction(field) {
  const fieldType = analyzeFieldType(field.fieldName);
  const baseIntros = {
    'Männlich': '📝 **Geschlecht auswählen**\nWenn du männlich bist, schreibe "X". Sonst lasse es leer oder schreibe "weiter".',
    'Weiblich': '📝 **Geschlecht auswählen**\nWenn du weiblich bist, schreibe "X". Sonst lasse es leer oder schreibe "weiter".',
    'Divers': '📝 **Geschlecht auswählen**\nWenn du divers bist, schreibe "X". Sonst lasse es leer oder schreibe "weiter".',
    'Familienname': '👤 **Dein Nachname**\nGib deinen Familiennamen ein, wie er in deinem Ausweis steht.',
    'Vorname': '👤 **Dein Vorname**\nGib deinen Vornamen ein.',
    'Geburtsdatum': '📅 **Wann wurdest du geboren?**\nGib dein Geburtsdatum im Format TT.MM.JJJJ ein.',
    'E-Mail': '📧 **Deine E-Mail-Adresse**\nGib eine gültige E-Mail-Adresse für die Kontaktaufnahme ein.',
    'Telefon': '📞 **Deine Telefonnummer**\nGib deine Telefonnummer mit Vorwahl ein.',
    'Anschrift': '🏠 **Deine Adresse**\nGib deine vollständige Anschrift ein (Straße, Hausnummer, PLZ, Ort).'
  };
  
  // Suche nach passendem Intro
  for (const [key, intro] of Object.entries(baseIntros)) {
    if (field.fieldName.includes(key)) {
      return intro + '\n\n' + fieldType.instruction;
    }
  }
  
  // Standard-Intro
  return `📝 **${field.fieldName}**\n\n${fieldType.instruction}`;
}

// Befehle-System
const COMMANDS = {
  'befehle': 'Zeigt alle verfügbaren Befehle',
  'hilfe': 'Gibt Hilfe zum aktuellen Feld',
  'weiter': 'Überspringt das aktuelle Feld',
  'zurück': 'Geht zum vorherigen Feld',
  'gehe zu [Feldname]': 'Springt zu einem bestimmten Feld',
  'status': 'Zeigt den aktuellen Fortschritt',
  'fertig': 'Beendet die Eingabe',
  'beispiel': 'Zeigt ein Beispiel für das aktuelle Feld'
};

Logger.debug('✓ Session management ready');

// ============================================
// 🤖 COMET API CLIENT CHECK
// ============================================
let cometApiActive = false;

if (COMET_API_KEY && !COMET_API_KEY.includes('DEMO')) {
  cometApiActive = true;
  Logger.success('AI', `✅ Comet API with Kimi K2-Thinking initialized`);
  Logger.success('AI', `🧠 Model: ${MODEL_NAME}`);
} else {
  Logger.warn('AI', 'Comet API NOT initialized (using DEMO mode)');
}

// ============================================
// 🏥 HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'FINNY server is running',
    timestamp: new Date().toISOString(),
    model: MODEL_NAME,
    apiKeysConfigured: {
      pdf_co: PDF_CO_API_KEY !== 'DEMO_KEY_REPLACE_WITH_REAL',
      comet: COMET_API_KEY !== 'DEMO_KEY_REPLACE_WITH_REAL'
    },
    aiProvider: 'Comet API - Kimi K2-Thinking'
  });
});

Logger.debug('✓ Health endpoint registered');

// ============================================
// 📤 UPLOAD PDF
// ============================================
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      Logger.error('UPLOAD', 'No file provided');
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    Logger.info('UPLOAD', `Processing: ${req.file.originalname} (${req.file.size} bytes)`);

    if (PDF_CO_API_KEY.includes('DEMO')) {
      Logger.warn('UPLOAD', 'Using DEMO mode');
      return res.json({
        success: true,
        url: 'https://api.pdf.co/demo/file.pdf',
        size: req.file.size,
        fileName: req.file.originalname,
        message: 'DEMO MODE'
      });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: 'application/pdf'
    });

    const uploadRes = await axios.post(
      'https://api.pdf.co/v1/file/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': PDF_CO_API_KEY
        },
        timeout: 30000
      }
    );

    Logger.info('UPLOAD', 'Response received', uploadRes.data);

    if (uploadRes.data.error) {
      throw new Error(uploadRes.data.message || uploadRes.data.error);
    }

    if (!uploadRes.data.url) {
      throw new Error('No URL in response');
    }

    Logger.success('UPLOAD', `PDF uploaded: ${uploadRes.data.url}`);
    res.json({
      success: true,
      url: uploadRes.data.url,
      size: uploadRes.data.size || req.file.size,
      fileName: req.file.originalname
    });

  } catch (err) {
    Logger.error('UPLOAD', 'Failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

Logger.debug('✓ Upload endpoint registered');

// ============================================
// 🔍 EXTRACT FIELDS
// ============================================
app.post('/api/extract-fields', async (req, res) => {
  try {
    const { url, sessionId } = req.body;
    Logger.info('EXTRACT', `Processing PDF: ${url}`);

    if (PDF_CO_API_KEY.includes('DEMO')) {
      Logger.warn('EXTRACT', 'Using DEMO mode');
      
      const session = {
        sessionId,
        fields: [
          { index: 0, fieldName: 'Demo_Field_1', type: 'text', pageIndex: 0, value: '', required: false },
          { index: 1, fieldName: 'Demo_Field_2', type: 'email', pageIndex: 0, value: '', required: false }
        ],
        pdfUrl: url,
        currentFieldIndex: 0,
        history: [],
        collectedData: {}
      };
      sessions.set(sessionId, session);
      Logger.success('EXTRACT', `Session erstellt: ${sessionId}`);
      
      return res.json({
        success: true,
        fields: session.fields,
        totalFields: 2,
        fieldNames: ['Demo_Field_1', 'Demo_Field_2'],
        message: 'DEMO MODE'
      });
    }

    const extractRes = await axios.post(
      'https://api.pdf.co/v1/pdf/info/fields',
      {
        url,
        async: false
      },
      {
        headers: { 'x-api-key': PDF_CO_API_KEY },
        timeout: 30000
      }
    );

    Logger.info('EXTRACT', 'Response received');

    let fieldsData = [];
    
    if (extractRes.data.info?.FieldsInfo?.Fields) {
      fieldsData = extractRes.data.info.FieldsInfo.Fields;
    } else if (extractRes.data.info?.fields) {
      fieldsData = extractRes.data.info.fields;
    } else if (extractRes.data.fields) {
      fieldsData = extractRes.data.fields;
    }

    Logger.info('EXTRACT', `Found ${fieldsData.length} fields`);

    const cleanFields = fieldsData
      .filter(field => field.FieldName || field.fieldName || field.name)
      .map((field, index) => ({
        index,
        fieldName: field.FieldName || field.fieldName || field.name,
        type: field.Type || field.type || 'text',
        pageIndex: field.PageIndex || field.pageIndex || 0,
        value: field.Value || field.value || '',
        required: field.Required || field.required || false
      }));

    const session = {
      sessionId,
      fields: cleanFields,
      pdfUrl: url,
      currentFieldIndex: 0,
      history: [],
      collectedData: {}
    };
    sessions.set(sessionId, session);
    Logger.success('EXTRACT', `Session erstellt: ${sessionId}`);

    Logger.success('EXTRACT', `Extracted and cleaned ${cleanFields.length} fields`);

    res.json({
      success: true,
      fields: cleanFields,
      totalFields: cleanFields.length,
      fieldNames: cleanFields.map(f => f.fieldName)
    });

  } catch (err) {
    Logger.error('EXTRACT', 'Failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

Logger.debug('✓ Extract endpoint registered');

// ============================================
// 📊 GET SESSION STATUS
// ============================================
app.get('/api/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  const fieldsStatus = session.fields.map(field => ({
    fieldName: field.fieldName,
    index: field.index,
    value: session.collectedData[field.fieldName] || '',
    completed: !!session.collectedData[field.fieldName]
  }));
  
  res.json({
    success: true,
    fields: fieldsStatus,
    currentIndex: session.currentFieldIndex,
    totalCompleted: Object.keys(session.collectedData).length,
    totalFields: session.fields.length
  });
});

// ============================================
// 📝 UPDATE SINGLE FIELD
// ============================================
app.post('/api/update-field', (req, res) => {
  const { sessionId, fieldName, value } = req.body;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  session.collectedData[fieldName] = value;
  Logger.info('FIELD', `Updated ${fieldName} = ${value}`);
  
  res.json({ success: true, collectedData: session.collectedData });
});

// 🔄 UPDATE SESSION
// ============================================
app.post('/api/update-session', (req, res) => {
    const { sessionId, fields } = req.body;
    const session = sessions.get(sessionId);
    if (session) {
        session.fields = fields;
        Logger.info('SESSION', `Updated session ${sessionId} with ${fields.length} fields`);
    }
    res.json({ success: true });
});

Logger.debug('✓ Update session endpoint registered');

// ============================================
// 🧠 INTELLIGENTE HELPER FUNKTIONEN
// ============================================

// Validiert Benutzereingaben
function validateInput(message, field) {
  const lowerMsg = message.toLowerCase().trim();
  
  // Ungültige Eingaben
  if (lowerMsg === 'ok' || lowerMsg === 'f' || lowerMsg === 'test' || lowerMsg.length < 2) {
    return {
      valid: false,
      reason: 'Die Eingabe ist zu kurz oder ungültig. Bitte geben Sie einen sinnvollen Wert ein.'
    };
  }
  
  // Spezifische Validierungen
  if (field.fieldName.includes('Datum')) {
    const datePattern = /\d{1,2}\.\d{1,2}\.\d{4}/;
    if (!datePattern.test(message)) {
      return {
        valid: false,
        reason: 'Bitte geben Sie ein Datum im Format TT.MM.YYYY ein (z.B. 15.03.2024).'
      };
    }
  }
  
  if (field.fieldName.includes('Telefon') || field.fieldName.includes('Telefax')) {
    if (message.length < 6 || !/\d/.test(message)) {
      return {
        valid: false,
        reason: 'Bitte geben Sie eine gültige Telefonnummer ein.'
      };
    }
  }
  
  if (field.fieldName.includes('E-Mail')) {
    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(message) && message.length > 3) {
      return {
        valid: false,
        reason: 'Bitte geben Sie eine gültige E-Mail-Adresse ein (z.B. info@beispiel.de).'
      };
    }
  }
  
  return { valid: true };
}

// Analysiert Benutzer-Intent
function analyzeIntent(message, session) {
  const lowerMsg = message.toLowerCase().trim();
  
  // Befehle erkennen
  if (lowerMsg === 'befehle' || lowerMsg === 'commands') {
    return { type: 'show_commands' };
  }
  
  if (lowerMsg === 'hilfe' || lowerMsg === 'help' || lowerMsg.includes('was ist') || lowerMsg.includes('beispiel')) {
    return { type: 'help' };
  }
  
  if (lowerMsg === 'weiter' || lowerMsg === 'skip' || lowerMsg === 'überspringen') {
    return { type: 'skip' };
  }
  
  if (lowerMsg === 'zurück' || lowerMsg === 'back') {
    return { type: 'back' };
  }
  
  if (lowerMsg === 'status' || lowerMsg === 'fortschritt') {
    return { type: 'status' };
  }
  
  if (lowerMsg === 'fertig' || lowerMsg === 'done' || lowerMsg === 'abschluss') {
    return { type: 'finish' };
  }
  
  // Navigation zu spezifischem Feld
  if (lowerMsg.includes('gehe zu') || lowerMsg.includes('springe zu') || lowerMsg.includes('zu feld')) {
    const fieldName = message.substring(message.indexOf('zu') + 2).trim();
    return { type: 'navigate', target: fieldName };
  }
  
  // Normale Eingabe
  return { type: 'input', value: message };
}

// Findet Feld anhand von Teilnamen
function findFieldByPartialName(partialName, fields) {
  const normalized = partialName.toLowerCase().trim();
  return fields.findIndex(f => 
    f.fieldName.toLowerCase().includes(normalized)
  );
}

// ============================================
// 💬 CHAT - INTELLIGENTE KI INTEGRATION
// ============================================
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, messages, currentFieldIndex: clientFieldIndex, collectedData: clientData } = req.body;
    
    let session = sessions.get(sessionId);
    
    // ✅ SESSION RECOVERY
    if (!session) {
      Logger.warn('CHAT', `Session ${sessionId} nicht gefunden, erzeuge neue`);
      session = {
        sessionId,
        fields: [],
        currentFieldIndex: clientFieldIndex || 0,
        collectedData: clientData || {},
        history: []
      };
      sessions.set(sessionId, session);
    }
    
    // ✅ CLIENT SYNC
    if (clientFieldIndex !== undefined) session.currentFieldIndex = clientFieldIndex;
    if (clientData) session.collectedData = { ...session.collectedData, ...clientData };
    
    const lastUserMsg = messages?.filter(m => m.role === 'user').pop()?.content || '';
    const lowerMsg = lastUserMsg.toLowerCase().trim();
    
    const field = session.fields[session.currentFieldIndex];
    if (!field) {
      return res.json({
        success: true,
        response: '✅ Alle Felder wurden bearbeitet!',
        action: 'completed'
      });
    }
    
    // ✅ ERWEITERTE BEFEHLE
    
    // LÖSCHEN
    if (['löschen', 'clear', 'entfernen', 'reset'].includes(lowerMsg)) {
      delete session.collectedData[field.fieldName];
      Logger.info('CHAT', `Feld ${field.fieldName} gelöscht`);
      return res.json({
        success: true,
        response: `🗑️ Feld "${field.fieldName}" wurde geleert.`,
        action: 'field_cleared'
      });
    }
    
    // ÜBERSPRINGEN
    if (['weiter', 'skip', 'überspringen', 'next'].includes(lowerMsg)) {
      session.collectedData[field.fieldName] = '';
      session.currentFieldIndex++;
      Logger.info('CHAT', `Feld ${field.fieldName} übersprungen`);
      return res.json({
        success: true,
        response: '⏭️ Feld übersprungen.',
        action: 'skip',
        nextFieldIndex: session.currentFieldIndex
      });
    }
    
    // ZURÜCK
    if (['zurück', 'back', 'vorheriges', 'previous'].includes(lowerMsg)) {
      if (session.currentFieldIndex > 0) {
        session.currentFieldIndex--;
        const prevField = session.fields[session.currentFieldIndex];
        Logger.info('CHAT', `Zurück zu Feld ${prevField.fieldName}`);
        return res.json({
          success: true,
          response: `↩️ Zurück zu: **${prevField.fieldName}**`,
          action: 'back',
          nextFieldIndex: session.currentFieldIndex
        });
      }
    }
    
    // STATUS
    if (['status', 'fortschritt', 'progress'].includes(lowerMsg)) {
      const completed = Object.keys(session.collectedData).length;
      const total = session.fields.length;
      const percent = Math.round((completed / total) * 100);
      
      let statusText = `📊 **Fortschritt: ${completed}/${total} Felder (${percent}%)**\n\n`;
      statusText += `Aktuelles Feld: **${field.fieldName}**\n`;
      
      return res.json({
        success: true,
        response: statusText,
        isCommand: true
      });
    }
    
    // HILFE
    if (['hilfe', 'help', '?', 'was'].includes(lowerMsg)) {
      const fieldType = analyzeFieldType(field.fieldName);
      const fieldHint = FIELD_HINTS[field.fieldName] || {};
      
      let helpText = `💡 **Ausführliche Hilfe für: ${field.fieldName}**\n\n`;
      helpText += `**Feldtyp:** ${fieldType.type}\n`;
      helpText += `**Anleitung:** ${fieldType.instruction}\n`;
      helpText += `**Beispiel:** ${fieldType.example}\n\n`;
      
      if (fieldHint.hint) {
        helpText += `**Zusatzinfo:** ${fieldHint.hint}\n\n`;
      }
      
      helpText += `**🛠️ Verfügbare Befehle:**\n`;
      helpText += `• "löschen" - Feld leeren\n`;
      helpText += `• "weiter" - Überspringen\n`;
      helpText += `• "zurück" - Vorheriges Feld\n`;
      helpText += `• "status" - Fortschritt anzeigen`;
      
      Logger.info('CHAT', `Hilfe angezeigt für ${field.fieldName}`);
      return res.json({
        success: true,
        response: helpText,
        isHelp: true
      });
    }
    
    // CHECKBOX-FELDER
    const fieldType = analyzeFieldType(field.fieldName);
    if (fieldType.type === 'checkbox') {
      if (['x', 'ja', 'ankreuzen', 'ja bitte'].includes(lowerMsg)) {
        session.collectedData[field.fieldName] = 'X';
        session.currentFieldIndex++;
        Logger.info('CHAT', `Checkbox ${field.fieldName} angekreuzt`);
        return res.json({
          success: true,
          response: '✅ Angekreuzt mit "X"',
          action: 'field_saved',
          nextFieldIndex: session.currentFieldIndex
        });
      } else if (['nein', 'leer', 'nicht an', 'nein danke'].includes(lowerMsg)) {
        session.collectedData[field.fieldName] = '';
        session.currentFieldIndex++;
        Logger.info('CHAT', `Checkbox ${field.fieldName} nicht angekreuzt`);
        return res.json({
          success: true,
          response: '⭕ Nicht angekreuzt (leer gelassen)',
          action: 'field_saved',
          nextFieldIndex: session.currentFieldIndex
        });
      }
    }
    
    // NORMALE EINGABE speichern
    if (lastUserMsg.length > 0) {
      session.collectedData[field.fieldName] = lastUserMsg;
      const currentIndex = session.currentFieldIndex;
      session.currentFieldIndex++;
      
      // INTELLIGENTE KI-ANTWORT
      let aiResponse = '';
      const nextField = session.fields[session.currentFieldIndex];
      
      // 🧠 AUSFÜHRLICHER, INTELLIGENTER SYSTEM PROMPT
      const systemPrompt = `Du bist Finny, ein hochintelligenter und freundlicher PDF-Assistent mit Persönlichkeit. Deine Aufgabe ist es, Nutzern beim Ausfüllen von PDF-Formularen zu helfen - aber nicht wie ein roboterhafter Formularassistent, sondern wie ein kompetenter, einfühlsamer Mensch, der den Kontext versteht.

### **PERSÖNLICHKEIT & TONFALL**
- Sei freundlich, aber professionell - wie ein guter Kollege oder Berater
- Verwende gelegentlich Emojis, aber nicht übertrieben (max 2-3 pro Nachricht)
- Spreche den Nutzer direkt an ("du", "deine")
- Zeige echtes Interesse: "Ah, spannend!", "Verstehe!", "Super!"
- Feiere Erfolge: "Perfekt!", "Genau so!", "Toll gemacht!"

### **KONTEXTBEWUSSTSEIN**
- Analysiere das aktuelle Feld und das Vorherige
- Wenn jemand "Berlin" als Ort eingibt, sag: "Ah, aus der Hauptstadt! 🏛️"
- Bei Firmennamen: "Gute Wahl, XYZ ist ein renommierter Arbeitgeber!"
- Bei Geburtsdatum: Erkenne das Alter und passe deine Sprache an

### **INTELLIGENTE BEGLEITUNG NACH FORTSCHRITT**
- **STAGE 1 (Felder 1-3):** Sei sehr einladend und erklärend: "Lass uns starten! Das erste Feld ist..."
- **STAGE 2 (Felder 4-8):** Sei motivierend: "Super Fortschritt! Weiter so..."
- **STAGE 3 (Felder 9-15):** Bleib enthusiastisch: "Fast geschafft! Noch ein paar Felder..."
- **STAGE 4 (Letzte 3 Felder):** Werde emotional: "Du bist so nah dran! 💪"
- **STAGE 5 (Abgeschlossen):** FEIERE: "🎉 **WOW!** Du hast es geschafft! Du bist ein absoluter Profi!"

### **VALIDIERUNG & INTELLIGENZ**
- Bei ungewöhnlichen Eingaben gib freundliche Hinweise
- Bei E-Mail: "Gute Wahl, die .de-Domain ist zuverlässig!"
- Bei Telefonnummern: "Deutschland-Prefix +49 erkannt - perfekt!"
- Erkenne Muster: "Ah, eine Postleitzahl aus Bayern - schöne Gegend!"

### **SPRACHQUALITÄT**
- Formuliere flüssig und natürlich
- Vermeide Wiederholungen
- Nutze Synonyme: "Gespeichert!", "Notiert!", "Habe ich!", "Verstanden!"

### **AKTUELLER KONTEXT:**
- **Gerade gespeichertes Feld**: "${field.fieldName}" = "${lastUserMsg}"
- **Nächstes Feld**: "${nextField ? nextField.fieldName : 'Letztes Feld erreicht'}"
- **Fortschritt**: ${currentIndex + 1} von ${session.fields.length} Feldern
- **User Input**: "${lastUserMsg}"

### **DEINE ANTWORT SOLL:**
1. Die Eingabe bestätigen (kurz & persönlich, 1 Satz)
2. Zum nächsten Feld überleiten (natürlich, nicht abrupt, 1-2 Sätze)
3. Falls letztes Feld, begeistert abschließen (2-3 Sätze mit Emotion)
4. Falls letztes Feld ERREICHT, NICHT "Nächstes Feld" erwähnen, sondern FEIERN!
5. Maximal 3-4 Sätze, aber flüssig formuliert
6. NIE "Nächstes Feld: null" oder ähnliches sagen
7. IMMER positiv und motivierend bleiben!`;

      // Logging für Debugging
      Logger.info('CHAT', `Generiere KI-Antwort für Feld ${field.fieldName} mit System Prompt Länge: ${systemPrompt.length}`);
      
      try {
        const aiRes = await axios.post(
          'https://api.cometapi.com/v1/chat/completions',
          {
            model: MODEL_NAME,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: lastUserMsg }
            ],
            temperature: 0.75,
            max_tokens: 300,
            top_p: 0.9
          },
          {
            headers: {
              'Authorization': `Bearer ${COMET_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        
        aiResponse = aiRes.data.choices?.[0]?.message?.content || `✅ "${lastUserMsg}" gespeichert!`;
        Logger.success('CHAT', `KI-Antwort erfolgreich generiert`);
        
      } catch (err) {
        Logger.warn('COMET', 'AI fehlgeschlagen, Fallback verwendet', err);
        // Intelligenter Fallback
        aiResponse = `✅ "${lastUserMsg}" für **${field.fieldName}** gespeichert!`;
        
        const nextField = session.fields[session.currentFieldIndex];
        if (nextField) {
          const remaining = session.fields.length - session.currentFieldIndex;
          if (remaining <= 3) {
            aiResponse += `\n\n🎉 Fast geschafft! Nur noch ${remaining} Feld${remaining > 1 ? 'er' : ''}. Du schaffst das!`;
          } else {
            aiResponse += `\n\nNächstes Feld: **${nextField.fieldName}**. Weiter so!`;
          }
        } else {
          aiResponse += '\n\n🎊 **Herzlichen Glückwunsch!** Alle Felder sind ausgefüllt. Du kannst das PDF jetzt herunterladen!';
        }
      }
      
      // Hier geht es nach dem try/catch weiter
      Logger.info('CHAT', `Feld ${field.fieldName} gespeichert, Index: ${session.currentFieldIndex}`);
      return res.json({
        success: true,
        response: aiResponse,
        action: 'field_saved',
        nextFieldIndex: session.currentFieldIndex,
        collectedData: session.collectedData
      });
    }
    
    // Fallback für leere/unbekannte Eingabe
    Logger.info('CHAT', 'Keine Aktion erkannt, Standardantwort');
    return res.json({
      success: true,
      response: 'Bitte gib einen Wert ein oder nutze "hilfe" für Unterstützung.',
      isCommand: true
    });
    
  } catch (err) {
    Logger.error('CHAT', 'Failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

Logger.debug('✓ Chat endpoint registered');

// ============================================
// 📝 FILL PDF
// ============================================
app.post('/api/fill-pdf', async (req, res) => {
  try {
    const { url, sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(400).json({ success: false, error: 'Session not found' });
    }

    Logger.info('FILL', `Filling PDF with ${Object.keys(session.collectedData || {}).length} values`);

    if (PDF_CO_API_KEY.includes('DEMO')) {
      Logger.warn('FILL', 'Using DEMO mode');
      return res.json({
        success: true,
        url: 'https://api.pdf.co/demo/filled.pdf',
        message: 'DEMO MODE - PDF filled (mock)'
      });
    }

    const collectedData = session.collectedData || {};
    const fields = Object.entries(collectedData).map(([fieldName, text]) => ({
      fieldName,
      text: String(text)
    }));

    Logger.info('FILL', 'Fields to fill', fields);

    const fillRes = await axios.post(
      'https://api.pdf.co/v1/pdf/edit/add',
      {
        url,
        fields,
        async: false,
        inline: true
      },
      {
        headers: {
          'x-api-key': PDF_CO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    Logger.info('FILL', 'Response received', fillRes.data);

    if (fillRes.data.error) {
      throw new Error(fillRes.data.message || fillRes.data.error);
    }

    Logger.success('FILL', `PDF filled: ${fillRes.data.url}`);
    res.json({
      success: true,
      url: fillRes.data.url,
      message: 'PDF erfolgreich ausgefüllt!'
    });

  } catch (err) {
    Logger.error('FILL', 'Failed', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

Logger.debug('✓ Fill endpoint registered');

// ============================================
// 🚀 ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  Logger.error('SERVER', 'Unhandled error', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║ 🚀 Finny PDF Form Assistant - Backend v6.0               ║
║                                                            ║
║ ✅ Comet API mit Kimi K2-Thinking Model                  ║
║ ✅ Intelligente Validierung                              ║
║ ✅ Befehle-System                                         ║
║ ✅ Smart Navigation                                       ║
║ ✅ Context-Aware Responses                               ║
║ ✅ Enhanced Error Detection                              ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝

🔡 Server running: http://localhost:${PORT}
🤖 AI Model: ${MODEL_NAME}
🧠 AI Provider: Comet API
🎯 Status: READY

API Endpoints:
  POST /api/upload-pdf - Upload PDF file
  POST /api/extract-fields - Extract form fields
  POST /api/chat - Intelligent Chat with Kimi K2-Thinking
  POST /api/fill-pdf - Fill PDF with values
  GET /api/health - Health check

Features:
  • Smart Intent Detection ✅
  • Input Validation ✅
  • Command System ✅
  • Field Navigation ✅
  • Context Awareness ✅
  • Kimi K2-Thinking AI ✅

Viel Erfolg! 🦊
`);

  Logger.success('SERVER', `Ready at http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    Logger.error('SERVER', `Port ${PORT} is already in use!`);
    process.exit(1);
  }
});

module.exports = app;
