import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { getPageMap, getPageLocations } from "./pageRenderer.js";
import fs from "fs";
let parser = new XMLParser();
let builder = new XMLBuilder();

//convert XML page to .wiki format with variables
let pages = getPageMap();
function convertPage(pageLocation) {
	let page = fs.readFileSync(pageLocation).toString();
	let pageObject = parser.parse(page);
	let text = pageObject.text;
	let variables = {
		title: pageObject.title,
		copyright: pageObject.copyright,
		author: pageObject.author,
		timestamp: pageObject.timestamp,
	};
	let result = "";
	result += `{{title:${variables.title}}}\n`;
	result += `{{author:${variables.author}}}\n`;
	result += `{{timestamp:${variables.timestamp}}}\n`;
	if (variables.copyright) result += `{{copyright:${variables.copyright}}}\n`;
	result += text;
	return result;
}

function convertWrite(pageLocation) {
	let result = convertPage(pageLocation);

	let newPageLocation = pageLocation.replace(".xml", ".wiki");
	fs.writeFileSync(newPageLocation, result);
	fs.unlinkSync(pageLocation);
}

let allPages = getPageLocations("");
for (const page of allPages) {
	convertWrite(page);
}
