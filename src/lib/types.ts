// Shapes returned by nano-syllabus-server (internal/store).

export type User = {
  id: number;
  email: string;
  name: string;
  role?: 'student' | 'teacher' | 'admin';
  /** false until the onboarding step is done (name + answer language). */
  onboarded?: boolean;
  languagePref?: 'EN' | 'RN';
  /** The program picked on Explore Courses ("bei"), or "" before that. */
  program?: string;
};

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

/** One syllabus topic of a unit; soon = no lesson yet. */
export type Topic = { id: string; title: string; soon?: boolean };

export type SubjectSummary = { slug: string; title: string; description: string; lessonCount: number; done: number; topics?: Topic[] };

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
  /** The syllabus topic it covers ("4.1"), for courses made in the toolkit. */
  topic?: string;
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

export type NextLesson = {
  lessonId: number;
  title: string;
  kind: LessonKind;
  durationSeconds: number;
  started: boolean;
  course: Ref;
  subject: Ref;
  subjectDone: number;
  subjectTotal: number;
};

export type Home = {
  courses: (CourseCard & { done: number })[];
  streak: number;
  completedToday: number;
  completedTotal: number;
  next: NextLesson[];
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

// ---- teachers (nano-syllabus-server internal/store/teach.go) ----

export type Role = 'student' | 'teacher' | 'admin';

export type Problem = { file: string; level: 'error' | 'warning'; message: string };

export type SubmissionStatus = 'building' | 'failed' | 'review' | 'approved' | 'rejected' | 'superseded';

export type Submission = {
  id: number;
  teacher: Ref; // slug = email, title = name
  courseSlug: string;
  courseTitle: string;
  status: SubmissionStatus;
  via: 'cli' | 'mcp' | 'rebuild';
  note: string;
  bytes: number;
  lessons: number;
  report: { ok?: boolean; errors?: Problem[]; warnings?: Problem[]; lessons?: { id: string; title: string; kind: LessonKind }[] } | null;
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string | null;
  builtAt: string | null;
  createdAt: string;
  previewUrl?: string;
  liveUrl?: string;
};

export type CourseVersion = {
  version: number;
  submissionId: number;
  live: boolean;
  lessons: number;
  note: string;
  via: string;
  toolkit: string;
  publishedBy: string;
  publishedAt: string;
};

export type VersionedCourse = { slug: string; title: string; liveVersion: number; waiting: number; versions: CourseVersion[] };

export type ApiToken = { id: number; name: string; hint: string; createdAt: string; lastUsedAt: string | null };

export type TeacherCourse = { slug: string; title: string; published: boolean; lessons: number; updatedAt: string };

export type TeachMe = { user: User; courses: TeacherCourse[]; submissions: Submission[]; site: string };

export type StaffMember = User & { courses: number; submissions: number; lastPush: string | null };

/** A built course as the server previews it (seed.Course). */
export type PreviewCourse = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: string;
  subjects: {
    slug: string;
    title: string;
    description: string;
    lessons: {
      slug: string;
      title: string;
      description: string;
      kind: LessonKind;
      videoUrl: string;
      posterUrl: string;
      moduleUrl: string;
      htmlUrl: string;
      cssUrls: string[] | null;
      durationSeconds: number;
    }[];
  }[];
};
