const fs = require("fs");

class PollManager {
    constructor() {
        this.file = "./polls.json";
        if(!fs.readdirSync(".").includes("polls.json"))
            fs.writeFileSync("polls.json", "{}");
        this.data = JSON.parse(fs.readFileSync(this.file).toString());
    }
    save() {
        fs.writeFileSync(this.file, JSON.stringify(this.data));
    }
    createPoll(
        title = "",
        options = [""],
        ip = ""
    ) {
        let id = Object.keys(this.data)[0] ? (Object.keys(this.data).sort(function(a, b){return a-b}).reverse()[0]*1)+1 : 0;
        if(this.data[id]) {
            console.log("Error: #5404, please report this issue.");
            return -1;
        }
        this.data[id] = {
            id, title, options, owner: ip, votes: {}, createdTimestamp: Date.now()
        };
        this.save();
        return id;
    }
    addVote(pollId, ip, buttonIndex) {
        if(!this.data[pollId]) return -1; // poll not found
        if(this.data[pollId].owner === ip) return -2; // owner cannot vote
        if(this.data[pollId].votes[ip] !== undefined && this.data[pollId].votes[ip] === buttonIndex) return -3; // already voted
        if(this.data[pollId].options.length < buttonIndex || buttonIndex < 1) return -4; // illegal packet
        this.data[pollId].votes[ip] = buttonIndex;
        this.save();
        return 1;
    }
    clearVote(pollId, ip) {
        if(!this.data[pollId]) return -1; // poll not found
        if(this.data[pollId].votes[ip] === undefined) return -2; // not voted
        delete this.data[pollId].votes[ip];
        this.save();
        return 1;
    }
    getOwnerPolls(ip) {
        return Object.values(this.data).filter(i=> i.owner === ip).map(i=> i.ip);
    }
}
let instance = new PollManager();
module.exports = instance;
