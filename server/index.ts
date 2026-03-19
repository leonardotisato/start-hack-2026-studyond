import cors from "cors";
import express from "express";

import { chatRouter } from "./routes/chat";
import { diagnoseRouter } from "./routes/diagnose";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/chat", chatRouter);
app.use("/api/diagnose", diagnoseRouter);

app.listen(port, () => {
  console.log(`Studyond Thesis GPS API listening on http://localhost:${port}`);
});
