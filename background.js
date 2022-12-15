chrome.runtime.onInstalled.addListener(function() {
  console.log('progress...');
});

chrome.webNavigation.onDOMContentLoaded.addListener(async function(details) {
  const tabId = details.tabId;
  chrome.storage.local.get('enableTabIds', ({enableTabIds = []}) => {
    const isEnable = enableTabIds.filter((v) => v === tabId).length > 0;
    if (isEnable) {
      chrome.scripting.executeScript({
        target: { tabId },
        function: start
      });
    }
  });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.key === 'enable-tab-id') {
    // 有効化
    const tabId = message.value;
    chrome.storage.local.get('enableTabIds', async ({enableTabIds = []}) => {
      if (enableTabIds.includes(tabId)) { return sendResponse(false); }
      enableTabIds.push(tabId);
      await chrome.storage.local.set({ 'enableTabIds': enableTabIds });
      // 開始
      chrome.scripting.executeScript({
        target: { tabId },
        function: start
      });
    });
    return sendResponse(true);
  } else if (message.key === 'disable-tab-id') {
    // 無効化
    const tabId = message.value;
    chrome.storage.local.get('enableTabIds', async ({enableTabIds = []}) => {
      if (!enableTabIds.includes(tabId)) { return sendResponse(false); }
      enableTabIds = enableTabIds.filter((v) => v !== tabId)
      await chrome.storage.local.set({ 'enableTabIds': enableTabIds });
      // 停止
      chrome.scripting.executeScript({
        target: { tabId },
        function: stop
      });
    });
    return sendResponse(true);
  }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  // このタブ以外にも存在しないタブIDがあれば削除する
  chrome.storage.local.get('enableTabIds', async ({enableTabIds = []}) => {
    const aliveTabIds = (await chrome.tabs.query({})).map((v) => v.id);
    enableTabIds = enableTabIds.filter((v) => aliveTabIds.includes(v))
    await chrome.storage.local.set({ 'enableTabIds': enableTabIds });
  });
});

function start() {
  // DOM作成
  const $timer = document.querySelector(`#modal-timer-container`);
  if (!$timer) {
    // 大枠
    const $el = document.createElement('div');
    $el.id = 'modal-timer-container';
    $el.style.position = 'fixed';
    $el.style.top = '1px';
    $el.style.right = '1px';
    $el.style.zIndex = '10000000';
    $el.style.color = '#ecf0f1';
    $el.style.backgroundColor = '#2c3e50';
    $el.style.border = '1px solid #34495e';
    $el.style.borderRadius = '5px';
    $el.style.padding = '0.1em 0.5em';
    $el.style.fontSize = '15px';
    $el.style.fontFamily = 'monospace';
    $el.style.cursor = 'default';
    $el.style.opacity = 1;
    $el.style.transition = 'opacity 0.3s ease-in-out';
    $el.setAttribute('onmouseover', 'this.style.opacity=0.1');
    $el.setAttribute('onmouseout', 'this.style.opacity=1');

    // 数値出力部分
    var $elText = document.createElement('output');
    $elText.id = 'modal-timer-container-text';
    $elText.innerText = '0';
    $el.appendChild($elText);

    // タイマーID部分
    const $intervalId = document.createElement('input');
    $intervalId.setAttribute('id', 'modal-timer-container-interval-id');
    $intervalId.setAttribute('type', 'hidden');
    $el.appendChild($intervalId);

    // 要素を画面に出す
    document.body.appendChild($el);

    // タイマー開始
    const intervalId = setInterval(() => {
      const $timerText = document.querySelector(`#modal-timer-container-text`);
      if ($timerText) {
        $timerText.innerText = Number($timerText.innerText) + 1;
      }
    }, 1000);
    $intervalId.value = intervalId;
  }
}

function stop() {
  // タイマー要素を取得
  const $timer = document.querySelector(`#modal-timer-container`);
  const $intervalId = document.querySelector(`#modal-timer-container-interval-id`);
  if (!$timer || !$intervalId) return;
  // タイマーを停止
  const intervalId = Number($intervalId.value);
  if (intervalId) {
    clearInterval(intervalId);
  }
  // タイマーのDOMを削除
  $timer.remove();
}
