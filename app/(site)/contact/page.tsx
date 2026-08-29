"use client";

import { useState } from "react";
import { Card, Field, Btn, inputCls, inputStyle, C } from "@/components/ui";
import { submitContactMessage, ApiError } from "@/lib/api";
import { Phone, Mail, MapPin, Send, Check, AlertCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.message) return;
    setSending(true);
    setError(null);
    try {
      // Public endpoint — works for anonymous visitors, doesn't touch the
      // admin-only site content record.
      await submitContactMessage(form);
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <Card className="p-6">
          <h3 className="font-serif text-xl mb-2" style={{ color: C.primary }}>
            Contact Us
          </h3>
          <p className="text-xs mb-5" style={{ color: C.muted }}>
            Fill up the form and our team will get back to you within 24 hours.
          </p>
          <div className="flex items-start gap-2 mb-3 text-sm" style={{ color: C.text }}>
            <Phone size={15} style={{ color: C.primary }} className="mt-0.5" /> +880-2-963-4753
          </div>
          <div className="flex items-start gap-2 mb-3 text-sm" style={{ color: C.text }}>
            <Mail size={15} style={{ color: C.primary }} className="mt-0.5" /> info@agroorganica.com.bd
          </div>
          <div className="flex items-start gap-2 text-sm" style={{ color: C.text }}>
            <MapPin size={15} style={{ color: C.primary }} className="mt-0.5" /> Suite #301, 65 Elephant Road, Dhaka-1205
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-serif text-xl mb-5" style={{ color: C.primary }}>
            For Further Query
          </h3>
          <form onSubmit={submit}>
            <div className="grid sm:grid-cols-2 gap-x-4">
              <Field label="First Name">
                <input className={inputCls} style={inputStyle} value={form.firstName} onChange={set("firstName")} required />
              </Field>
              <Field label="Last Name">
                <input className={inputCls} style={inputStyle} value={form.lastName} onChange={set("lastName")} />
              </Field>
              <Field label="E-Mail">
                <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={set("email")} required />
              </Field>
              <Field label="Phone">
                <input className={inputCls} style={inputStyle} value={form.phone} onChange={set("phone")} />
              </Field>
            </div>
            <Field label="Message">
              <textarea rows={4} className={inputCls} style={inputStyle} value={form.message} onChange={set("message")} required />
            </Field>
            <div className="flex items-center gap-3">
              <Btn type="submit" variant="primary" disabled={sending}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "Sending…" : "Send Message"}
              </Btn>
              {sent && (
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: C.primary }}>
                  <Check size={14} /> Message sent
                </span>
              )}
              {error && (
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: C.danger }}>
                  <AlertCircle size={14} /> {error}
                </span>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
