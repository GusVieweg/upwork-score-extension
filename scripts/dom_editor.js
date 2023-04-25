function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

async function calculateRanking(job) {
  let bads = 0;
  let warnings = [];
  let popup = await chrome.storage.sync.get("config");
  if (!chrome.runtime.error) {
    let { connects, hired, interview, lastViewed, proposal } = popup.config;
    if (job.connects > parseInt(connects)) {
      bads++;
      warnings.push("Too many connects");
    }
    if ("hired" in job && job.hired > parseInt(hired)) {
      bads = 5;
      warnings.push("Job hired already");
      return;
    }
    if (job.interviewing > parseInt(interview)) {
      bads++;
      warnings.push("Too many interviewees");
    }
    if (job.lastViewed > parseInt(lastViewed)) {
      bads++;
      warnings.push("Unresponsive client");
    }
    if (job.proposals > parseInt(proposal)) {
      bads++;
      warnings.push("Too many proposals");
    }
  }
  if (bads == 0) {
    return { ranking: "good", warnings: ["No worries! 😊"] };
  }
  if (bads < 2) {
    return { ranking: "good", warnings: warnings };
  } else if (bads < 4) {
    return { ranking: "mid", warnings: warnings };
  }
  return { ranking: "bad", warnings: warnings };
}

function createTooltipModal(j, warnings) {
  let warningsList = "";
  warnings.forEach(w => {
    warningsList += `<li>${w}</li>`;
  });

  return htmlToElement(
    `
        <div
          id="info-${j.href}"
          style="
            display: none;
            width: 130px;
            position: relative;
            background: white;
            border: 2px solid green;
            border-radius: 5px;
            padding-left: 5px;
            margin-right: -130px;
            top: 50px;
            margin-bottom: -40px;
            font-family: Helvetica;
            z-index: 1000;
          "
        >
          <ul 
            style="padding-left: 0;
            text-align: center;
            padding-top: 10px;
            list-style-type: none;"
          >
            ${warningsList}
          </ul>
        </div>
        `
  );
}

function createTooltipTrigger(j, ranking) {
  let rankings = {
    good: {
      rotate: 0,
      color: "green",
      mb: 0,
    },
    mid: {
      rotate: 90,
      color: "#debe1a",
      mb: 0,
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
    <svg
      xmlns:xlink="http://www.w3.org/1999/xlink"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0.0 0.0 384.0 384.0"
      fill="none"
      stroke="none"
      stroke-linecap="square"
      stroke-miterlimit="10"
    >
      <clipPath id="g1d3091c8d0f_0_0.0">
        <path d="m0 0l384.0 0l0 384.0l-384.0 0l0 -384.0z" clip-rule="nonzero"/>
      </clipPath>
      <g clip-path="url(#g1d3091c8d0f_0_0.0)">
        <path fill="#000000" fill-opacity="0.0" d="m0 0l384.0 0l0 384.0l-384.0 0z" fill-rule="evenodd"/><path fill="#000000" d="m0 358.07874l192.0 -332.15747l192.0 332.15747z" fill-rule="evenodd"/><path stroke="#000000" stroke-width="1.0" stroke-linejoin="round" stroke-linecap="butt" d="m0 358.07874l192.0 -332.15747l192.0 332.15747z" fill-rule="evenodd"/>
      </g>
    </svg>
  </div>
  `;
  return htmlToElement(
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
}

async function parseJobs() {
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
          uprank.proposals = parseInt(content.split(" ").at(-1));
        }
        if (content.startsWith("Last")) {
          let lvb = content.split(".").at(-1).trim();
          if (lvb.includes("days")) {
            uprank.last_viewed_by = parseInt(content.split(".").at(-1).trim());
          } else {
            uprank.last_viewed_by = 0;
          }
        }
        if (content.startsWith("Interviewing")) {
          uprank.interviewing = parseInt(content.split(" ").at(-1));
        }
        if (content.startsWith("Hired")) {
          uprank.hired = parseInt(content.split(" ").at(-1));
        }
      });

      uprank.connects = parseInt(
        detailsPage
          .querySelector("div.d-lg-none.mt-10")
          .innerText.trim()
          .replace(/(\r\n|\n|\r)/gm, "")
          .match(/^\d+|\d+\b|\d+(?=\w)/g)[0]
      );

      let result = await calculateRanking(uprank);
      let ranking = result.ranking;
      let warnings = result.warnings;

      let clickables = j.parentNode.parentNode.parentNode;
      let actionTiles = clickables.querySelector(".job-tile-actions");
      actionTiles.prepend(createTooltipTrigger(j, ranking));
      actionTiles.prepend(createTooltipModal(j, warnings));

      let modal = document.getElementById(`info-${j.href}`);
      modal.style.marginBottom = -45 * warnings.length + "px";
    });
  }
}

window.onload = parseJobs();
document.addEventListener("scroll", parseJobs);
