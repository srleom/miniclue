"use client";

// react
import { useState } from "react";

// third-party
import { toast } from "sonner";

// components
import { Button } from "@/components/ui/button";
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

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isDeleting}
          className="hover:cursor-pointer"
        >
          {isDeleting ? "Deleting..." : "Delete..."}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="hover:cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="hover:cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
