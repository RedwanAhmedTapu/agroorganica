"use client";

import { useAppData } from "@/lib/DataContext";
import { Card, C } from "@/components/ui";
import AdminHint from "@/components/AdminHint";
import { Trash2 } from "lucide-react";
import { deleteMessage as apiDeleteMessage } from "@/lib/api";

export default function AdminMessagesPage() {
  const { data, setData, refresh } = useAppData();
  const msgs = data.messages;

  const del = async (id: string) => {
    // Optimistic UI update, then tell the backend directly (rather than
    // going through the debounced full-content PUT) so a delete can never
    // race with someone editing another admin tab.
    setData((d) => ({ ...d, messages: d.messages.filter((m) => m.id !== id) }));
    try {
      await apiDeleteMessage(id);
    } catch {
      await refresh();
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <AdminHint>
        Submissions from the public Contact form show up here automatically. Deleting one here only
        removes it from this list — it doesn't affect anything else on the site.
      </AdminHint>
      {msgs.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>
          No messages received yet — submissions from the Contact form will show up here.
        </p>
      ) : (
        msgs.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold" style={{ color: C.text }}>
                  {m.firstName} {m.lastName}
                </div>
                <div className="text-xs" style={{ color: C.muted }}>
                  {m.email} {m.phone && `· ${m.phone}`}
                </div>
              </div>
              <button onClick={() => del(m.id)} style={{ color: C.danger }}>
                <Trash2 size={15} />
              </button>
            </div>
            <p className="text-sm mt-2" style={{ color: C.text }}>
              {m.message}
            </p>
            <div className="text-[11px] mt-2" style={{ color: C.muted }}>
              {m.at}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
