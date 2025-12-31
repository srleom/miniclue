"use client";

// react
import { useState } from "react";

// third-party
import { toast } from "sonner";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// actions
import { deleteUserAccount } from "@/app/(dashboard)/_actions/user-actions";

// lib
import { logger } from "@/lib/logger";

export function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();
      if (result.error) {
        toast.error(result.error);
        setIsDeleting(false);
      } else {
        toast.success("Account deleted successfully");
        // The redirect will happen automatically from the server action
      }
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior)
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        // This is expected, don't show an error toast
        // The redirect will happen automatically
        return;
      }

      logger.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText("");
    }
  };

  const isConfirmationValid = confirmationText === "DELETE";

  return (
    <AlertDialog onOpenChange={handleDialogOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete..."}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-start">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="confirmation"
              className="text-start text-sm font-medium"
            >
              Type &quot;DELETE&quot; to confirm
            </label>
            <Input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="mt-1 font-mono"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || !isConfirmationValid}
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
