import { z } from 'zod';
import { ObjectId } from 'mongodb';

// User Roles
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

// School Schema
export const SchoolSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  slug: z.string(), // unique identifier for URLs e.g. 'my-school'
  address: z.string().optional(),
  contactEmail: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type School = z.infer<typeof SchoolSchema>;

// User Schema
export const UserSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email(),
  password: z.string(), // hashed
  name: z.string(),
  role: z.enum([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]),
  schoolId: z.string(),
  classId: z.string().optional(), // for students
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;

// Class Schema
export const ClassSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  level: z.string(), // Primary 1-5, JSS 1-3, SS 1-3
  schoolId: z.string(),
  description: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Class = z.infer<typeof ClassSchema>;

// Learning Resource Schema
export const ResourceSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  subject: z.string(),
  classId: z.string(),
  schoolId: z.string(),
  term: z.string(), // Term 1, 2, 3
  content: z.string(), // extracted text from file
  originalFileName: z.string(),
  fileType: z.enum(['pdf', 'docx', 'ppt', 'text']),
  vectorIds: z.array(z.string()).optional(), // for RAG indexing
  uploadedBy: z.string(), // userId
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Resource = z.infer<typeof ResourceSchema>;

// Syllabus Schema
export const SyllabusSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  subject: z.string(),
  classId: z.string(),
  schoolId: z.string(),
  term: z.string(),
  topics: z.array(
    z.object({
      name: z.string(),
      weightage: z.number().min(0).max(100),
    })
  ),
  content: z.string(),
  uploadedBy: z.string(), // userId
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Syllabus = z.infer<typeof SyllabusSchema>;

// Chat Message Schema
export const ChatMessageSchema = z.object({
  _id: z.string().optional(),
  sessionId: z.string(),
  userId: z.string(),
  classId: z.string(),
  subject: z.string(),
  userMessage: z.string(),
  aiResponse: z.string(),
  sourceResources: z.array(z.string()).optional(), // resourceIds used for RAG
  isVoiceInput: z.boolean().default(false),
  isVoiceOutput: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Assessment Schema
export const AssessmentSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  subject: z.string(),
  classId: z.string(),
  schoolId: z.string(),
  term: z.string(),
  generatedBy: z.string(), // userId (teacher)
  priorityTopics: z.array(z.string()),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']),
  questions: z.array(
    z.object({
      type: z.enum(['multiple_choice', 'short_answer', 'theory']),
      question: z.string(),
      options: z.array(z.string()).optional(), // for multiple choice
      correctAnswer: z.string().optional(),
      marks: z.number().optional(),
    })
  ),
  totalMarks: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

// Student Response to Assessment
export const AssessmentResponseSchema = z.object({
  _id: z.string().optional(),
  assessmentId: z.string(),
  studentId: z.string(),
  classId: z.string(),
  responses: z.array(
    z.object({
      questionIndex: z.number(),
      answer: z.string(),
      isCorrect: z.boolean().optional(),
      marksObtained: z.number().optional(),
    })
  ),
  totalMarksObtained: z.number().optional(),
  percentage: z.number().optional(),
  submittedAt: z.date().default(() => new Date()),
});

export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;

// School Settings (for voice, etc.)
export const SchoolSettingsSchema = z.object({
  _id: z.string().optional(),
  schoolId: z.string(),
  voiceEnabled: z.boolean().default(false),
  textToSpeechEnabled: z.boolean().default(false),
  classesWithVoiceAccess: z.array(z.string()).default([]),
  updatedAt: z.date().default(() => new Date()),
});

export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>;
