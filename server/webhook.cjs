// @ts-ignore
var express = require("express");
var app = express();
app.use(express.json()); // สำคัญ! ต้อง parse JSON
app.post("/webhook", function (req, res) {
    console.log("LINE Webhook Event:", JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});
var PORT = 4001; // ใช้ port อะไรก็ได้ที่ว่าง
app.listen(PORT, function () {
    console.log("Webhook server listening on port", PORT);
});
