 import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LflJ24tAAAAAMNxo1mFOLEMc-SIkVIrz9Quzo6M"),
  isTokenAutoRefreshEnabled: true,
});

getToken(appCheck, true)
  .then((result) => {
    alert("Token App Check gerado com sucesso! Tamanho: " + result.token.length);
  })
  .catch((e) => {
    alert("ERRO ao gerar token App Check: " + e.code + " — " + e.message);
  });

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
