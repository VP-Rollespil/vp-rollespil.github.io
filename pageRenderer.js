import fs from "fs";
import ejs from "ejs";
import { XMLParser } from "fast-xml-parser";
import wiki2html from "./wikiToHtml.js";
const parser = new XMLParser();

function pageRenderer(page, data) {
	data = data || {};
	const pagePath = `./pages/${page}.xml`;
	if (!fs.existsSync(pagePath)) {
		return { success: false, error: "Page not found" };
	}

	const pageXML = fs.readFileSync(pagePath, "utf8");
	const pageObject = parser.parse(pageXML);
	if (!pageObject.text) return { success: false, error: "Page has no text" };
	if (!pageObject.title) return { success: false, error: "Page has no title" };
	let text = wiki2html(pageObject.text);

	const html = ejs.render(text, data);
	return { success: true, html };
}

export default pageRenderer;
