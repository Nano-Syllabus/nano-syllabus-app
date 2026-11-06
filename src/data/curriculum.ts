// Programs shown on /app/topics, semester by semester. They come from the
// server (GET /api/programs: programs/*.json pushed from the toolkit by an
// admin); PROGRAMS below is only the fallback until the first such push.
// Fallback source:
// https://ioe.tu.edu.np/pages/electronics-engineering-curriculum-structure-2660
// (read 2026-11-05). Projects and the internship are left out: they are not
// taught subjects. `course` names the catalogue course that teaches a subject;
// a subject without one, or whose course has no lessons yet, shows "Coming soon".

import { useQuery } from '../lib/api';

export type CurriculumSubject = { code: string; title: string; course?: string };
export type Semester = { no: number; part: string; subjects: CurriculumSubject[] };
export type Program = {
  slug: string;
  short: string;
  name: string;
  university: string;
  level: 'Bachelor' | 'Master' | 'Diploma' | string;
  years: number;
  icon?: 'chip' | 'code' | string;
  /** Listed on Explore but not open yet. */
  soon?: boolean;
  semesters: Semester[];
};

export const PROGRAMS: Program[] = [
  {
    slug: 'bei',
    short: 'BEI',
    name: 'Bachelor in Electronics, Communication and Information Engineering',
    university: 'IOE',
    level: 'Bachelor',
    years: 4,
    icon: 'chip',
    semesters: [
      {
        no: 1,
        part: 'Year I · Part I',
        subjects: [
          { code: 'ENSH 101', title: 'Engineering Mathematics I' },
          { code: 'ENSH 102', title: 'Engineering Physics', course: 'physics-ioe' },
          { code: 'ENCT 101', title: 'Computer Programming' },
          { code: 'ENME 101', title: 'Engineering Drawing' },
          { code: 'ENEX 101', title: 'Fundamental of Electrical and Electronics Engineering' },
          { code: 'ENME 106', title: 'Engineering Workshop' },
        ],
      },
      {
        no: 2,
        part: 'Year I · Part II',
        subjects: [
          { code: 'ENSH 151', title: 'Engineering Mathematics II' },
          { code: 'ENCT 151', title: 'Object Oriented Programming' },
          { code: 'ENEX 151', title: 'Electronic Device and Circuits' },
          { code: 'ENEX 152', title: 'Digital Logic' },
          { code: 'ENEE 154', title: 'Electrical Circuits and Machines', course: 'electrical-machines' },
          { code: 'ENSH 153', title: 'Engineering Chemistry' },
        ],
      },
      {
        no: 3,
        part: 'Year II · Part I',
        subjects: [
          { code: 'ENSH 201', title: 'Engineering Mathematics III' },
          { code: 'ENSH 204', title: 'Communication English' },
          { code: 'ENCT 201', title: 'Computer Graphics and Visualization' },
          { code: 'ENEX 201', title: 'Microprocessors' },
          { code: 'ENEX 202', title: 'Advanced Electronics' },
          { code: 'ENEE 204', title: 'Control System' },
        ],
      },
      {
        no: 4,
        part: 'Year II · Part II',
        subjects: [
          { code: 'ENSH 252', title: 'Numerical Methods' },
          { code: 'ENCT 251', title: 'Discrete Structure' },
          { code: 'ENEX 252', title: 'Instrumentation' },
          { code: 'ENEX 253', title: 'Computer Organization & Architecture' },
          { code: 'ENEX 254', title: 'Electromagnetics' },
          { code: 'ENEX 255', title: 'Signals and Systems' },
        ],
      },
      {
        no: 5,
        part: 'Year III · Part I',
        subjects: [
          { code: 'ENSH 304', title: 'Probability and Statistics' },
          { code: 'ENCT 305', title: 'Artificial Intelligence' },
          { code: 'ENEX 301', title: 'Filter Design' },
          { code: 'ENEX 302', title: 'Embedded Systems' },
          { code: 'ENEX 303', title: 'Propagation and Antenna' },
          { code: 'ENEX 325-344', title: 'Elective I' },
        ],
      },
      {
        no: 6,
        part: 'Year III · Part II',
        subjects: [
          { code: 'ENCT 355', title: 'ICT Project Management' },
          { code: 'ENCE 356', title: 'Engineering Economics' },
          { code: 'ENEX 351', title: 'Communication Systems' },
          { code: 'ENEX 352', title: 'Telecommunication and Computer Networks' },
          { code: 'ENEX 385-399', title: 'Elective II' },
        ],
      },
      {
        no: 7,
        part: 'Year IV · Part I',
        subjects: [
          { code: 'ENEX 411', title: 'RF and Microwave Engineering' },
          { code: 'ENEX 412', title: 'Robotics' },
          { code: 'ENEX 413', title: 'Digital Signal Processing' },
          { code: 'ENEX 415', title: 'Wireless Communication' },
          { code: 'ENEX 435-444', title: 'Elective III' },
        ],
      },
      {
        no: 8,
        part: 'Year IV · Part II',
        subjects: [
          { code: 'ENEX 463', title: 'Energy, Environment and Social Engineering' },
          { code: 'ENEX 465-484', title: 'Elective IV' },
        ],
      },
    ],
  },
  {
    slug: 'bct',
    short: 'BCT',
    name: 'Bachelor in Computer Engineering',
    university: 'IOE',
    level: 'Bachelor',
    years: 4,
    icon: 'code',
    soon: true,
    semesters: [],
  },
];

export const UNIVERSITIES = ['IOE', 'KU', 'TU', 'Pokhara University', 'Other Universities'];
export const LEVELS: { id: Program['level']; label: string }[] = [
  { id: 'Bachelor', label: 'Bachelor (BE/BSc)' },
  { id: 'Master', label: 'Master (MSc)' },
  { id: 'Diploma', label: 'Diploma' },
];

/** Every course a program links to (so the page knows which ones to load). */
const norm = (t: string) => t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
/** The course that teaches a subject: the one the programme names, else a catalogue course with the
 *  subject's name (a teacher course published as "Computer Programming" / computer-programming). */
export function subjectCourse<C extends { slug: string; title: string }>(x: CurriculumSubject, courses: Map<string, C>): C | undefined {
  if (x.course) return courses.get(x.course);
  const want = norm(x.title);
  for (const c of courses.values()) if (norm(c.title) === want || norm(c.slug) === want) return c;
  return undefined;
}
export const linkedCourses = (p: Program) => p.semesters.flatMap((s) => s.subjects.flatMap((x) => (x.course ? [x.course] : [])));

/** The programmes to show: the server's (pushed from the toolkit), else the
 *  fallback above. Cache-first like every other query. */
export function usePrograms(): Program[] {
  const { data } = useQuery<{ programs: Program[] }>('programs', '/api/programs');
  const list = data?.programs?.filter((p) => p && p.slug && Array.isArray(p.semesters));
  return list?.length ? list : PROGRAMS;
}
