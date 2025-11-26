// react
import { Suspense } from "react";

// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// lib
import { getInitials, formatDate } from "@/lib/utils";

// actions
import { getUser } from "@/app/(dashboard)/_actions/user-actions";

// components
import { DeleteAccountButton } from "./_components/delete-account-button";

async function ProfileContent() {
  const { data: user, error } = await getUser();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Failed to load profile</p>
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">No user data found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
      <div className="flex w-full flex-col gap-12">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your user profile.
          </p>
        </div>

        <div>
          <h2 className="text-muted-foreground mb-4 text-sm font-medium tracking-tighter uppercase">
            ACCOUNT
          </h2>
          <Card>
            <CardContent>
              {/* Profile Information Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Profile Picture */}
                  <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium">
                        Profile picture
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar_url}
                          alt={user.name || "User"}
                        />
                        <AvatarFallback className="text-sm">
                          {user.name ? getInitials(user.name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium">Email</label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-end text-sm break-all">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium">Name</label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-end text-sm break-all">
                        {user.name || "Not provided"}
                      </span>
                    </div>
                  </div>

                  {/* Account Created */}
                  <div className="border-border flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium">
                        Account created
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-end text-sm break-all">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium tracking-tighter text-red-500 uppercase">
            Danger zone
          </h2>

          <Card>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="border-border flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium">
                        Delete account
                      </label>
                      <p className="text-muted-foreground text-xs">
                        Warning: This action cannot be undone.
                      </p>
                    </div>
                    <div className="flex items-center">
                      <DeleteAccountButton />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-4 flex w-full flex-col items-center md:mt-16 lg:w-3xl">
          <div className="flex w-full flex-col gap-6">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <div className="flex items-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
