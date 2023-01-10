/**
 * Creates add-on menu gui with a target url and headers fields.
 * @see https://developers.google.com/apps-script/guides/menus
 */
function createMenu() {
    var ui = SpreadsheetApp.getUi();
    ui.createAddonMenu()
      .addItem('Open Settings', 'showSettingsSidebar')
      .addItem('Show Processing Queues', 'showQueues')
      .addToUi();
  }
  
/**
 * Shows sidebar with target url and headers fields.
 * @see https://developers.google.com/apps-script/guides/html/
 */
function showSettingsSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Sheet Ingestion - Settings')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Shows a sidebar with current queues.
 * @see https://developers.google.com/apps-script/guides/html/
 * @see https://developers.google.com/apps-script/reference/base/user-interface
 * @see https://developers.google.com/apps-script/reference/base/user-interface#showSidebar(HtmlOutput)  
 */
function showQueues() {
  var html = HtmlService.createHtmlOutputFromFile('queues')
    .setTitle('Sheet Ingestion - Queues')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}