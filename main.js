// grab url from text link
let a = await fetch(
  "https://www.upwork.com/jobs/Write-script-automate-process-illustrator_~014b1cb4a0f51bf956/"
);
let b = await a.text();

let parser = new DOMParser();
let doc = parser.parseFromString(b, "text/html");

let c = doc.getElementById("last-viewed");
let cp = c.parentNode;
console.log(cp.lastChild.innerText);
