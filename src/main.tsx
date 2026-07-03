import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
// Local storage sync is disabled as we are now fully online
// import { setupLocalStorageFirebaseSync } from "./services/firebaseSync";
// setupLocalStorageFirebaseSync();

createRoot(document.getElementById("root")!).render(<App />);
