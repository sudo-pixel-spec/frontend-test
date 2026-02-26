import React from "react";

export default function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-white/10" />
      <div className="text-xs text-white/40">Or continue with</div>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}