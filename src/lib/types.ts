// Shapes returned by nano-syllabus-server (internal/store).

export type User = { id: number; email: string; name: string };

export type CourseCard = {
  slug: string;
  title: string;
  tagline: string;
  coverUrl: string;
  level: string;
  pricePaisa: number;
  subjectCount: number;
  lessonCount: number;
};

export type SubjectSummary = { slug: string; title: string; description: string; lessonCount: number; done: number };

export type CourseDetail = CourseCard & {
  description: string;
  updatedAt: string;
  subjects: SubjectSummary[];
  owned: boolean;
};

export type LessonKind = 'video' | 'interactive' | 'article';

export type LessonSummary = {
  id: number;
  slug: string;
  title: string;
  kind: LessonKind;
  durationSeconds: number;
  isPreview: boolean;
  completed: boolean;
  positionSeconds: number;
};

export type Ref = { slug: string; title: string };

export type SubjectDetail = {
  slug: string;
  title: string;
  description: string;
  course: Ref;
  owned: boolean;
  lessons: LessonSummary[];
};

export type Lesson = LessonSummary & {
  description: string;
  videoUrl?: string;
  posterUrl?: string;
  contentRef?: string;
  /** Interactive lesson from a content release: an ES module (see src/content/host.ts). */
  moduleUrl?: string;
  /** Article lesson: pre-rendered HTML. */
  htmlUrl?: string;
  cssUrls?: string[];
  locked: boolean;
  course: Ref;
  subject: Ref;
  prevId: number | null;
  nextId: number | null;
};

export type Home = {
  courses: (CourseCard & { done: number })[];
  continue: {
    lessonId: number;
    title: string;
    kind: LessonKind;
    positionSeconds: number;
    durationSeconds: number;
    course: Ref;
    subject: Ref;
  } | null;
};

export type Checkout = {
  provider: 'esewa' | 'khalti';
  method: 'POST' | 'GET';
  url: string;
  fields?: Record<string, string>;
  orderId: string;
};
