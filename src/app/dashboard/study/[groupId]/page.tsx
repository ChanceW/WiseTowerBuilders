'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Study, Question, StudyGroup } from '@/generated/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateStudyDialog } from './create-study-dialog';

interface StudyWithQuestions extends Study {
  questions: Question[];
}

interface StudyGroupWithStudy extends StudyGroup {
  studies: StudyWithQuestions[];
  admin: {
    id: string;
  };
}

export default function StudyPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [studyGroup, setStudyGroup] = useState<StudyGroupWithStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const fetchStudyGroup = async () => {
      try {
        const response = await fetch(`/api/study-groups/${params.groupId}`);
        if (!response.ok) throw new Error('Failed to fetch study group');
        const data = await response.json();
        setStudyGroup(data);
      } catch (error) {
        console.error('Error fetching study group:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.groupId) {
      fetchStudyGroup();
    }
  }, [params.groupId]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!studyGroup) {
    return <div className="flex justify-center items-center min-h-screen">Study group not found</div>;
  }

  const isAdmin = session?.user?.id === studyGroup.admin.id;
  const currentStudy = studyGroup.studies.find(study => study.isCurrent);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{studyGroup.name} - Study</h1>
        {isAdmin && !currentStudy && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
          >
            Create New Study
          </Button>
        )}
      </div>

      {currentStudy ? (
        <div className="space-y-6">
          {currentStudy.questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>Discussion Question</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Context:</h3>
                    <p className="text-gray-700">{question.context}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Discussion:</h3>
                    <p className="text-gray-700">{question.discussion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          {isAdmin ? (
            <p className="text-gray-600 mb-4">No current study exists. Create one to get started!</p>
          ) : (
            <p className="text-gray-600">No current study exists for this group.</p>
          )}
        </div>
      )}

      <CreateStudyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        studyGroupId={studyGroup.id}
        onStudyCreated={() => {
          // Refresh the page data
          window.location.reload();
        }}
      />
    </div>
  );
} 