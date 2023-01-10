/**
 * Creates a trigger for sheets.
 * @param {function} callbackName - name of the callback function that will be called when the trigger is fired
 * @param {function} creatorCallback - function that sets the trigger type 
 * @return {string} trigger id
 * @see https://developers.google.com/apps-script/reference/script/trigger-builder
 */
function createTrigger(callbackName, creatorCallback) {
    return creatorCallback(
        ScriptApp.newTrigger(callbackName)
      )
      .create()
      .getUniqueId();
  }

/**
 * Gets trigger by id.
 * @param {string} triggerId
 * @return {GoogleAppsScript.Script.Trigger} trigger or null if not found
 * @see https://developers.google.com/apps-script/reference/script/trigger
*/
function getTrigger(triggerId) {
    return ScriptApp.getProjectTriggers().find(function (trigger) {
      return trigger.getUniqueId() === triggerId;
    });
  }

function registerTrigger(config) {
  let triggerId = PropertiesService.getDocumentProperties().getProperty(config.triggerProperty);
  let trigger = getTrigger(triggerId);
  if (!trigger) {
    if (triggerId) {
      console.warn("Trigger with id: " + triggerId + " registered but not found. Deleting property.");
      PropertiesService.getDocumentProperties().deleteProperty(config.triggerProperty);
    }
    console.log('Creating new trigger for ' + config.triggerCallbackName + '...');
    triggerId = createTrigger(config.triggerCallbackName, config.creatorCallback);
    PropertiesService.getDocumentProperties().setProperty(config.triggerProperty, triggerId);
    console.info('Trigger created with id: ' + triggerId);
  }
}


/**
 * Register triggers to document properties.
 * @see https://developers.google.com/apps-script/guides/properties
 */
function triggerRegistration() {
    const triggerConfigs = [
      // {
      //   triggerCallbackName: "onChangeTrigger", 
      //   creatorCallback: function (builder) {return builder.onChange();},
      //   triggerProperty: "changeTriggerId"
      // },
      {
        triggerCallbackName: "onOpen",
        creatorCallback: function (builder) {return builder.forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onOpen();},
        triggerProperty: "openTriggerId"
      },
      {
        triggerCallbackName: "onEditTrigger",
        creatorCallback: function (builder) {return builder.forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit();},
        triggerProperty: "editTriggerId"
      },
      {
        triggerCallbackName: "sendAllData",
        creatorCallback: function (builder) {return builder.timeBased().everyHours(1);},
        triggerProperty: "everyHourTriggerId"
      },
      {
        triggerCallbackName: "syncEntireSpreadsheet",
        creatorCallback: function (builder) {return builder.timeBased().everyDays(1);},
        triggerProperty: "everyDayTriggerId"
      }
    ]
  
    triggerConfigs.forEach(registerTrigger);
  }

/**
 * Creates menu.
 * @see https://developers.google.com/apps-script/reference/base/ui
*/
function onOpen(e) {
    createMenu();
}

/**
 * Install add-on.
 */
function onInstall() {
  createMenu();
}

function sendAllData() {
    console.log('sendAllData called');
    let processList = ProcessingQueueService.clearAllQueues(sendDataToTargetUrl);
  }

function syncEntireSpreadsheet() {
    console.log('syncEntireSpreadsheet called');
    let sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    let settings = getSettingsIfSet();
    sheets.filter(function (sheet) {
      return settings.sheets.includes(sheet.getName());
    }).forEach(function (sheet) {
      let range = sheet.getDataRange();
      let dataObject = {
        user: 'system',
        timestamp: new Date(),
        tab: sheet.getName(),
        values: range.getValues(),
        row: range.getRow(),
        column: range.getColumn()
      };
      let dataObjectJson = JSON.stringify(dataObject);
      let processList = ProcessingQueueService.getAvailableProcessingQueue();
      processList.addJsonItem(dataObjectJson);
      processList.commit(sendDataToTargetUrl);
    });
  }

/**
 * Triggered when a sheet is edit.
 * @param {GoogleAppsScript.Events.SheetsOnChange} e
 * @see https://developers.google.com/apps-script/guides/triggers/events#google_sheets_events
  */
function onEditTrigger(e) {
    console.log('onEditTrigger called with ' + JSON.stringify(e));
    var settings = getSettingsIfSet();
    /* if settings are not set or edited sheet is not on sheets settings */
    if (!settings || settings.sheets.indexOf(e.range.getSheet().getName()) === -1) {
      console.log('Settings not set or edited sheet is not on sheets settings. Exiting.');
      return;
    }
    /* create data object */
    let dataObject = {
      user: e.user.getEmail(),
      timestamp: new Date(),
      tab: e.range.getSheet().getName(),
      values: e.range.getValues(),
      row: e.range.getRow(),
      column: e.range.getColumn()
    };
    let dataObjectJson = JSON.stringify(dataObject);
    let processList = ProcessingQueueService.getAvailableProcessingQueue();
    processList.addJsonItem(dataObjectJson);
    processList.commit(sendDataToTargetUrl);
    // console.log('Queued [' + processList.index + ']: ' + dataObjectJson);
  }
