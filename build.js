import pageRenderer from "./pageRenderer.js";
import fs from "fs";
import ejs from "ejs";

const start = performance.now();
fs.rmSync("./build", { recursive: true, force: true });
fs.mkdirSync("./build");
fs.mkdirSync("./build/wiki");

let pageCounter = 0;
async function buildDir(dir) {
	const pages = fs.readdirSync(`./pages/${dir}`);
	let promises = [];
	for (const element of pages) {
		if (element.endsWith(".wiki")) {
			promises.push(buildPage(dir, element, "./build"));
		} else if (fs.lstatSync(`./pages/${dir}${element}`).isDirectory()) {
			if (element.startsWith("NOBUILD")) continue;
			fs.mkdirSync(`./build/wiki/${dir}${element}`);
			buildDir(`${dir}${element}/`);
		} else {
			console.log(`Unknown element ${element}`);
		}
	}
	await Promise.all(promises);
	return;
}
async function buildPage(dir, page, location) {
	const pageName = page.replace(".wiki", "");
	const result = await pageRenderer(pageName);
	if (!result.success) {
		console.log(`Failed to render ${pageName}: ${result.error}`);
	} else {
		fs.writeFileSync(`./build/wiki/${pageName}.html`, result.html);
		pageCounter++;
	}
}

await buildDir("");

//write offgame pages
{
	let result = await pageRenderer("forside", {}, false);
	if (!result.success) {
		console.log(`Failed to render index: ${result.error}`);
	} else {
		fs.writeFileSync(`./build/index.html`, result.text);
	}
	result = await pageRenderer("regler", {}, false);
	if (!result.success) {
		console.log(`Failed to render regler: ${result.error}`);
	} else {
		fs.writeFileSync(`./build/regler.html`, result.text);
	}
}

// copy static files
let staticFiles = fs.readdirSync("./public");
fs.mkdirSync("./build/public");
for (const file of staticFiles) {
	fs.copyFileSync(`./public/${file}`, `./build/public/${file}`);
}

const end = performance.now();
const time = end - start;
console.log(`Rendered ${pageCounter} pages in ${time}ms`);
