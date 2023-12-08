import { readFileSync, writeFileSync } from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
const parser = new XMLParser();
const builder = new XMLBuilder({ arrayNodeName: "page" });

const xmlData = readFileSync("import.xml", "utf-8");
const parsedData = parser.parse(xmlData);

let pagesXML = [];

for (let page of parsedData.mediawiki.page) {
	pagesXML.push({
		title: page.title,
		filename: page.filename,
		text: page.revision.text,
	});
}

let pagesText = [];

for (let page of pagesXML) {
	let xmlContent = builder.build({
		title: page.title,
		text: page.text,
	});
	pagesText.push(xmlContent);
	writeFileSync(`../pages/${page.filename}.xml`, xmlContent, {
		encoding: "utf-8",
	});
}
