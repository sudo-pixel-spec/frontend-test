"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, Loader2 } from "lucide-react";

export default function LoadingScreen({ message = "Loading System..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02040a]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="relative h-48 w-48">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border-2 border-purple-500/20 border-b-purple-500 opacity-60"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-10 rounded-full border border-pink-500/30 border-l-pink-500 opacity-40"
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
             >
               <Terminal className="text-cyan-400" size={40} />
             </motion.div>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/60 mb-3 animate-pulse">
            Establishing Neural Link
          </p>
          <h3 className="text-xl font-bold tracking-tight text-white/90">
            {message}
          </h3>
          
          <div className="mt-8 flex justify-center gap-1.5">
             {[0, 1, 2, 3].map(i => (
               <motion.div
                key={i}
                animate={{ 
                  scaleY: [1, 2, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.15 
                }}
                className="h-4 w-1 rounded-full bg-cyan-400"
               />
             ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-10 hidden md:block">
         <p className="text-[8px] font-mono text-white/10 leading-relaxed uppercase tracking-widest">
           Kernel: 0x8291A <br />
           Subsystem: Academy_V4 <br />
           Status: SYNC_IN_PROGRESS
         </p>
      </div>
    </div>
  );
}