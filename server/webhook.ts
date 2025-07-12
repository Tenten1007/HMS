import express from "express";
const app = express();

app.use(express.json()); // สำคัญ! ต้อง parse JSON

app.post("/webhook", (req, res) => {
  console.log("LINE Webhook Event:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = 4001; // ใช้ port อะไรก็ได้ที่ว่าง
app.listen(PORT, () => {
  console.log("Webhook server listening on port", PORT);
}); 