const express = require("express");
const app = express();
const request = require("request");

request("https://raw.githubusercontent.com/OguzhanUmutlu/RealTimePoll/main/CHANGELOG.json", {method: "GET"}, function (error, response) {
    try {
        const CHANGELOG = JSON.parse(response.body);
        const currentVersion = CHANGELOG[require("./package.json").version];
        if(!currentVersion) {
            console.error("Current version not found in releases! Template might have been updated!");
        } else {
            const lastVersion = Object.values(CHANGELOG)[Object.values(CHANGELOG).length-1];
            if(currentVersion.id < lastVersion.id) {
                console.log("Template has been updated! You can download and check news in this release: " + lastVersion.release);
            } else console.log("You are using latest Template, congratulations!");
        }
    } catch (e) {
        console.error("An error occurred while trying to check updates.");
    }
});

app.listen(3000, function() {
    console.log("Host started on port 3000.");
})