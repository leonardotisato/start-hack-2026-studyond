import { promises as fs } from "fs";
import path from "path";
import type {
  University,
  StudyProgram,
  Field,
  Student,
  Supervisor,
  Company,
  Expert,
  Topic,
  ThesisProject,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "..", "mock-data");

async function load<T>(filename: string): Promise<T[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw) as T[];
}

async function save<T>(filename: string, data: T[]): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function findById<T extends { id: string }>(filename: string, id: string): Promise<T | null> {
  const items = await load<T>(filename);
  return items.find((item) => item.id === id) ?? null;
}

async function update<T extends { id: string }>(filename: string, id: string, patch: Partial<T>): Promise<T | null> {
  const items = await load<T>(filename);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = { ...items[index], ...patch };
  items[index] = updated;
  await save(filename, items);
  return updated;
}

async function create<T extends { id: string }>(filename: string, item: T): Promise<T> {
  const items = await load<T>(filename);
  items.push(item);
  await save(filename, items);
  return item;
}

async function remove<T extends { id: string }>(filename: string, id: string): Promise<boolean> {
  const items = await load<T>(filename);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  await save(filename, filtered);
  return true;
}

// -- Universities --
export const getUniversities = () => load<University>("universities.json");
export const getUniversity = (id: string) => findById<University>("universities.json", id);

// -- Study Programs --
export const getStudyPrograms = () => load<StudyProgram>("study-programs.json");
export const getStudyProgram = (id: string) => findById<StudyProgram>("study-programs.json", id);

// -- Fields --
export const getFields = () => load<Field>("fields.json");
export const getField = (id: string) => findById<Field>("fields.json", id);

// -- Students --
export const getStudents = () => load<Student>("students.json");
export const getStudent = (id: string) => findById<Student>("students.json", id);
export const updateStudent = (id: string, patch: Partial<Student>) => update<Student>("students.json", id, patch);
export const createStudent = (student: Student) => create<Student>("students.json", student);

// -- Supervisors --
export const getSupervisors = () => load<Supervisor>("supervisors.json");
export const getSupervisor = (id: string) => findById<Supervisor>("supervisors.json", id);

// -- Companies --
export const getCompanies = () => load<Company>("companies.json");
export const getCompany = (id: string) => findById<Company>("companies.json", id);

// -- Experts --
export const getExperts = () => load<Expert>("experts.json");
export const getExpert = (id: string) => findById<Expert>("experts.json", id);

// -- Topics --
export const getTopics = () => load<Topic>("topics.json");
export const getTopic = (id: string) => findById<Topic>("topics.json", id);

// -- Projects --
export const getProjects = () => load<ThesisProject>("projects.json");
export const getProject = (id: string) => findById<ThesisProject>("projects.json", id);
export const updateProject = (id: string, patch: Partial<ThesisProject>) => update<ThesisProject>("projects.json", id, patch);
export const createProject = (project: ThesisProject) => create<ThesisProject>("projects.json", project);
export const deleteProject = (id: string) => remove<ThesisProject>("projects.json", id);
