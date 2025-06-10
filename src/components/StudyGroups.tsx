"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";

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

  if (isLoading) {
    return <div className="text-[var(--foreground)]">Loading study groups...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Create Study Group Form */}
      <div className="bg-[var(--paper)] p-4 rounded-lg shadow-md max-w-xl mx-auto border-2 border-[var(--deep-golden)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 text-center">
          Create Study Group
        </h2>
        <form onSubmit={handleCreateGroup} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter study group name"
              className="flex-grow px-3 py-2 rounded-lg border-2 border-[var(--dark-tan)] focus:border-[var(--golden-yellow)] focus:ring-2 focus:ring-[var(--soft-yellow)]"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newGroupName.trim()}
              className="btn-primary whitespace-nowrap px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative max-w-xl mx-auto">
          {error}
        </div>
      )}

      {/* Invite Code Display */}
      {showInviteCode && (
        <div className="bg-[var(--paper)] p-4 rounded-lg shadow-md max-w-xl mx-auto">
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
      <div className="space-y-8">
        {/* Groups where user is admin */}
        {studyGroups?.adminOf && studyGroups.adminOf.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 text-center">
              Your Study Groups
            </h2>
            <div className="flex flex-col items-center gap-4">
              {studyGroups.adminOf.map((group) => (
                <div key={group.id} className="bg-[var(--paper)] rounded-lg p-4 border-2 border-[var(--deep-golden)] w-[300px]">
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3 text-center">
                    {group.name}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={group.admin} size={24} />
                      <span className="text-sm text-[var(--foreground)]">
                        Admin: {group.admin?.name || group.admin?.email || 'Unknown'}
                      </span>
                    </div>
                    <div className="space-y-2">
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
                      <span className="text-sm text-[var(--foreground)]">
                        {group.members?.length || 0} {group.members?.length === 1 ? 'disciple' : 'disciples'}
                      </span>
                    </div>
                    <button
                      onClick={() => copyInviteLink(group.inviteCode)}
                      className="btn-primary w-full text-sm"
                    >
                      Copy Invite Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups where user is a member */}
        {studyGroups?.memberOf && studyGroups.memberOf.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 text-center">
              Study Groups You're In
            </h2>
            <div className="flex flex-col items-center gap-4">
              {studyGroups.memberOf.map((group) => (
                <div key={group.id} className="bg-[var(--paper)] rounded-lg p-4 border-2 border-[var(--deep-golden)] w-[300px]">
                  <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3 text-center">
                    {group.name}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={group.admin} size={24} />
                      <span className="text-sm text-[var(--foreground)]">
                        Admin: {group.admin?.name || group.admin?.email || 'Unknown'}
                      </span>
                    </div>
                    <div className="space-y-2">
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
                      <span className="text-sm text-[var(--foreground)]">
                        {group.members?.length || 0} {group.members?.length === 1 ? 'disciple' : 'disciples'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No groups message */}
        {(!studyGroups?.adminOf?.length && !studyGroups?.memberOf?.length) && (
          <div className="text-center text-[var(--foreground)] py-8">
            <p className="text-lg">
              You haven't created or joined any study groups yet.
            </p>
            <p className="mt-2">
              Create a study group above or ask for an invite link to join one!
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 