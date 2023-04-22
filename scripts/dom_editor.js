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

    jobs.forEach(async (j) => {
      j.classList.add("uprank-parsed");
      let detailsPage = await fetch(j.href);
      detailsPage = await detailsPage.text();

      detailsPage = parser.parseFromString(detailsPage, "text/html");

      let uprank = {};
      let client_activity = detailsPage
        .querySelector("section.up-card-section.row")
        .querySelectorAll("li");
      client_activity.forEach((ca) => {
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
        if (content.startsWith("Hires")) {
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
            border: 2px solid green;
            border-radius: 5px;
            padding-left: 5px;
            padding-top: 10px;
            height: 175px;
            margin-right: -120px;
            margin-top: -205px;
            font-family: "Helvetica";
            z-index: 19000;
          "
        >
          <ul>
            <li>Days Since Viewed: ${uprank.last_viewed_by}</li>  
            <li>Proposals: ${uprank.proposals}</li>
            <li>Interviewing: ${uprank.interviewing}</li>
            <li>Hired: ${"hired" in uprank ? uprank.hired : 0}</li>
            <li>Connect Cost: ${uprank.connect_info}</li>
          </ul>
        </div>
        `
      );
      let ranking = "good";
      let rankings = {
        good: {
          rotate: 0,
          color: "green",
          mb: 3,
        },
        medium: {
          rotate: 90,
          color: "#debe1a",
          mb: 3,
        },
        bad: {
          rotate: 180,
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
<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0.0 0.0 384.0 384.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10"><clipPath id="g1d3091c8d0f_0_0.0"><path d="m0 0l384.0 0l0 384.0l-384.0 0l0 -384.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#g1d3091c8d0f_0_0.0)"><path fill="#000000" fill-opacity="0.0" d="m0 0l384.0 0l0 384.0l-384.0 0z" fill-rule="evenodd"/><path fill="#000000" d="m0 358.07874l192.0 -332.15747l192.0 332.15747z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m0 358.07874l192.0 -332.15747l192.0 332.15747z" fill-rule="evenodd"/></g></svg>      </div>
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
