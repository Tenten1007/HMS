// @ts-ignore
const express = require("express");
const app = express();

app.use(express.json()); // สำคัญ! ต้อง parse JSON

app.post("/webhook", (req: any, res: any) => {
  res.sendStatus(200);
});

const PORT = 4001; // ใช้ port อะไรก็ได้ที่ว่าง
app.listen(PORT, () => {
}); 