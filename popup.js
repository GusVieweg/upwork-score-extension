document.body.onload = function () {
  chrome.storage.sync.get("config", function (items) {
    if (!chrome.runtime.error) {
      //   console.log(items);
      document.getElementById("proposal-count").value = items.config.proposal;
      document.getElementById("interview-count").value = items.config.interview;
      document.getElementById("hired-count").value = items.config.hired;
      document.getElementById("last-viewed-count").value =
        items.config.lastViewed;
      document.getElementById("connects-count").value = items.config.connects;
    }
  });
};

document.getElementById("update-preferences").onclick = function () {
  var proposal = document.getElementById("proposal-count").value;
  var interview = document.getElementById("interview-count").value;
  var hired = document.getElementById("hired-count").value;
  var lastViewed = document.getElementById("last-viewed-count").value;
  var connects = document.getElementById("connects-count").value;
  chrome.storage.sync.set(
    {
      config: {
        proposal: proposal,
        interview: interview,
        hired: hired,
        lastViewed: lastViewed,
        connects: connects,
      },
    },
    function () {
      if (chrome.runtime.error) {
        console.log("Runtime error.");
      }
    }
  );
  window.close();
};
