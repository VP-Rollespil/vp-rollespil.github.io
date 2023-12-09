import fs from "fs";
import ejs from "ejs";
import { XMLParser } from "fast-xml-parser";
import wiki2html from "./wikiToHtml.js";
const parser = new XMLParser();

async function pageRenderer(page, data = {}) {
	const pagePath = `./pages/${page}.xml`;
	if (!fs.existsSync(pagePath)) {
		return { success: false, error: "Page not found" };
	}

	const pageText = fs.readFileSync(pagePath).toString();
	const pageObject = parser.parse(pageText);
	if (!pageObject.text) return { success: false, error: "Page has no text" };
	let text = wiki2html(pageObject.text);

	const html = await ejs.renderFile("./views/page.ejs", {
		page: { ...pageObject, text },
		...data,
	});
	return { success: true, html };
}

let pageCounter = 0;
function getPages(dir) {
	let allPages = [];
	const pages = fs.readdirSync(`./pages/${dir}`);
	let promises = [];
	for (const element of pages) {
		if (element.endsWith(".xml")) {
			allPages.push(`./pages/${dir}${element}`);
		} else if (fs.lstatSync(`./pages/${dir}${element}`).isDirectory()) {
			allPages.push(...getPages(`${dir}${element}/`));
		} else {
			console.log(`Unknown element ${element}`);
		}
	}
	return allPages;
}
export default pageRenderer;
export { pageRenderer, getPages };
