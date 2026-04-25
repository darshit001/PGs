import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "./components/ChatWindow";
import LandingPage from "./components/LandingPage";
import CustomCursor from "./components/CustomCursor";

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <CustomCursor />
      <AnimatePresence mode="wait">
        {isChatOpen ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50"
          >
            <ChatWindow onBack={() => setIsChatOpen(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <LandingPage onStartChat={() => setIsChatOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
