'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Study, Question, StudyGroup } from '@/generated/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateStudyDialog } from './create-study-dialog';
import { QuestionAnswers } from '@/components/QuestionAnswers';
import { BookOpen } from 'lucide-react';
import { FirstTimeStudyDialog } from './first-time-study-dialog';

interface StudyWithQuestions extends Study {
  questions: Question[];
}

interface StudyGroupWithStudy extends StudyGroup {
  studies: StudyWithQuestions[];
  admin: {
    id: string;
  };
}

function getBibleBookAbbreviation(bookName: string): string {
  const abbreviations: { [key: string]: string } = {
    'Genesis': 'GEN',
    'Exodus': 'EXO',
    'Leviticus': 'LEV',
    'Numbers': 'NUM',
    'Deuteronomy': 'DEU',
    'Joshua': 'JOS',
    'Judges': 'JDG',
    'Ruth': 'RUT',
    '1 Samuel': '1SA',
    '2 Samuel': '2SA',
    '1 Kings': '1KI',
    '2 Kings': '2KI',
    '1 Chronicles': '1CH',
    '2 Chronicles': '2CH',
    'Ezra': 'EZR',
    'Nehemiah': 'NEH',
    'Esther': 'EST',
    'Job': 'JOB',
    'Psalms': 'PSA',
    'Proverbs': 'PRO',
    'Ecclesiastes': 'ECC',
    'Song of Solomon': 'SNG',
    'Isaiah': 'ISA',
    'Jeremiah': 'JER',
    'Lamentations': 'LAM',
    'Ezekiel': 'EZK',
    'Daniel': 'DAN',
    'Hosea': 'HOS',
    'Joel': 'JOL',
    'Amos': 'AMO',
    'Obadiah': 'OBA',
    'Jonah': 'JON',
    'Micah': 'MIC',
    'Nahum': 'NAM',
    'Habakkuk': 'HAB',
    'Zephaniah': 'ZEP',
    'Haggai': 'HAG',
    'Zechariah': 'ZEC',
    'Malachi': 'MAL',
    'Matthew': 'MAT',
    'Mark': 'MRK',
    'Luke': 'LUK',
    'John': 'JHN',
    'Acts': 'ACT',
    'Romans': 'ROM',
    '1 Corinthians': '1CO',
    '2 Corinthians': '2CO',
    'Galatians': 'GAL',
    'Ephesians': 'EPH',
    'Philippians': 'PHP',
    'Colossians': 'COL',
    '1 Thessalonians': '1TH',
    '2 Thessalonians': '2TH',
    '1 Timothy': '1TI',
    '2 Timothy': '2TI',
    'Titus': 'TIT',
    'Philemon': 'PHM',
    'Hebrews': 'HEB',
    'James': 'JAS',
    '1 Peter': '1PE',
    '2 Peter': '2PE',
    '1 John': '1JN',
    '2 John': '2JN',
    '3 John': '3JN',
    'Jude': 'JUD',
    'Revelation': 'REV'
  };
  return abbreviations[bookName] || bookName;
}

export default function StudyPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [studyGroup, setStudyGroup] = useState<StudyGroupWithStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFirstTimeDialog, setShowFirstTimeDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchStudyGroup = async () => {
      try {
        const response = await fetch(`/api/study-groups/${params.groupId}`);
        if (!response.ok) throw new Error('Failed to fetch study group');
        const data = await response.json();
        setStudyGroup(data);
        // Check if the current user is the admin using the database user ID
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) throw new Error('Failed to fetch user');
        const userData = await userResponse.json();
        setIsAdmin(userData.id === data.admin.id);

        // Check if this is the first time viewing this study
        const currentStudy = data.studies.find((study: Study) => study.isCurrent);
        if (currentStudy) {
          const studyKey = `study_${currentStudy.id}_viewed`;
          const hasViewed = localStorage.getItem(studyKey);
          if (!hasViewed) {
            setShowFirstTimeDialog(true);
            localStorage.setItem(studyKey, 'true');
          }
        }
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

  const currentStudy = studyGroup.studies.find(study => study.isCurrent);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 min-h-screen bg-[var(--background)]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-12 bg-[var(--paper)] rounded-xl p-6 shadow-md border border-[var(--muted)]">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
            {studyGroup.name}
          </h1>
          {currentStudy && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="bg-[var(--paper)] hover:bg-[var(--deep-golden)] hover:text-[var(--paper)] border-[var(--muted)] text-[var(--foreground)] transition-colors"
              >
                <a 
                  href={`https://www.bible.com/bible/111/${getBibleBookAbbreviation(currentStudy.bibleBook)}.${currentStudy.bibleChapter}.NIV`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="text-lg sm:text-xl font-medium">
                    {currentStudy.bibleBook} {currentStudy.bibleChapter}
                  </span>
                </a>
              </Button>
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
        <>
          <FirstTimeStudyDialog
            open={showFirstTimeDialog}
            onOpenChange={setShowFirstTimeDialog}
            bibleBook={currentStudy.bibleBook}
            bibleChapter={currentStudy.bibleChapter}
          />
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
        </>
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