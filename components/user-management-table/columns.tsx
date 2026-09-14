"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Profile } from "@/types/hazard";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ActionsCell({ profile }: { profile: Profile }) {
  const supabase = getSupabaseBrowserClient();

  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [role, setRole] = useState(profile.role);

  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: Partial<Profile> = {
      full_name: fullName,
      email: email,
      role: role,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updatedProfile as never)
      .eq("profile_id", profile.profile_id);

    if (error) {
      toast.error("Update failed", {
        description: error.message,
      });
      return;
    }

    toast.success("User updated successfully", {
      description: `${fullName} has been saved`,
    });

    setIsEditing(false);
     router.refresh();
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("profile_id", profile.profile_id);

    setIsDeleting(false);

    if (error) {
      toast.error("Delete failed", {
        description: error.message,
      });
      return;
    }

    toast.success("User deleted successfully", {
      description: `${profile.full_name} was removed`,
    });

    setIsDeleteOpen(false);

    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <Dialog
          onOpenChange={(open) => {
            if (!open) setIsEditing(false);
          }}
        >
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              View / Edit User
            </DropdownMenuItem>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>User Information</DialogTitle>
              <DialogDescription>View or edit user details.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Profile ID</label>
                <Input value={profile.profile_id} disabled />
              </div>

              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role</label>

                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as "user" | "admin")}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Created At</label>
                <Input
                  value={
                    profile.created_at
                      ? new Date(profile.created_at.replace(" ", "T"))
                          .toLocaleString("en-US", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                          .replace(",", " at")
                      : "N/A"
                  }
                  disabled
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {!isEditing ? (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>

                    <Button type="submit">Save Changes</Button>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <DropdownMenuSeparator />

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{profile.full_name}</span>? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const profileColumns: ColumnDef<Profile>[] = [
  {
    accessorKey: "profile_id",
    header: "Profile ID",
  },
  {
    accessorKey: "full_name",
     header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "created_at",
    header: "Date Created",
    cell: ({ row }) => {
      const dateValue = row.original.created_at;

      if (!dateValue) return "N/A";

      return new Date(dateValue.replace(" ", "T"))
        .toLocaleString("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " at");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell profile={row.original} />,
  },
];
