function showLoading(userId, seconds) {
  const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN');
  const url = 'https://api.line.me/v2/bot/chat/loading/start';
  const payload = JSON.stringify({
    chatId: userId,
    loadingSeconds: seconds
  });
  const option = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN
    },
    'method': 'post',
    'payload': payload
  };
  UrlFetchApp.fetch(url, option);
}

function getMemoSheetName(userId) {
  return `${userId}_MEMO`;
}

function getUrlSheetName(userId) {
  return `${userId}_URL`;
}

function getOrCreateSheet(name) {
  const sheet = SpreadsheetApp.openByUrl(SHEET_URL);
  let theSheet = sheet.getSheetByName(name);
  if (!theSheet) {
    theSheet = sheet.insertSheet(name);
  }
  return theSheet;
}

function setUserMode(userId, mode) {
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty(userId, mode);
}

function getUserMode(userId) {
  const userProps = PropertiesService.getUserProperties();
  return userProps.getProperty(userId) || 'idle';
}

function clearUserMode(userId) {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty(userId);
}
