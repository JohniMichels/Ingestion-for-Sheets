/**
 * Return settings if they are set. Otherwise, return null.
 * @return {object} settings
 * @return {string} settings.targetUrl
 * @return {string} settings.headers
 * @see https://developers.google.com/apps-script/guides/properties
 */
function getSettingsIfSet() {
    var targetUrl = PropertiesService.getDocumentProperties().getProperty('targetUrl');
    var headers = PropertiesService.getDocumentProperties().getProperty('headers');
    var sheets = PropertiesService.getDocumentProperties().getProperty('sheets');
    if (!targetUrl || !headers) {
      return null;
    }
    return {
      targetUrl: targetUrl,
      headers: headers,
      sheets: JSON.parse(sheets ?? '[]')
    };
  }

/** 
 * Gets settings from document properties. Throws error if target url or headers is not set.
 */
function getSettings() {
  var settings = getSettingsIfSet();
  if (!settings) {
    console.warn('Target url or headers is not set.');
    throw new Error('Target url or headers is not set.');
  }
  return settings;
}

/**
 * Saves target url and headers to document properties.
 * @param {string} targetUrl -- target url to send data to
 * @param {string} headers -- headers to send with request
 * @param {Array<string>} sheets -- sheets to listen to
 */
function saveSettings(targetUrl, headers, sheets) {
  console.log('Saving settings with targetUrl: ' + targetUrl + ' and headers: ' + headers);
  PropertiesService.getDocumentProperties().setProperty('targetUrl', targetUrl);
  PropertiesService.getDocumentProperties().setProperty('headers', headers);
  PropertiesService.getDocumentProperties().setProperty('sheets', JSON.stringify(sheets));
  triggerRegistration();
  syncEntireSpreadsheet();
}

/**
 * Gets all sheet names and if they are selected.
 * @return {Array} array of objects with name and selected properties
 */
function getSheetsSelection() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  var selectedSheets = getSettingsIfSet()?.sheets ?? [];
  function getSheetAndSelection(sheet) {
    return {
      name: sheet.getName(),
      selected: selectedSheets.indexOf(sheet.getName()) !== -1
    };
  }
  var sheetsSelection = sheets.map(getSheetAndSelection);
  return sheetsSelection;
}