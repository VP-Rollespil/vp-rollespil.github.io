import express, { static as static_ } from "express";
const app = express();
import pageRenderer, { getPageLocations, getPageMap } from "./pageRenderer.js";
import fs from "fs";

app.set("view engine", "ejs");
app.use("/public", static_("public/"));

async function renderOffgamePage(pageName, res, req) {
	const result = await pageRenderer(pageName, {}, false);
	if (result.error) {
		res.status(404).render("error", { title: "Error", error: result.error });
	} else {
		res.render("offgame.ejs", {
			content: result.text,
			page: result.page,
		});
	}
}
app.get("", async (req, res) => {
	renderOffgamePage("forside", res, req);
});
app.get("/regler.html", async (req, res) => {
	renderOffgamePage("regler", res, req);
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

function getCleanPages() {
	return getPageLocations("").map((page) =>
		page.split("/").pop().replace(".wiki", "")
	);
}
app.get("/move", (req, res) => {
	res.render("move", {
		pages: getCleanPages(),
	});
});

function rename(from, to) {
	if (from && to) {
		let pageMap = getPageMap();
		let fromPath = pageMap.get(from);
		console.log(from, fromPath, to);

		if (!fs.existsSync(fromPath)) {
			return { success: false, error: "Page not found" };
		}

		let fromPathSplit = fromPath.split("/");
		fromPathSplit.pop();
		fromPathSplit.push(to);
		let toPath = fromPathSplit.join("/") + ".wiki";

		console.log(fromPath, toPath);

		fs.renameSync(fromPath, toPath);

		//Replace all links to the old page with the new page

		let pages = getPageLocations("");
		for (const page of pages) {
			let data = fs.readFileSync(page, "utf8");
			let newData = data
				.replace(new RegExp(`\\[\\[${from}\\]\\]`, "g"), `[[${to}]]`)
				.replace(new RegExp(`\\[\\[${from}\\|`, "g"), `[[${to}|`);

			if (data != newData) fs.writeFileSync(page, newData, "utf8");
		}

		return { success: true };
	} else {
		return { success: false, error: "Missing parameters" };
	}
}

app.use(express.json());
app.post("/move", (req, res) => {
	let { from, to } = req.body;
	console.log(req.body);
	const result = rename(from, to);

	if (result.success) {
		res.status(200).send(result);
	} else {
		res.status(400).send(result);
	}
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});
