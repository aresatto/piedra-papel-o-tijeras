import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import * as dotenv from "dotenv";

dotenv.config();

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

const APP = initializeApp(config);
const RTDB = getDatabase(APP);

export { RTDB };
