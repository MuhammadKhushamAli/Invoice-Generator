import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));

app.use(cookieParser());

import userRoute from "./routes/user.routes.js";
import itemRoute from "./routes/item.routes.js";
import salesRoute from "./routes/sales.routes.js";
import invoiceRoute from "./routes/invoice.routes.js";

app.use("/api/v1/user", userRoute);
app.use("/api/v1/item", itemRoute);
app.use("/api/v1/sales", salesRoute);
app.use("/api/v1/invoice", invoiceRoute);
app.get("/health/puppeteer", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    await browser.close();
    res.send("Puppeteer OK");
  } catch (err) {
    console.error("PUPPETEER ERROR FULL:", err);
    res.status(500).json({
      message: "Puppeteer FAILED",
      error: err.message,
    });
  }
});



app.use((err, _, res, __) => {
  res
    .status(err.statusCode || 500)
    .json(
      new ApiError(
        err.statusCode || 500,
        err.message || "Internal Server Error",
        err.errors || [],
        err.stack || ""
      )
    );
});

export default app;
