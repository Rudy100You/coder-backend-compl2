import express from "express";
import {__dirname, pathJoin} from "./utils/utils.js";
import handlebars from "express-handlebars";
import viewsRouter from "./routes/views.router.js";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import initializePassport from "./config/passport.config.js";
import passport from "passport";
import { validateSession, validateSessionAfterLogin } from "./utils/middlewares/session.validations.js";
import apiRouter from "./routes/api.router.js";
config({ path: pathJoin(__dirname, ".env" )});

const {
  MDB_USER,
  MDB_PASS,
  MDB_HOST,
  DATABASE_NAME,
  PORT,
  RENDER_ENDPOINT,
  GH_SESSION_SECRET,
  GH_CLIENT_ID
} = process.env;

const MONGO_URL = `mongodb+srv://${MDB_USER}:${MDB_PASS}@${MDB_HOST}/${DATABASE_NAME}?retryWrites=true&w=majority`;

const app = express();


app.use(cookieParser());

app.use(
  session({
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
      ttl: 30 * 60,
    }),
    resave: false,
    saveUninitialized: false,
    secret: GH_SESSION_SECRET,
  })
);

app.use(passport.initialize())
app.use(passport.session())
initializePassport(GH_CLIENT_ID, GH_SESSION_SECRET)


app.use(express.static(pathJoin(__dirname ,"public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.engine("handlebars", handlebars.engine());
app.set("views", pathJoin(__dirname, "views"));
app.set("view engine", "handlebars");


mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.info("mongoose connected");

    app.use("/api", apiRouter);

    app.get("/login", validateSessionAfterLogin, async (req, res) => {
      res.render("login", {});
    });

    app.get("/register", validateSessionAfterLogin, async (req, res) => {
      res.render("register", {});
    });

    app.use("/",validateSession, viewsRouter);

    app.listen(PORT, () => {
      console.log(`Servidor iniciado en ${ RENDER_ENDPOINT || "https://127.0.0.1:"+ PORT+"/"} con éxito`);
    });
  });
