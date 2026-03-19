import { readFile } from "node:fs/promises";
import path from "node:path";

export type TopicRecord = {
  id: string;
  title: string;
  description: string;
  type: string;
  employment: string;
  employmentType: string | null;
  workplaceType: string | null;
  degrees: string[];
  fieldIds: string[];
  companyId: string | null;
  universityId: string | null;
  supervisorIds: string[];
  expertIds: string[];
};

export type UniversityRecord = {
  id: string;
  name: string;
  country: string;
  domains: string[];
  about: string | null;
};

export type SupervisorRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  universityId: string;
  researchInterests: string[];
  about: string | null;
  objectives: string[];
  fieldIds: string[];
};

export type FieldRecord = {
  id: string;
  name: string;
};

export type CompanyRecord = {
  id: string;
  name: string;
  description: string;
  about: string;
  size: string;
  domains: string[];
};

const cache = new Map<string, unknown>();

async function readJsonFile<T>(filename: string): Promise<T> {
  if (cache.has(filename)) {
    return cache.get(filename) as T;
  }
  const filePath = path.resolve(process.cwd(), "mock-data", filename);
  const fileContent = await readFile(filePath, "utf8");
  const data = JSON.parse(fileContent) as T;
  cache.set(filename, data);
  return data;
}

export async function getTopics() {
  return readJsonFile<TopicRecord[]>("topics.json");
}

export async function getUniversities() {
  return readJsonFile<UniversityRecord[]>("universities.json");
}

export async function getSupervisors() {
  return readJsonFile<SupervisorRecord[]>("supervisors.json");
}

export async function getFields() {
  return readJsonFile<FieldRecord[]>("fields.json");
}

export async function getCompanies() {
  return readJsonFile<CompanyRecord[]>("companies.json");
}
