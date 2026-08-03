"use client";

import React, { useEffect } from "react";

export function ChatbotWidget() {
  useEffect(() => {
    // Load chatbot stylesheet if not already present
    if (!document.getElementById("rexity-chatbot-css")) {
      const link = document.createElement("link");
      link.id = "rexity-chatbot-css";
      link.rel = "stylesheet";
      link.href = "/assets/chatbot/rexity-chatbot.css?v=20260803";
      document.head.appendChild(link);
    }

    // Load chatbot script if not already present
    if (!document.getElementById("rexity-chatbot-js")) {
      const script = document.createElement("script");
      script.id = "rexity-chatbot-js";
      script.src = "/assets/chatbot/rexity-chatbot.js?v=20260803";
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
