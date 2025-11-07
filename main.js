const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN');
const LINE_URL = 'https://api.line.me/v2/bot/message/reply';
const SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEET_URL');

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const data = json.events[0];
  const userId = data.source.userId;
  const message = createReplyMessage(userId, data.message.text);

  const option = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': data.replyToken,
      'messages': [{
        "type": "text",
        "text": message
      }],
    }),
  };
  UrlFetchApp.fetch(LINE_URL, option);
}

function createReplyMessage(userId, receivedMessage) {
  const mode = getUserMode(userId);
  showLoading(userId, 15)
  if (receivedMessage === '記入モード') {
    setUserMode(userId, 'waiting_input');
    return '記録モードに入りました。次のメッセージを記録します。';
  }
  else if (receivedMessage === '削除モード') {
    setUserMode(userId, 'waiting_delete');
    return '削除モードに入りました。削除したい番号を送ってください。削除をやめる場合は0を入力してください';
  }
  else if (receivedMessage === 'URL') {
    return readSheat(0);
  }
  else if (receivedMessage === 'メモ') {
    return readSheat(1);
  }
  else if (mode === 'waiting_input') {
    recordToSheat(receivedMessage, 1);
    clearUserMode(userId);
    return 'メモを記録しました。';
  }
  else if (mode === 'waiting_delete') {
  const deleteIndex = Number(receivedMessage);
  // 0 → 何もせず削除モード解除
  if (deleteIndex === 0) {
    clearUserMode(userId);
    return '削除をキャンセルしました。';
  }
  // 数字でない → モード継続
  if (!Number.isInteger(deleteIndex)) {
    return '数字で削除したい番号を送ってください。（0でキャンセル）';
  }
  // 削除実行
  const result = deleteFromSheat(1, deleteIndex);
  // deleteFromSheat() が「無効な番号」ならモード継続
  if (result === '無効な番号です。') {
    return '無効な番号です。再度番号を送ってください。（0でキャンセル）';
  }
  // 正常削除 → モード解除
  clearUserMode(userId);
  return result;
  }
  else {
    return "";
  }
}

function recordToSheat(word, type) {
  const spreadSheet = SpreadsheetApp.openByUrl(SHEET_URL);
  const theSheet = spreadSheet.getSheets()[type];
  const lastRow = theSheet.getLastRow();
  theSheet.getRange(lastRow + 1, 1).setValue(word);
}

function readSheat(type) {
  const spreadSheet = SpreadsheetApp.openByUrl(SHEET_URL);
  const theSheet = spreadSheet.getSheets()[type];
  const dataRanges = theSheet.getDataRange();
  const datas = dataRanges.getValues();

  const dataString = datas.map((row, i) => `${i + 1}. ${row.join(' ')}`).join('\n');
  return dataString || 'データが存在しません。';
}

function deleteFromSheat(type, index) {
  const spreadSheet = SpreadsheetApp.openByUrl(SHEET_URL);
  const theSheet = spreadSheet.getSheets()[type];
  const lastRow = theSheet.getLastRow();

  if (index < 1 || index > lastRow) {
    return '無効な番号です。';
  }

  theSheet.deleteRow(index);
  return `メモ ${index} を削除しました。`;
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
