'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Study, Question, StudyGroup } from '@/generated/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateStudyDialog } from './create-study-dialog';
import { QuestionAnswers } from '@/components/QuestionAnswers';

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
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 min-h-screen bg-[var(--background)]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-12 bg-[var(--paper)] rounded-xl p-6 shadow-md border border-[var(--muted)]">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            {studyGroup.name}
          </h1>
          {currentStudy && (
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl text-[var(--foreground)] font-medium">
                {currentStudy.bibleBook}
              </span>
              <span className="text-[var(--deep-golden)] font-semibold">Chapter {currentStudy.bibleChapter}</span>
            </div>
          )}
        </div>
        {isAdmin && !currentStudy && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="w-full sm:w-auto bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-white text-base py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Create New Study
          </Button>
        )}
      </div>

      {currentStudy ? (
        <div className="space-y-6 sm:space-y-8">
          {currentStudy.questions.map((question, index) => (
            <Card 
              key={question.id} 
              className="w-full bg-[var(--paper)] border-[var(--muted)] shadow-md hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="px-6 py-5 border-b border-[var(--muted)] bg-[var(--paper)]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--deep-golden)] text-white font-semibold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-[var(--foreground)]">Discussion Question</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-6 bg-[var(--paper)]">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base sm:text-lg text-[var(--foreground)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep-golden)]"></span>
                      Principle
                    </h3>
                    <p className="text-[var(--foreground)] capitalize text-sm sm:text-base leading-relaxed">
                      {question.principle}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base sm:text-lg text-[var(--foreground)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep-golden)]"></span>
                      Context
                    </h3>
                    <p className="text-[var(--foreground)] text-sm sm:text-base leading-relaxed">
                      {question.context}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base sm:text-lg text-[var(--foreground)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--deep-golden)]"></span>
                      Discussion
                    </h3>
                    <p className="text-[var(--foreground)] text-sm sm:text-base leading-relaxed">
                      {question.discussion}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-[var(--muted)]">
                    <QuestionAnswers questionId={question.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-[var(--paper)] rounded-xl p-8 shadow-md border border-[var(--muted)]">
          {isAdmin ? (
            <div className="space-y-4">
              <p className="text-[var(--foreground)] text-sm sm:text-base mb-4">
                No current study exists. Create one to get started!
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-white text-base py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create New Study
              </Button>
            </div>
          ) : (
            <p className="text-[var(--foreground)] text-sm sm:text-base">
              No current study exists for this group.
            </p>
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