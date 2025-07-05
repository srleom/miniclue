"use client";

// react
import * as React from "react";
import { useState } from "react";

// third-party
import { toast } from "sonner";

// icons
import { Pencil, Trash2 } from "lucide-react";

// types
import { ActionResponse } from "@/lib/api/authenticated-api";

// components
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import DeleteDialog from "./delete-dialog";
import { RenameDialog } from "./rename-dialog";

type Item = {
  id: string;
  title: string;
};

interface ItemActionsProps<T> {
  item: Item;
  itemType: "course" | "lecture";
  renameAction: (id: string, title: string) => Promise<ActionResponse<T>>;
  deleteAction: (id: string) => Promise<ActionResponse<void>>;
  children: React.ReactNode;
  isDefault?: boolean;
  dropdownMenuContentProps?: React.ComponentProps<typeof DropdownMenuContent>;
  onRenameSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

export function ItemActions<T>({
  item,
  itemType,
  renameAction,
  deleteAction,
  children,
  isDefault = false,
  dropdownMenuContentProps,
  onRenameSuccess,
  onDeleteSuccess,
}: ItemActionsProps<T>) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <DropdownMenu open={openMenu} onOpenChange={setOpenMenu}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent {...dropdownMenuContentProps}>
        <RenameDialog
          onOpenChange={(open) => !open && setOpenMenu(false)}
          trigger={
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onSelect={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="text-muted-foreground" />
              <span>Rename {itemType}</span>
            </DropdownMenuItem>
          }
          title={`Rename ${itemType}`}
          form={
            <form
              action={async (formData: FormData) => {
                const name = formData.get("name") as string;
                const result = await renameAction(item.id, name);
                if (result.error) {
                  toast.error(result.error as string);
                } else {
                  toast.success(
                    `${
                      itemType.charAt(0).toUpperCase() + itemType.slice(1)
                    } renamed`,
                  );
                  setOpenMenu(false);
                  onRenameSuccess?.();
                }
              }}
              className="grid gap-4"
            >
              <div className="grid gap-3">
                <Input name="name" defaultValue={item.title} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit" className="cursor-pointer">
                    Save
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          }
        />
        {!isDefault && (
          <>
            <DropdownMenuSeparator />
            <DeleteDialog
              onOpenChange={(open) => !open && setOpenMenu(false)}
              title={`Are you sure you want to delete this ${itemType}?`}
              description="This action cannot be undone."
              onConfirm={async () => {
                const toastId = toast.loading(`Deleting ${itemType}...`);
                try {
                  const result = await deleteAction(item.id);
                  if (result?.error) {
                    toast.error(result.error as string);
                  } else {
                    onDeleteSuccess?.();
                  }
                } finally {
                  toast.dismiss(toastId);
                  setOpenMenu(false);
                }
              }}
            >
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:cursor-pointer"
                onSelect={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="text-destructive" />
                <span>Delete {itemType}</span>
              </DropdownMenuItem>
            </DeleteDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
