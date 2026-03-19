export const mockDataFiles = {
  companies: "mock-data/companies.json",
  experts: "mock-data/experts.json",
  fields: "mock-data/fields.json",
  projects: "mock-data/projects.json",
  students: "mock-data/students.json",
  studyPrograms: "mock-data/study-programs.json",
  supervisors: "mock-data/supervisors.json",
  topics: "mock-data/topics.json",
  universities: "mock-data/universities.json",
} as const;

export type MockDataFile = (typeof mockDataFiles)[keyof typeof mockDataFiles];
