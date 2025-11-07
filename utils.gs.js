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