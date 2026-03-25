"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiFetch";

export type Notification = {
  id: string;
  type: "success" | "alert" | "achievement" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("academy_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      const initial: Notification[] = [
        { 
          id: "1", 
          type: "success", 
          title: "Orbital Uplink Established", 
          message: "Your connection to the Academy mainframe is now secured with Level-4 encryption.", 
          timestamp: "2m ago", 
          read: false,
          priority: "medium"
        },
        { 
          id: "2", 
          type: "achievement", 
          title: "New Achievement: Star Gazer", 
          message: "You have successfully navigated through the registration nebula.", 
          timestamp: "1h ago", 
          read: true,
          priority: "low"
        }
      ];
      setNotifications(initial);
      localStorage.setItem("academy_notifications", JSON.stringify(initial));
    }
  }, []);

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem("academy_notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("academy_notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem("academy_notifications", JSON.stringify([]));
  };

  return { notifications, loading, markAsRead, markAllAsRead, clearAll };
}
