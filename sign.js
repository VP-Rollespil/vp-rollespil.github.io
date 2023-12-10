//sign a page you changed with your username

import { readFileSync, writeFileSync } from "fs";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import dotenv from "dotenv";
dotenv.config();

let page = process.argv[2];

const parser = new XMLParser();
const builder = new XMLBuilder({ format: true });

const xmlData = readFileSync(`./pages/${page}.xml`, "utf-8");

if (!xmlData) {
	console.log("No such page.");
	process.exit(1);
}

let parsedData = parser.parse(xmlData);

parsedData.author = process.env.author;
parsedData.timestamp = new Date().toISOString();

const xml = builder.build(parsedData);

writeFileSync(`./pages/${page}.xml`, xml);

console.log(`Signed page ${page}.`);
process.exit(0);
