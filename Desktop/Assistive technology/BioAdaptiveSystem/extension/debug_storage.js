// Check storage state
chrome.storage.local.get(null, (res) => {
    console.log("Current Storage State:", JSON.stringify(res, null, 2));
});
