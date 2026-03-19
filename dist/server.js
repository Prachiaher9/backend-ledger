"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
app_1.app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
(0, db_1.connectToDB)();
