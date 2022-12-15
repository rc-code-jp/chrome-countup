document.querySelector('#buttonOn').addEventListener('click', async function() {
  const tab = await getCurrentTab();
  chrome.runtime.sendMessage({key: 'enable-tab-id', value: tab.id});
});

document.querySelector('#buttonOff').addEventListener('click', async function() {
  const tab = await getCurrentTab();
  chrome.runtime.sendMessage({key: 'disable-tab-id', value: tab.id});
});

const getCurrentTab = async function() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
