import express, { static as static_ } from "express";
const app = express();
import pageRenderer, { getPages } from "./pageRenderer.js";
import fs from "fs";

app.set("view engine", "ejs");
app.use("/public", static_("public/"));

app.get("", (req, res) => {
	res.render("index", { title: "Home" });
});

app.get("/wiki/*", async (req, res) => {
	const decodedPage = decodeURIComponent(req.path);
	const page = decodedPage.replace("/wiki/", "").replace(".html", "");

	//convert escaped characters

	const result = await pageRenderer(`${page}`);
	if (result.error) {
		res.status(404).render("error", { title: "Error", error: result.error });
	} else {
		res.send(result.html);
	}
});

app.get("/move", (req, res) => {
	res.render("move", {
		pages: getPages("").map((page) =>
			page.replace(".xml", "").replace("./pages/", "")
		),
	});
});

function move(from, to) {
	if (from && to) {
		if (!fs.existsSync(`./pages/${from}.xml`)) {
			return { success: false, error: "Page not found" };
		}

		let toPath = to.split("/");
		toPath.pop();
		toPath = toPath.join("/") + "/";
		// if to is a directory, move to directory
		console.log({ toPath, to });
		if (toPath == to) {
			let fromName = from.split("/").pop();
			to = `${to}${fromName}`;
		}
		if (to == "/") to = "";
		if (to.startsWith("/")) return { success: false, error: "Invalid path" };
		fs.mkdirSync(`./pages/${toPath}`, { recursive: true });
		fs.renameSync(`./pages/${from}.xml`, `./pages/${to}.xml`);

		/*Change all links*/
		const pages = getPages("");
		let updatedPages = 0;
		for (const page of pages) {
			const pageText = fs.readFileSync(page).toString();
			const newPageText = pageText
				.replace(new RegExp(`\\[\\[${from}\\]\\]`, "gi"), `[[${to}]]`)
				.replace(new RegExp(`\\[\\[${from}\\|`, "gi"), `[[${to}|`);

			if (pageText != newPageText) {
				fs.writeFileSync(page, newPageText);
				updatedPages++;
			}
		}

		console.log(`Moved ${from} to ${to} and updated ${updatedPages} pages`);
		return { success: true };
	} else {
		return { success: false, error: "Missing parameters" };
	}
}

app.use(express.json());
app.post("/move", (req, res) => {
	let { from, to } = req.body;
	console.log(req.body);
	const result = move(from, to);

	if (result.success) {
		res.status(200).send(result);
	} else {
		res.status(400).send(result);
	}
});
app.get("/bulkmove", (req, res) => {
	res.render("bulkmove", {
		pages: getPages("").map((page) =>
			page.replace(".xml", "").replace("./pages/", "")
		),
	});
});
app.get("/bulkmovefromtext", (req, res) => {
	res.render("movefromtext", {
		pages: getPages("").map((page) =>
			page.replace(".xml", "").replace("./pages/", "")
		),
	});
});
function getCleanPages() {
	return getPages("").map((page) =>
		page.replace(".xml", "").replace("./pages/", "")
	);
}
app.post("/bulkmove", (req, res) => {
	let { items, to } = req.body;

	//check if to is a directory
	let toPath = to.split("/");
	toPath.pop();
	toPath = toPath.join("/") + "/";
	if (toPath != to) {
		res.status(400).send({ success: false, error: "to must be a directory" });
		return;
	}

	let errors = [];
	for (const element of items) {
		const result = move(element, to);
		if (!result.success) {
			errors.push({ from: element, to: to, error: result.error });
		}
	}
	if (errors.length == 0) {
		res.status(200).send({ success: true, pages: getCleanPages() });
	} else {
		res.status(400).send({ success: false, errors });
	}
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});
