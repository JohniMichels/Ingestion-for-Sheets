function debugStart() {
  console.log('Debug start');
  createMenu()
  triggerRegistration();
  console.log('Debug end');
}


function sendDataToTargetUrl(dataRows) {
  let spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  let settings = getSettingsIfSet();
  if (!settings) {
    throw new Error('Settings should be set before sending data.');
  }
  let requestBody = {
    sheet: {
      id: spreadSheet.getId(),
      name: spreadSheet.getName(),
      owner: spreadSheet?.getOwner()?.getEmail()
    },
    changes: [
      ...dataRows
    ]
  }
  console.log('Sending data: ' + JSON.stringify(requestBody) + ' to ' + settings.targetUrl);
  var response = UrlFetchApp.fetch(
    settings.targetUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      headers: JSON.parse(settings.headers)
    });
  console.log('Response: ' + response.getContentText());
  return response;
}


/**
 * Stores data object in queue.
 * @param {Object} dataObject
  */
function storeDataObjectInQueue(dataObject) {
  let dataObjectRepresentation = JSON.stringify(dataObject);
  let queue = getQueue();
  queue.addJsonItem(dataObjectRepresentation);
  queue.commit();
}
