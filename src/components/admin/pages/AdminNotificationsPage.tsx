"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { endpoints } from "@/lib/endpoints";
import AdminCard from "../ui/AdminCard";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import TextAreaField from "../ui/TextAreaField";
import SelectField from "../ui/SelectField";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: "platform" | "push" | "both";
  target: { type: "all" | "standard" | "user"; value?: string };
  status: "draft" | "sent";
  sentAt?: string;
};

type Standard = { _id: string; name: string };

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "platform" as const,
    targetType: "all" as "all" | "standard" | "user",
    targetValue: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [nRes, sRes]: any[] = await Promise.all([
        apiFetch(endpoints.admin.notifications, { auth: true }),
        apiFetch(endpoints.admin.standards, { auth: true })
      ]);
      setNotifications(nRes?.data ?? nRes ?? []);
      const stdData = sRes?.data ?? sRes ?? [];
      setStandards(Array.isArray(stdData) ? stdData : (stdData.items ?? []));
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        target: {
          type: form.targetType,
          value: form.targetType === "all" ? undefined : form.targetValue
        }
      };

      await apiFetch(endpoints.admin.notifications, { method: "POST", auth: true, body: payload });
      setForm({ title: "", message: "", type: "platform", targetType: "all", targetValue: "" });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-white/55">Send platform alerts or push notifications to students.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">Recently Sent</h2>
          {loading ? (
            <div className="py-10 text-center text-white/20">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center text-white/30 border border-dashed border-white/10 rounded-xl">
              No notifications sent yet.
            </div>
          ) : (
            notifications.map(n => (
              <AdminCard key={n._id}>
                <div className="flex justify-between items-start gap-4">
                   <div>
                     <div className="flex items-center gap-2">
                        <span className="bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                          {n.type}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {n.sentAt ? new Date(n.sentAt).toLocaleString() : "Pending"}
                        </span>
                     </div>
                     <h3 className="mt-2 font-semibold">{n.title}</h3>
                     <p className="mt-1 text-sm text-white/55">{n.message}</p>
                     <div className="mt-3 text-[10px] text-white/30">
                        Target: <span className="text-white/50">{n.target.type}</span> {n.target.value && `(${n.target.value})`}
                     </div>
                   </div>
                </div>
              </AdminCard>
            ))
          )}
        </div>

        <div>
          <AdminCard title="Compose Notification">
            <form onSubmit={handleSend} className="space-y-4">
               <TextField 
                 label="Title" 
                 placeholder="Main headline" 
                 value={form.title} 
                 onChange={v => setForm({...form, title: v})} 
                 required 
               />
               <TextAreaField 
                 label="Message" 
                 placeholder="Supporting text for the notification..." 
                 value={form.message} 
                 onChange={v => setForm({...form, message: v})} 
                 required 
               />
               
               <div className="grid grid-cols-2 gap-4">
                 <SelectField
                    label="Delivery Mode"
                    value={form.type}
                    onChange={v => setForm({...form, type: v as any})}
                    options={[
                      {label: "Platform Alert", value: "platform"},
                      {label: "Push Notification", value: "push"},
                      {label: "Both", value: "both"}
                    ]}
                 />
                 <SelectField
                    label="Target Type"
                    value={form.targetType}
                    onChange={v => setForm({...form, targetType: v as any})}
                    options={[
                      {label: "All Users", value: "all"},
                      {label: "By Grade", value: "standard"},
                      {label: "Specific User", value: "user"}
                    ]}
                 />
               </div>

               {form.targetType === "standard" && (
                 <SelectField
                    label="Select Grade"
                    value={form.targetValue}
                    onChange={v => setForm({...form, targetValue: v})}
                    options={standards.map(s => ({label: s.name, value: s._id}))}
                    required
                 />
               )}

               {form.targetType === "user" && (
                 <TextField
                    label="User ID"
                    placeholder="Enter MongoDB User ID"
                    value={form.targetValue}
                    onChange={v => setForm({...form, targetValue: v})}
                    required
                 />
               )}

               <div className="pt-4 mt-2 border-t border-white/10">
                 <Button 
                   type="submit" 
                   className="w-full bg-white text-black font-semibold hover:bg-white/90" 
                   disabled={submitting}
                 >
                   {submitting ? "Sending..." : "Send Notification"}
                 </Button>
                 <p className="mt-3 text-[10px] text-center text-white/30 px-4">
                   Push notifications require users to have active tokens. Scoped admins only send to their assigned grades.
                 </p>
               </div>
            </form>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
