document.body.onload = function () {
  chrome.storage.sync.get("config", function (items) {
    console.log(items);
    if (!chrome.runtime.error) {
      console.log(items);
      document.getElementById("proposal-count").innerText =
        items.config.proposal;
      document.getElementById("interview-count").innerText =
        items.config.interview;
      document.getElementById("hired-count").innerText = items.config.hired;
      document.getElementById("last-viewed-count").innerText =
        items.config.lastViewed;
      document.getElementById("connects-count").innerText =
        items.config.connects;
    }
  });
};

document.getElementById("update-preferences").onclick = function () {
  var proposal = document.getElementById("proposal-count").value;
  var interview = document.getElementById("interview-count").value;
  var hired = document.getElementById("hired-count").value;
  var lastViewed = document.getElementById("last-viewed-count").value;
  var connects = document.getElementById("connects-count").value;
  localStorage.setItem("donut", "hole");
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
  console.log(proposal, interview, hired, lastViewed, connects);
  window.close();
};
