"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

interface StudyGroup {
  id: string;
  name: string;
  inviteCode: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  members: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }[];
}

interface StudyGroupsData {
  adminOf: StudyGroup[];
  memberOf: StudyGroup[];
}

export function StudyGroups() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studyGroups, setStudyGroups] = useState<StudyGroupsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState<string | null>(null);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string>("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("StudyGroups - User is not authenticated");
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      console.log("StudyGroups - User is authenticated:", session.user.email);
      fetchStudyGroups();
    }
  }, [status, session, router]);

  const fetchStudyGroups = async () => {
    try {
      console.log("StudyGroups - Fetching study groups...");
      const response = await fetch("/api/study-groups", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include credentials
      });

      console.log("StudyGroups - Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("StudyGroups - Fetch error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData?.error || `Failed to fetch study groups (${response.status})`);
      }

      const data = await response.json();
      console.log("StudyGroups - Data received:", data);
      setStudyGroups(data);
    } catch (err) {
      console.error("StudyGroups - Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while fetching study groups");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      console.log("StudyGroups - Creating group:", newGroupName);
      const response = await fetch("/api/study-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include credentials
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      console.log("StudyGroups - Create response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("StudyGroups - Create error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData?.error || `Failed to create study group (${response.status})`);
      }

      const newGroup = await response.json();
      console.log("StudyGroups - Group created:", newGroup);
      
      setStudyGroups((prev) => ({
        adminOf: [...(prev?.adminOf || []), newGroup],
        memberOf: prev?.memberOf || [],
      }));
      setNewGroupName("");
      setShowInviteCode(newGroup.inviteCode);
    } catch (err) {
      console.error("StudyGroups - Create error:", err);
      setError(err instanceof Error ? err.message : "An error occurred while creating the study group");
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
  };

  const handleLeaveGroup = async (groupId: string, isAdmin: boolean) => {
    const group = studyGroups?.adminOf?.find(g => g.id === groupId);
    const hasOtherMembers = group?.members?.some(member => member.id !== group.admin?.id) ?? false;
    
    if (isAdmin && !selectedNewAdmin && hasOtherMembers) {
      setShowLeaveDialog(groupId);
      return;
    }

    setIsLeaving(true);
    try {
      const response = await fetch(`/api/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isAdmin ? { newAdminId: selectedNewAdmin } : {}),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // Update local state
      setStudyGroups(prev => {
        if (!prev) return null;
        return {
          adminOf: prev.adminOf.filter(g => g.id !== groupId),
          memberOf: prev.memberOf.filter(g => g.id !== groupId),
        };
      });

      toast.success('Successfully left the study group');
      setShowLeaveDialog(null);
      setSelectedNewAdmin("");
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to leave group');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleEditGroupName = async (groupId: string) => {
    if (!newGroupName.trim()) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/study-groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const updatedGroup = await response.json();
      
      // Update local state
      setStudyGroups(prev => {
        if (!prev) return null;
        return {
          adminOf: prev.adminOf.map(g => g.id === groupId ? updatedGroup : g),
          memberOf: prev.memberOf.map(g => g.id === groupId ? updatedGroup : g),
        };
      });

      toast.success('Group name updated successfully');
      setShowEditDialog(null);
      setNewGroupName("");
    } catch (error) {
      console.error('Error updating group name:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update group name');
    } finally {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return <div className="text-[var(--foreground)]">Loading study groups...</div>;
  }

  return (
    <div className="space-y-12">
      {/* Create Group Form */}
      <div className="flex justify-center">
        <div className="bg-[var(--paper)] rounded-lg p-6 border-2 border-[var(--deep-golden)] w-fit">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
            Create New Study Group
          </h2>
          <form onSubmit={handleCreateGroup} className="space-y-3 min-w-[300px]">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Study Group Name
              </label>
              <input
                type="text"
                id="name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--muted)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--deep-golden)]"
                placeholder="Enter study group name"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[var(--deep-golden)] text-[var(--paper)] py-2 px-4 rounded-md hover:bg-[var(--deep-golden)]/90 transition-colors"
            >
              Create Study Group
            </button>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}

      {/* Invite Code Display */}
      {showInviteCode && (
        <div className="bg-[var(--paper)] rounded-lg p-6 border-2 border-[var(--deep-golden)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Study Group Created!
          </h3>
          <p className="text-sm text-[var(--foreground)] mb-3">
            Share this invite link with others to join your study group:
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-[var(--background)] px-3 py-2 rounded text-sm flex-grow overflow-x-auto">
              {`${window.location.origin}/invite/${showInviteCode}`}
            </code>
            <button
              onClick={() => copyInviteLink(showInviteCode)}
              className="btn-primary whitespace-nowrap text-sm px-3"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setShowInviteCode(null)}
            className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] mt-3"
          >
            Close
          </button>
        </div>
      )}

      {/* Study Groups List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)] text-center">
          Your Study Groups
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const adminGroupIds = new Set(studyGroups?.adminOf?.map(group => group.id) || []);
            const allGroups = [
              ...(studyGroups?.adminOf || []),
              ...(studyGroups?.memberOf?.filter(group => !adminGroupIds.has(group.id)) || [])
            ];

            return allGroups.map((group) => {
              const isAdmin = adminGroupIds.has(group.id);
              const otherMembers = group.members.filter(member => member.id !== group.admin.id);
              
              return (
                <div key={group.id} className="bg-[var(--paper)] rounded-lg p-6 border-2 border-[var(--deep-golden)]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-[var(--foreground)]">
                          {group.name}
                        </h3>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNewGroupName(group.name);
                              setShowEditDialog(group.id);
                            }}
                            className="h-8 w-8 text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--deep-golden)]/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {isAdmin && (
                        <span className="bg-[var(--deep-golden)] text-[var(--paper)] px-2 py-1 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={group.admin} size={24} />
                      <span className="text-sm text-[var(--foreground)]">
                        Admin: {group.admin?.name || group.admin?.email || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.members
                        ?.filter(member => member.id !== group.admin?.id)
                        .slice(0, 3)
                        .map((member) => (
                          <div key={member.id} className="flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded-full border border-[var(--muted)]">
                            <UserAvatar user={member} size={20} />
                            <span className="text-xs text-[var(--foreground)]">
                              {member.name || member.email.split('@')[0]}
                            </span>
                          </div>
                        ))}
                      {group.members?.filter(member => member.id !== group.admin?.id).length > 3 && (
                        <div className="flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded-full border border-[var(--muted)]">
                          <div className="w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs text-[var(--foreground)]">
                            +{group.members.filter(member => member.id !== group.admin?.id).length - 3}
                          </div>
                          <span className="text-xs text-[var(--foreground)]">more</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-[var(--foreground)] block mb-3">
                      {group.members?.length || 0} {group.members?.length === 1 ? 'member' : 'members'}
                    </span>
                    <div className="space-y-2">
                      <Link href={`/dashboard/study/${group.id}`} className="w-full">
                        <Button 
                          variant="default" 
                          className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
                        >
                          Study Room
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Button
                          onClick={() => copyInviteLink(group.inviteCode)}
                          variant="outline"
                          className="w-full border-[var(--deep-golden)] text-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/10"
                        >
                          Copy Invite Link
                        </Button>
                      )}
                      <Button
                        onClick={() => handleLeaveGroup(group.id, isAdmin)}
                        variant="outline"
                        className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                        disabled={isLeaving}
                      >
                        {isLeaving ? 'Leaving...' : 'Leave Group'}
                      </Button>
                    </div>
                  </div>

                  {/* Edit Group Name Dialog */}
                  <Dialog open={showEditDialog === group.id} onOpenChange={(open) => !open && setShowEditDialog(null)}>
                    <DialogContent className="bg-[var(--paper)] border-[var(--deep-golden)]">
                      <DialogHeader>
                        <DialogTitle className="text-[var(--foreground)]">Edit Group Name</DialogTitle>
                        <DialogDescription className="text-[var(--foreground)]/70">
                          Enter a new name for your study group
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter new group name"
                          className="bg-[var(--background)] border-[var(--deep-golden)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/50"
                          disabled={isEditing}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(null)}
                            className="border-[var(--deep-golden)] text-[var(--deep-golden)]"
                            disabled={isEditing}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleEditGroupName(group.id)}
                            disabled={!newGroupName.trim() || isEditing}
                            className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
                          >
                            {isEditing ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Leave Group Dialog */}
                  <Dialog open={showLeaveDialog === group.id} onOpenChange={(open) => !open && setShowLeaveDialog(null)}>
                    <DialogContent className="bg-[var(--paper)] border-[var(--deep-golden)]">
                      <DialogHeader>
                        <DialogTitle className="text-[var(--foreground)]">Leave Study Group</DialogTitle>
                        <DialogDescription className="text-[var(--foreground)]/70">
                          {otherMembers.length > 0 
                            ? "You are the admin of this group. Please select a new admin before leaving."
                            : "Are you sure you want to leave this study group?"}
                        </DialogDescription>
                      </DialogHeader>
                      {otherMembers.length > 0 ? (
                        <div className="space-y-4">
                          <Select
                            value={selectedNewAdmin}
                            onValueChange={setSelectedNewAdmin}
                          >
                            <SelectTrigger className="bg-[var(--background)] border-[var(--deep-golden)] text-[var(--foreground)]">
                              <SelectValue placeholder="Select new admin" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--paper)] border-[var(--deep-golden)]">
                              {otherMembers.map((member) => (
                                <SelectItem 
                                  key={member.id} 
                                  value={member.id}
                                  className="text-[var(--foreground)] hover:bg-[var(--deep-golden)]/10"
                                >
                                  {member.name || member.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowLeaveDialog(null)}
                              className="border-[var(--deep-golden)] text-[var(--deep-golden)]"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleLeaveGroup(group.id, true)}
                              disabled={!selectedNewAdmin || isLeaving}
                              className="bg-red-500 hover:bg-red-500/90 text-white"
                            >
                              {isLeaving ? 'Leaving...' : 'Leave Group'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowLeaveDialog(null)}
                            className="border-[var(--deep-golden)] text-[var(--deep-golden)]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleLeaveGroup(group.id, true)}
                            disabled={isLeaving}
                            className="bg-red-500 hover:bg-red-500/90 text-white"
                          >
                            {isLeaving ? 'Leaving...' : 'Delete Group'}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              );
            });
          })()}
        </div>

        {/* No Groups Message */}
        {(!studyGroups?.adminOf?.length && !studyGroups?.memberOf?.length) && (
          <div className="text-center space-y-4">
            <p className="text-[var(--foreground)] text-lg">
              You haven't joined any study groups yet.
            </p>
            <p className="text-[var(--foreground)]">
              Create a new study group or ask for an invite link to join one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 