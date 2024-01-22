
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB50AgrIRO5zQFWImOgAO2kDFAGaAzA1ok",
  authDomain: "weather-ae5dc.firebaseapp.com",
  databaseURL: "https://weather-ae5dc-default-rtdb.firebaseio.com",
  projectId: "weather-ae5dc",
  storageBucket: "weather-ae5dc.appspot.com",
  messagingSenderId: "557246056354",
  appId: "1:557246056354:web:2d0bff3dc884e1d112d4fb",
  measurementId: "G-CYLRBW8B67"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default app;
