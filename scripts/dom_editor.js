function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function parseJobs() {
  const jobs = document.querySelectorAll(
    "h3.job-tile-title > a:not(.uprank-parsed)"
  );

  if (jobs) {
    let parser = new DOMParser();

    jobs.forEach(async j => {
      j.classList.add("uprank-parsed");
      let detailsPage = await fetch(j.href);
      detailsPage = await detailsPage.text();

      detailsPage = parser.parseFromString(detailsPage, "text/html");

      let uprank = {};
      let client_activity = detailsPage
        .querySelector("section.up-card-section.row")
        .querySelectorAll("li");
      client_activity.forEach(ca => {
        let content = ca.innerText.trim();
        if (content.startsWith("Proposals")) {
          uprank.proposals = content.split(" ").at(-1);
        }
        if (content.startsWith("Last")) {
          let lvb = content.split(".").at(-1).trim();
          if (lvb.includes("days")) {
            uprank.last_viewed_by = content.split(".").at(-1).trim();
          } else {
            uprank.last_viewed_by = 0;
          }
        }
        if (content.startsWith("Interviewing")) {
          uprank.interviewing = content.split(" ").at(-1);
        }
        if (content.startsWith("Hired")) {
          uprank.hired = content.split(" ").at(-1);
        }
      });

      uprank.connect_info = detailsPage
        .querySelector("div.d-lg-none.mt-10")
        .innerText.trim()
        .replace(/(\r\n|\n|\r)/gm, "")
        .match(/^\d+|\d+\b|\d+(?=\w)/g)[0];

      let hover = htmlToElement(
        `
        <div
          id="info-${j.href}"
          style="
            display: none;
            width: 200px;
            position: relative;
            background: white;
            border: 2px solid var(--border-base-color);
            height: 200px;
            margin-right: -120px;
            margin-top: -205px;
          "
        >
          <ul>
            <li>Proposals: ${uprank.proposals}</li>
            <li>Last Viewed By: ${uprank.last_viewed_by}</li>
            <li>Interviewing: ${uprank.interviewing}</li>
            <li>Connect Cost: ${uprank.connect_info}</li>
            <li>Hired: ${"hired" in uprank ? uprank.hired : 0}</li>
          </ul>
        </div>
        `
      );
      let ranking = "medium";
      let rankings = {
        good: {
          rotate: 180,
          color: "green",
          mb: 3,
        },
        medium: {
          rotate: 90,
          color: "#debe1a",
          mb: 3,
        },
        bad: {
          rotate: 0,
          color: "#9b211b",
          mb: 0,
        },
      };
      let upworkAlertIcon = `
      <div class="up-icon" style="
        rotate: ${rankings[ranking].rotate}deg;
        color: ${rankings[ranking].color};
        margin-bottom: ${rankings[ranking].mb}px"
      >
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 14 14" role="img">
          <path fill-rule="evenodd" d="M3.237 1.368h5.896v5.375c0 .185-.097.552-.2.757l-2.564 2.802c-.205.22-.317.508-.317.81v1.35c-.35-.274-.946-1.057-.215-2.974a1.2 1.2 0 00-1.115-1.624H1.54l1.697-6.496zM.15 8.948c.142.183.36.284.614.284H4.48c-1.194 3.422.965 4.492 1.22 4.605a1.946 1.946 0 001.629-.033.177.177 0 00.09-.152l.002-2.475s2.577-2.79 2.587-2.79h3.78c.116 0 .21-.078.21-.172V.172c0-.094-.095-.17-.21-.17L3.085 0C2.59 0 2.08.404 1.947.903L.032 8.243a.805.805 0 00.12.706z"></path>
        </svg>
      </div>
      `;
      let trigger = htmlToElement(
        `
        <div
          class="d-inline-block mr-5"
          onmouseover="document.getElementById('info-${j.href}').style.display = 'block';"
          onmouseout="document.getElementById('info-${j.href}').style.display = 'none';"
        >
          <span>
            <span>
              <button class="up-btn up-btn-default up-popper-trigger up-btn-circle">
                ${upworkAlertIcon}
              </button>
            </span>
          </span>
        </div>`
      );

      let clickables = j.parentNode.parentNode.parentNode;
      let actionTiles = clickables.querySelector(".job-tile-actions");
      actionTiles.prepend(trigger);
      actionTiles.prepend(hover);
    });
  }
}

window.onload = parseJobs();
document.addEventListener("scroll", parseJobs);
