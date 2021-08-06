const express = require("express");
const app = express();
const request = require("request");
const fs = require("fs");
const bodyParser = require("body-parser");
const PollManager = require("./PollManager");

app.use(bodyParser.urlencoded());

request("https://raw.githubusercontent.com/OguzhanUmutlu/RealTimePoll/main/CHANGELOG.json", {method: "GET"}, function (error, response) {
    try {
        const CHANGELOG = JSON.parse(response.body);
        const currentVersion = CHANGELOG[require("./package.json").version];
        if (!currentVersion) {
            console.error("Current version not found in releases! Project might have been updated!");
        } else {
            const lastVersion = Object.values(CHANGELOG)[Object.values(CHANGELOG).length - 1];
            if (currentVersion.id < lastVersion.id) {
                console.log("Project has been updated! You can download and check news in this release: " + lastVersion.release);
            } else console.log("You are using latest Project, congratulations!");
        }
    } catch (e) {
        console.error("An error occurred while trying to check updates.");
    }
});

app.get("/", (req, res) => {
    res.send(fs.readFileSync("./src/new.html").toString());
});

app.post("/", (req, res) => {
    if (!req.body || !req.body.title) return;
    let options = [];
    for (let i = 1; i <= 15; i++)
        if (req.body["option" + i])
            options.push(req.body["option" + i]);
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    let id = PollManager.createPoll(req.body.title, options, typeof ip === "string" ? ip : JSON.stringify(ip));
    if (id === -1) return res.send("An error occurred.");
    res.redirect("/poll?id=" + id);
});

app.get("/poll", (req, res) => {
    if (!req.query.id) return;
    let poll = PollManager.data[req.query.id];
    if (!poll) return;
    res.send(fs.readFileSync("./src/poll.html").toString()
        .replace("{title}", poll.title
            .replace(/</g, "&zwnj;<&zwnj;")
            .replace(/>/g, "&zwnj;>&zwnj;")
        )
        .replace("{options}", JSON.stringify(poll.options.map(i => i
                .replace(/</g, "&zwnj;<&zwnj;")
                .replace(/>/g, "&zwnj;>&zwnj;"))
            )
        )
        .replace("{pollId}", poll.id)
    );
});

app.get("/api", (req, res) => {
    if (req.query.type === "pollVotes") {
        if (PollManager.data[req.query.id]) {
            let votes = {};
            Object.values(PollManager.data[req.query.id].votes).forEach(i => {
                if (!votes[i])
                    votes[i] = 0;
                votes[i]++;
            });
            res.json({result: votes});
        } else res.json({error: "Poll not found", code: 7965});
    } else if (req.query.type === "addVote") {
        if (PollManager.data[req.query.id]) {
            if (req.query["option"]) {
                let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                let response = PollManager.addVote(req.query.id, ip, req.query["option"]);
                if (response === 1) {
                    res.json({result: "Success"});
                } else {
                    let responses = {
                        "-1": "Poll not found",
                        "-2": "Owner cannot vote",
                        "-3": "Already voted",
                        "-4": "Illegal packet sent"
                    };
                    res.json({error: responses[response]})
                }
            } else res.json({error: "Invalid option", code: 8752});
        } else res.json({error: "Poll not found", code: 7965});
    } else if (req.query.type === "clearVote") {
        if (PollManager.data[req.query.id]) {
            let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            let response = PollManager.clearVote(req.query.id, ip);
            if (response === 1) {
                res.json({result: "Success"});
            } else {
                let responses = {
                    "-1": "Poll not found",
                    "-2": "Not voted"
                };
                res.json({error: responses[response]})
            }
        } else res.json({error: "Poll not found", code: 7965});
    }
})

app.listen(3000, function () {
    console.log("Host started on port 3000.");
});