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

export default pageRenderer;
