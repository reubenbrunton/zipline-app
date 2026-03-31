import { Camera, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-[#8888AA] mt-0.5">
          Manage your personal profile details
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl p-5 md:p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-white/[0.08]">
          <Avatar className="h-14 w-14 border border-white/15">
            <AvatarImage src="" alt="Profile picture" />
            <AvatarFallback className="bg-white/[0.08] text-white text-base">
              RB
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Profile Picture</p>
            <p className="text-xs text-[#8888AA] mt-0.5">
              Upload a photo to personalize your account
            </p>
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

        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#8888AA] block mb-1.5">
                Name
              </label>
              <Input defaultValue="Reuben Brunton" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8888AA] block mb-1.5">
                Email
              </label>
              <Input type="email" defaultValue="jordan@zipline.agency" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#8888AA] block mb-1.5">
                Phone Number
              </label>
              <Input type="tel" defaultValue="+64 21 123 4567" placeholder="+1 555 123 4567" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-2">
              <User className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
