require("dotenv").config();
const upload = require("./routes/upload");
const Grid = require("gridfs-stream");
const mongoose = require("mongoose");
const connection = require("./db");
const express = require("express");
const app = express();
const path = require("path");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const logger = require("./middleware/logger");
const cookieParser = require("cookie-parser");

// 🔹 Fayl yuklash hajmini oshirish (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Cookie parser
app.use(cookieParser());

// CORS sozlash
app.use(
  cors({
    origin: true,
    credentials: true, // Cookie ni yuborish uchun
  })
);

// Logger middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();
  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (
      elapsedHrTime[0] * 1000 +
      elapsedHrTime[1] / 1e6
    ).toFixed(2);
    logger.info(`[${req.method}] ${req.originalUrl} ${elapsedTimeInMs}ms`);
  });
  next();
});

// MongoDB ulanishi
let gfs;
connection();
const conn = mongoose.connection;
conn.once("open", function () {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("photos");
});

// Fayllar yo‘nalishi
app.use("/file", upload);

// Media fayllarni olish
app.get("/file/:filename", async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    const readStream = gfs.createReadStream(file.filename);
    readStream.pipe(res);
  } catch (error) {
    res.send("not found");
  }
});

// Fayllarni o‘chirish
app.delete("/file/:filename", async (req, res) => {
  try {
    await gfs.files.deleteOne({ filename: req.params.filename });
    res.send("success");
  } catch (error) {
    console.log(error);
    res.send("An error occured.");
  }
});

// 🔹 API yo‘nalishlari
const { router } = require("./routes/extraRoutes");
const user = require("./routes/users");
const multitude = require("./routes/multitude");
const post = require("./routes/post");
const follow = require("./routes/follows");
const save = require("./routes/saves");
const likes = require("./routes/likes");
const comment = require("./routes/comments");
const admin_main = require("./routes/admin");
const store = require("./store/store");
const invertory = require("./store/inventory");
const recommendations = require("./recommendations");

app.use("/", router);
app.use("/api/users", user);
app.use("/api/multitude", multitude);
app.use("/api/posts", post);
app.use("/system/follows", follow);
app.use("/system/saves", save);
app.use("/system/likes", likes);
app.use("/api/comments", comment);
app.use("/admin/panel", admin_main);
app.use("/store", store);
app.use("/invertory", invertory);
app.use("/recommendations", recommendations);

// Swagger sozlash
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation of dast",
      version: "1.0.0",
      description: "specially for dast in 2024 and 2025",
    },
  },
  apis: ["./routes/*.js", "index.js", "./recommendations.js", "./store/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", {
    title: "dast server",
    message: "server side for web site dast!",
  });
});

// 🔹 Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // Har bir IP uchun 100 ta so‘rov
});
app.use(limiter);

// 🔹 Serverni ishga tushirish
const port = process.env.PORT || 8080;
app.listen(port, console.log(`Listening on port ${port}...`));
