import express from "express";
import http from "http";
import config from "./config/config";
import logging from "./config/logging";
import { authMiddleware } from "./middleware/authMiddleware";
import authRoutes from "./routes/auth";
import gameRoutes from "./routes/game";
import statsRoutes from "./routes/stats";
import tournamentRoutes from "./routes/tournament";
import userRoutes from "./routes/user";

const NAMESPACE = "Server";
const router = express();

/** Log the request */
router.use((req, res, next) => {
  /** Log the req */
  logging.info(
    NAMESPACE,
    `METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
  );

  res.on("finish", () => {
    /** Log the res */
    logging.info(
      NAMESPACE,
      `METHOD: [${req.method}] - URL: [${req.url}] - STATUS: [${res.statusCode}] - IP: [${req.socket.remoteAddress}]`
    );
  });

  next();
});

/** Parse the body of the request */
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

/** Rules of our API */
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }

  next();
});

/** Routes go here */
router.use("/api/v1", authRoutes);
router.use("/api/v1", authMiddleware, userRoutes);
router.use("/api/v1", authMiddleware, statsRoutes);
router.use("/api/v1", authMiddleware, tournamentRoutes);
router.use("/api/v1", authMiddleware, gameRoutes);

/** Error handling */
router.use((req, res, next) => {
  const error = new Error("Not found");

  res.status(404).json({
    message: error.message
  });
});

const httpServer = http.createServer(router);

httpServer.listen(config.server.port, () =>
  logging.info(
    NAMESPACE,
    `Server is running ${config.server.hostname}:${config.server.port}`
  )
);
