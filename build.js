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
	console.log(pages);
	let promises = [];
	for (const element of pages) {
		if (element.endsWith(".xml")) {
			promises.push(buildPage(dir, element, "./build"));
		} else if (fs.lstatSync(`./pages/${dir}${element}`).isDirectory()) {
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
	const pageName = page.replace(".xml", "");
	const result = await pageRenderer(`${dir}${pageName}`);
	if (!result.success) {
		console.log(`Failed to render ${pageName}: ${result.error}`);
	} else {
		fs.writeFileSync(`./build/wiki/${dir}${pageName}.html`, result.html);
		pageCounter++;
	}
}

await buildDir("");

//copy index.html
let index = ejs.render(fs.readFileSync("./views/index.ejs", "utf8"));
fs.writeFileSync("./build/index.html", index);

// copy static files
let staticFiles = fs.readdirSync("./public");
fs.mkdirSync("./build/public");
for (const file of staticFiles) {
	fs.copyFileSync(`./public/${file}`, `./build/public/${file}`);
}

const end = performance.now();
const time = end - start;
console.log(`Rendered ${pageCounter} pages in ${time}ms`);
