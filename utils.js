export function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message,
    priority: 1
  }, function(notificationId) {
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 3000);
  });
}

export function getStoredKeys(ids) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(ids, (items) => {
        resolve(items);
    });
  });
}
