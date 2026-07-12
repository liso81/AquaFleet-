import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { auth } from "./shared/firebaseConfig";
import SolicitudAgua from "./SolicitudAgua";

const COLORS = { paper: "#F6F1E9", cobalt: "#1B4B6B" };

export default function App() {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        signInAnonymously(auth).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, []);

  if (!uid) {
    return (
      <div style={{ background: COLORS.paper }} className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" color={COLORS.cobalt} />
      </div>
    );
  }

  return <SolicitudAgua clienteId={uid} />;
    }
