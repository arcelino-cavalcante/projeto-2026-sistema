import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { setupLocalStorageFirebaseSync } from "./services/firebaseSync";

setupLocalStorageFirebaseSync();

createRoot(document.getElementById("root")!).render(<App />);
