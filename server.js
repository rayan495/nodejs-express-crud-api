const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const timeout = require("connect-timeout");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const db = require("./app/models");
const taskRoutes = require("./app/routes/task.routes.js");
const userRoutes = require("./app/routes/user.routes.js");
const authRoutes = require("./app/routes/auth.routes.js");

const app = express();

dotenv.config();

app.set('trust proxy', 1); //RECCOMENDED FOR CLOUDS, SOME DIFFERENTIATE IP.

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, //YOUR PREFERENCE
  message: {
    error: "TOO_MANY_REQUESTS"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(timeout('30s'));

app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie-secret'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : "http://localhost:8000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

db.sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected to MySQL");
    if (process.env.NODE_ENV !== 'production') {
        return db.sequelize.sync();
    }
  })
  .then(() => {
    if (process.env.NODE_ENV !== 'production') console.log("Database synchronized");
  })
  .catch((err) => {
    console.error("Database Error:", err.message);
  });

app.use("/task", taskRoutes);
app.use("/user", userRoutes);
app.use("/auth", authRoutes);

app.use((req, res, next) => {
  if (!req.timedout) next();
});

app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `The route [${req.method}] ${req.url} not found`
  });
});

app.use((err, req, res, next) => {
  if (err.timeout || req.timedout) {
    return res.status(503).json({ error: "SERVICE_UNAVAILABLE" });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: "PAYLOAD_TOO_LARGE" });
  }

  console.error(`[SERVER_ERROR]: ${err.message}`);
  res.status(500).json({ 
    error: "INTERNAL_SERVER_ERROR",  
  });
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`[Sucess] server running on port ${PORT}`);
    });
}

module.exports = app;
