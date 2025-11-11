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
  showLoading(userId, 15);
  // INPUT / DELETE のモード判定を優先
  if (mode === 'waiting_memo_input') {
    recordToSheat(receivedMessage, getMemoSheetName(userId));
    clearUserMode(userId);
    return 'メモを記録しました。';
  }
  if (mode === 'waiting_url_input') {
    recordToSheat(receivedMessage, getUrlSheetName(userId));
    clearUserMode(userId);
    return 'URLを記録しました。';
  }
  if (mode === 'waiting_memo_delete') {
    return handleDelete(userId, receivedMessage, getMemoSheetName(userId));
  }
  if (mode === 'waiting_url_delete') {
    return handleDelete(userId, receivedMessage, getUrlSheetName(userId));
  }

  // コマンド
  if (receivedMessage === 'メモ') {
    return readSheat(getMemoSheetName(userId));
  }
  if (receivedMessage === 'メモ記録モード') {
    setUserMode(userId, 'waiting_memo_input');
    return 'メモ記録モードに入りました。次のメッセージを記録します。';
  }
  if (receivedMessage === 'メモ削除モード') {
    setUserMode(userId, 'waiting_memo_delete');
    return '削除したい番号を送ってください。（0でキャンセル）';
  }
  if (receivedMessage === 'URL') {
    return readSheat(getUrlSheetName(userId));
  }
  if (receivedMessage === 'URL記録モード') {
    setUserMode(userId, 'waiting_url_input');
    return 'URL記録モードに入りました。次のメッセージを記録します。';
  }
  if (receivedMessage === 'URL削除モード') {
    setUserMode(userId, 'waiting_url_delete');
    return '削除したい番号を送ってください。（0でキャンセル）';
  }
  return "☺️";
}

function readSheat(name) {
  const theSheet = getOrCreateSheet(name)
  const dataRanges = theSheet.getDataRange();
  const datas = dataRanges.getValues();
  // 空行を除外
  const filtered = datas.filter(row => row.join('').trim() !== '');
  if (filtered.length === 0) {
    return 'データが存在しません。';
  }
  const dataString = filtered.map((row, i) => `${i + 1}. ${row.join(' ')}`).join('\n');
  return dataString;
}

function recordToSheat(word, name) {
  const theSheet = getOrCreateSheet(name)
  const lastRow = theSheet.getLastRow();
  theSheet.getRange(lastRow + 1, 1).setValue(word);
}

function handleDelete(userId, receivedMessage, sheetName) {
  const deleteIndex = Number(receivedMessage);
  if (deleteIndex === 0) {
    clearUserMode(userId);
    return '削除をキャンセルしました。';
  }
  if (!Number.isInteger(deleteIndex)) {
    return '数字で削除したい番号を送ってください。（0でキャンセル）';
  }
  const result = deleteFromSheat(sheetName, deleteIndex);
  if (result === '無効な番号です。') {
    return '無効な番号です。再度番号を送ってください。（0でキャンセル）';
  }
  clearUserMode(userId);
  return result;
}

function deleteFromSheat(name, index) {
  const theSheet = getOrCreateSheet(name)
  const lastRow = theSheet.getLastRow();

  if (index < 1 || index > lastRow) {
    return '無効な番号です。';
  }

  theSheet.deleteRow(index);
  return `番号 ${index} を削除しました。`;
}

