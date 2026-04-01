"use client";

import { useState, useEffect } from "react";
import { Camera, User, Check, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Populate fields once user loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  // Fetch phone separately from profiles table
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.phone) setPhone(data.phone);
      });
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setStatus("idle");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, email, phone, updated_at: new Date().toISOString() });

    setSaving(false);
    if (error) {
      setStatus("error");
    } else {
      setStatus("success");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-[#8888AA] mt-0.5">Manage your personal profile details</p>
      </div>

      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl p-5 md:p-6">
        {/* Avatar row */}
        <div className="flex items-center gap-4 pb-5 border-b border-white/[0.08]">
          <Avatar className="h-14 w-14 border border-white/15">
            <AvatarImage src={user?.avatar_url ?? ""} alt={user?.full_name} />
            <AvatarFallback className="bg-white/[0.08] text-white text-base">
              {user?.initials ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Profile Picture</p>
            <p className="text-xs text-[#8888AA] mt-0.5">Upload a photo to personalize your account</p>
          </div>

          <label
            htmlFor="profile-photo"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-white/15 bg-white/[0.05] text-white/90 text-sm font-medium hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            <Camera className="h-3.5 w-3.5" />
            Change Photo
            <input id="profile-photo" type="file" accept="image/*" className="hidden" />
          </label>
        </div>

        {/* Fields */}
        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#8888AA] block mb-1.5">Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8888AA] block mb-1.5">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#8888AA] block mb-1.5">Phone Number</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {status === "success" && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-1.5 text-sm text-red-400">
                <AlertCircle className="h-3.5 w-3.5" /> Failed to save
              </span>
            )}
            <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
