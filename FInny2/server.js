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
const COMET_API_URL = 'https://api.cometapi.com/v1/messages';
const MODEL_NAME = "claude-sonnet-4-5-20250929-thinking";

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
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      Logger.error('CHAT', `Session not found: ${sessionId}`);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    Logger.debug(`Chat [${sessionId}]: ${message.substring(0, 50)}...`);

    // Intent analysieren
    const intent = analyzeIntent(message, session);
    
    // Befehle behandeln
    if (intent.type === 'show_commands') {
      let commandsList = '📋 **Verfügbare Befehle:**\n\n';
      for (const [cmd, desc] of Object.entries(COMMANDS)) {
        commandsList += `• **${cmd}** - ${desc}\n`;
      }
      
      session.history.push({ role: 'user', content: message });
      session.history.push({ role: 'assistant', content: commandsList });
      
      return res.json({
        success: true,
        response: commandsList,
        isCommand: true
      });
    }
    
    if (intent.type === 'skip') {
      session.history.push({ role: 'user', content: message });
      return res.json({
        success: true,
        response: '⏭️ Feld übersprungen.',
        action: 'skip'
      });
    }
    
    if (intent.type === 'back') {
      if (session.currentFieldIndex > 0) {
        session.currentFieldIndex--;
        const prevField = session.fields[session.currentFieldIndex];
        return res.json({
          success: true,
          response: `⬅️ Zurück zu: **${prevField.fieldName}**`,
          action: 'back',
          fieldIndex: session.currentFieldIndex
        });
      } else {
        return res.json({
          success: true,
          response: '⚠️ Du bist bereits beim ersten Feld.',
          isCommand: true
        });
      }
    }
    
    if (intent.type === 'status') {
      const completed = Object.keys(session.collectedData).length;
      const total = session.fields.length;
      const percent = Math.round((completed / total) * 100);
      
      return res.json({
        success: true,
        response: `📊 **Fortschritt:** ${completed}/${total} Felder ausgefüllt (${percent}%)`,
        isCommand: true
      });
    }
    
    if (intent.type === 'finish') {
      return res.json({
        success: true,
        response: '✅ Eingabe beendet! Du kannst jetzt die Vorschau öffnen.',
        action: 'finish'
      });
    }
    
    if (intent.type === 'navigate') {
      const targetIndex = findFieldByPartialName(intent.target, session.fields);
      if (targetIndex !== -1) {
        session.currentFieldIndex = targetIndex;
        const targetField = session.fields[targetIndex];
        return res.json({
          success: true,
          response: `🎯 Springe zu Feld: **${targetField.fieldName}**`,
          action: 'navigate',
          fieldIndex: targetIndex
        });
      } else {
        return res.json({
          success: true,
          response: `❌ Feld "${intent.target}" nicht gefunden. Nutze "befehle" für eine Liste aller Felder.`,
          isCommand: true
        });
      }
    }

    const field = session.fields[session.currentFieldIndex];
    
    // Hilfe-Request mit verbesserter KI
    if (intent.type === 'help') {
      if (cometApiActive && !COMET_API_KEY.includes('DEMO')) {
        try {
          const fieldInfo = FIELD_HINTS[field.fieldName] || {
            hint: 'Bitte geben Sie einen Wert ein',
            example: 'Beispiel',
            validation: 'Keine spezifischen Anforderungen'
          };
          
          const systemPrompt = `Du bist Finny, ein hochintelligenter, freundlicher und professioneller PDF-Formular-Assistent.

Deine Aufgabe ist es, den Nutzer Schritt für Schritt durch alle Formularfelder zu begleiten.

WICHTIGE REGELN:
1. Wenn der Nutzer eine Frage stellt ("Was ist das?", "Erklär mir das", "Beispiel"), gib eine ausführliche, verständliche Erklärung
2. Nutze die Feldbeschreibung, Beispielwerte und Tipps in deinen Antworten
3. Sei immer freundlich, professionell und auf Deutsch
4. Erkläre KONKRET und PRAKTISCH, nicht theoretisch
5. Gib IMMER ein konkretes Beispiel
6. Maximal 3-4 Sätze + Beispiel

AKTUELLES FELD:
- Name: "${field.fieldName}"
- Typ: ${field.type}
- Erforderlich: ${field.required ? 'Ja' : 'Nein'}
- Hinweis: ${fieldInfo.hint}
- Beispiel: ${fieldInfo.example}
- Validierung: ${fieldInfo.validation}

Der Nutzer fragt: "${message}"

Gib jetzt eine hilfreiche, konkrete Erklärung mit Beispiel!`;

          const response = await axios.post(
            COMET_API_URL,
            {
              model: MODEL_NAME,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
              ],
              temperature: 0.7,
              max_tokens: 500
            },
            {
              headers: {
                'Authorization': `Bearer ${COMET_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );

          let helpText = response.data.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Erklärung finden.';
          
          session.history.push({ role: 'user', content: message });
          session.history.push({ role: 'assistant', content: helpText });

          return res.json({
            success: true,
            response: `💡 ${helpText}`,
            isHelp: true,
            fieldName: field.fieldName
          });
        } catch (aiErr) {
          Logger.warn('COMET', 'Help request failed, using fallback', aiErr);
        }
      }
      
      // Fallback ohne KI
      const fieldInfo = FIELD_HINTS[field.fieldName] || {
        hint: 'Bitte geben Sie einen Wert ein',
        example: 'Beispiel',
        validation: 'Keine spezifischen Anforderungen'
      };
      
      return res.json({
        success: true,
        response: `💡 ${fieldInfo.hint}\n\nBeispiel: ${fieldInfo.example}`,
        isHelp: true,
        fieldName: field.fieldName
      });
    }

    // Normale Eingabe validieren
    const validation = validateInput(message, field);
    
    if (!validation.valid) {
      return res.json({
        success: true,
        response: `⚠️ ${validation.reason}`,
        isValidation: true,
        needsCorrection: true
      });
    }

    // Intelligente Bestätigung mit KI
    let confirmationMsg = `✅ Gespeichert!`;
    
    if (cometApiActive && !COMET_API_KEY.includes('DEMO')) {
      try {
        const fieldInfo = FIELD_HINTS[field.fieldName] || {};
        
        const systemPrompt = `Du bist Finny, ein intelligenter PDF-Formular-Assistent.

AUFGABE: Validiere die Benutzereingabe für das Formularfeld.

FELD: "${field.fieldName}"
ERWARTUNG: ${fieldInfo.hint || 'Kein spezifischer Hinweis'}
BEISPIEL: ${fieldInfo.example || 'Kein Beispiel'}
EINGABE: "${message}"

Bewerte die Eingabe:
- Ist sie vollständig und sinnvoll?
- Passt sie zum erwarteten Format?
- Ist sie zu kurz, zu allgemein oder unsinnig?

Antworte NUR mit einem der folgenden:
1. "OK" - wenn die Eingabe gut ist
2. "NEEDS_IMPROVEMENT: [kurze Begründung]" - wenn sie verbessert werden sollte
3. "INVALID: [kurze Begründung]" - wenn sie ungültig ist

WICHTIG: Kurze unsinnige Eingaben wie "ok", "f", "test", "1111" sind INVALID!`;

        const response = await axios.post(
          COMET_API_URL,
          {
            model: MODEL_NAME,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Validiere: "${message}"` }
            ],
            temperature: 0.3,
            max_tokens: 200
          },
          {
            headers: {
              'Authorization': `Bearer ${COMET_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const aiValidation = response.data.choices[0]?.message?.content?.trim() || 'OK';
        
        if (aiValidation.includes('INVALID')) {
          const reason = aiValidation.split(':')[1]?.trim() || 'Die Eingabe scheint nicht vollständig zu sein.';
          return res.json({
            success: true,
            response: `⚠️ ${reason}\n\nBitte versuche es erneut oder gib "hilfe" ein für Unterstützung.`,
            isValidation: true,
            needsCorrection: true
          });
        }
        
        if (aiValidation.includes('NEEDS_IMPROVEMENT')) {
          const suggestion = aiValidation.split(':')[1]?.trim() || 'Die Eingabe könnte detaillierter sein.';
          confirmationMsg = `⚠️ Hinweis: ${suggestion}\n\nMöchtest du die Eingabe korrigieren? Gib "zurück" ein oder fahre mit "weiter" fort.`;
        }
        
      } catch (aiErr) {
        Logger.warn('COMET', 'Validation failed, using simple confirmation', aiErr);
      }
    }

    // Eingabe speichern
    session.collectedData[field.fieldName] = message;
    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'assistant', content: confirmationMsg });

    res.json({
      success: true,
      response: confirmationMsg,
      isHelp: false,
      fieldName: field.fieldName,
      action: 'saved'
    });

  } catch (err) {
    Logger.error('CHAT', 'Failed', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
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
