/**
 * GOOGLE APPS SCRIPT FOR INVENTARIO PRO
 * Installa questo script in un nuovo progetto Google Apps Script associato a un foglio Google.
 */

// Configurazione: Nome del foglio dove salvare i dati
const SHEET_NAME = 'DataStore';

/**
 * Gestisce le richieste GET (Caricamento dati all'avvio)
 */
function doGet(e) {
    const sheet = getOrCreateSheet();
    const data = sheet.getRange(1, 1).getValue();

    let output = {};
    if (data) {
        try {
            output = JSON.parse(data);
        } catch (err) {
            output = { error: "Dati non validi nel foglio" };
        }
    }

    // Supporto JSONP per aggirare in modo permanente il CORS senza proxy
    if (e && e.parameter && e.parameter.callback) {
        return ContentService.createTextOutput(e.parameter.callback + '(' + JSON.stringify(output) + ')')
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Gestisce le richieste POST (Salvataggio dati automatico)
 */
function doPost(e) {
    try {
        const jsonString = e.parameter.data;
        if (!jsonString) {
            throw new Error("Nessun dato ricevuto");
        }

        // Verifica che sia JSON valido prima di salvare
        JSON.parse(jsonString);

        const sheet = getOrCreateSheet();
        sheet.getRange(1, 1).setValue(jsonString);

        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
            .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Funzione di utilità per recuperare o creare il foglio di lavoro
 */
function getOrCreateSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        // Nascondi il foglio per evitare modifiche accidentali
        sheet.hideSheet();
    }
    return sheet;
}
