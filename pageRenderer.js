import fs from "fs";
import ejs from "ejs";
import wiki2html from "./wikiToHtml.js";

let pages = getPageMap();

/**
 * Renders a page with the given data.
 * @param {string} page - The name of the page to render.
 * @param {Object} [data={}] - Additional data to pass to the page template.
 * @param {boolean} [render=true] - Whether to render the page to HTML or return the page object.
 * @returns {Promise<{success: boolean, html: string}|{success: boolean, error: string}|{success: boolean, text: string, page: Object}>} - The result of the rendering.
 * @async
 */
async function pageRenderer(page, data = {}, render = true) {
	const pagePath = pages.get(page);
	if (!fs.existsSync(pagePath)) {
		return { success: false, error: "Page not found" };
	}

	let rawText = fs.readFileSync(pagePath).toString();
	let pageObject = parser(rawText);

	if (!pageObject.text) return { success: false, error: "Page has no text" };
	let text = wiki2html(pageObject.text);
	if (render) {
		const html = await ejs.renderFile("./views/page.ejs", {
			page: { ...pageObject, text },
			...data,
		});
		return { success: true, html };
	} else {
		return { success: true, text: text, page: pageObject };
	}
}

function bookRenderer(bookPath, data = {}) {
	if (!fs.existsSync(bookPath)) {
		return { success: false, error: "Page not found" };
	}

	let rawText = fs.readFileSync(bookPath).toString();
	let bookObject = parser(rawText);

	bookObject.text = bookObject.text.replace(/{{(.*?)}}/g, (match, p1) => {
		if (p1 == "pagebreak") return "<span class='pagebreak'></div>";
		return match;
	});

	if (!bookObject.text) return { success: false, error: "Page has no text" };
	let text = wiki2html(bookObject.text);

	return { success: true, text: text, bookObject: bookObject };
}

function parser(pageText) {
	let pageObject = {};
	//find wikitext variables
	pageText = pageText.replace(/{{(.*?)}}/g, (match, p1) => {
		if (!p1.includes(":")) return match;
		const variable = p1.split(":")[0];
		const value = p1.split(":")[1];
		pageObject[variable] = value;
		return "";
	});

	return { ...pageObject, text: pageText };
}

/**
 * Retrieves a map of page names to page locations.
 * @returns {Map<string, string>} - The map of page names to page locations.
 */
function getPageMap() {
	let allPages = getPageLocations("");

	let pages = new Map();

	for (const page of allPages) {
		const fileName = page.split("/").pop();
		const pageName = fileName.replace(".wiki", "");
		if (pages.has(pageName)) {
			console.log(`Duplicate page ${pageName}`);
			throw new Error(`Duplicate page ${pageName}`);
		}
		pages.set(pageName, page);
	}
	return pages;
}

let pageCounter = 0;

/**
 * Retrieves the locations of all pages in the specified directory.
 * @param {string} dir - The directory to search for pages.
 * @returns {string[]} - The array of page locations.
 */
function getPageLocations(dir) {
	let allPages = [];
	const pages = fs.readdirSync(`./pages/${dir}`);
	for (const element of pages) {
		if (element.endsWith(".wiki")) {
			allPages.push(`./pages/${dir}${element}`);
		} else if (fs.lstatSync(`./pages/${dir}${element}`).isDirectory()) {
			allPages.push(...getPageLocations(`${dir}${element}/`));
		} else {
			//console.log(`Unknown element ${element}`);
		}
	}
	return allPages;
}

export default pageRenderer;
export {
	pageRenderer,
	getPageLocations as getPageLocations,
	getPageMap,
	bookRenderer,
};
