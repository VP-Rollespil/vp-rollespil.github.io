import pageRenderer from "./pageRenderer.js";
import fs from "fs";
import ejs from "ejs";

const start = performance.now();
fs.rmSync("./build", { recursive: true, force: true });
fs.mkdirSync("./build");
fs.mkdirSync("./build/wiki");

let pageCounter = 0;
function buildDir(dir) {
	const pages = fs.readdirSync(`./pages/${dir}`);
	console.log(pages);
	for (const element of pages) {
		if (element.endsWith(".xml")) {
			buildPage(dir, element, "./build");
		} else if (fs.lstatSync(`./pages/${element}`).isDirectory()) {
			fs.mkdirSync(`./build/wiki/${dir}${element}`);
			buildDir(`${dir}${element}/`);
		} else {
			console.log(`Unknown element ${element}`);
		}
	}
}
function buildPage(dir, page, location) {
	const pageName = page.replace(".xml", "");
	const result = pageRenderer(`${dir}${pageName}`);
	if (!result.success) {
		console.log(`Failed to render ${pageName}: ${result.error}`);
	} else {
		fs.writeFileSync(`./build/wiki/${dir}${pageName}.html`, result.html);
		pageCounter++;
	}
}

buildDir("");

//copy index.html
let index = ejs.render(fs.readFileSync("./views/index.ejs", "utf8"));
fs.writeFileSync("./build/index.html", index);

const end = performance.now();
const time = end - start;
console.log(`Rendered ${pageCounter} pages in ${time}ms`);
