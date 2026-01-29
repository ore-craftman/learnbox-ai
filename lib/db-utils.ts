import { getDatabase } from './mongodb';
import { User, Class, Resource, Assessment, Syllabus, School } from './db-schemas';
import { ObjectId } from 'mongodb';

export async function createUser(user: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDatabase();
  const result = await db.collection('users').insertOne({
    ...user,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getUserByEmail(email: string) {
  const db = await getDatabase();
  return db.collection('users').findOne({ email });
}

export async function getUserById(userId: string) {
  const db = await getDatabase();
  return db.collection('users').findOne({ _id: new ObjectId(userId) });
}

export async function getClass(classId: string) {
  const db = await getDatabase();
  return db.collection('classes').findOne({ _id: new ObjectId(classId) });
}

export async function getClassesBySchool(schoolId: string) {
  const db = await getDatabase();
  return db.collection('classes').find({ schoolId }).toArray();
}

export async function createClass(classData: Omit<Class, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDatabase();
  const result = await db.collection('classes').insertOne({
    ...classData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getResourcesByClassAndSubject(classId: string, subject: string) {
  const db = await getDatabase();
  return db
    .collection('resources')
    .find({ classId, subject })
    .toArray();
}

export async function createResource(
  resourceData: Omit<Resource, '_id' | 'createdAt' | 'updatedAt'>
) {
  const db = await getDatabase();
  const result = await db.collection('resources').insertOne({
    ...resourceData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function createChatMessage(messageData: any) {
  const db = await getDatabase();
  const result = await db.collection('chat_messages').insertOne({
    ...messageData,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getChatHistory(sessionId: string) {
  const db = await getDatabase();
  return db
    .collection('chat_messages')
    .find({ sessionId })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function createAssessment(assessmentData: Omit<Assessment, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDatabase();

  // Ensure title is unique for this teacher
  const existing = await db.collection('assessments').findOne({
    title: assessmentData.title,
    generatedBy: assessmentData.generatedBy
  });

  if (existing) {
    throw new Error('Assessment with this title already exists. Please choose a different title.');
  }

  const result = await db.collection('assessments').insertOne({
    ...assessmentData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getAssessmentsByClass(classId: string, subject: string) {
  const db = await getDatabase();
  return db
    .collection('assessments')
    .find({ classId, subject })
    .toArray();
}

export async function getAssessmentById(assessmentId: string) {
  const db = await getDatabase();
  try {
    return await db.collection('assessments').findOne({ _id: new ObjectId(assessmentId) });
  } catch (error) {
    return null; // Invalid ID format
  }
}

export async function getAssessmentsByTeacher(teacherId: string) {
  const db = await getDatabase();
  return db
    .collection('assessments')
    .find({ generatedBy: teacherId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getSchoolSettings(schoolId: string) {
  const db = await getDatabase();
  return db.collection('school_settings').findOne({ schoolId });
}

export async function updateSchoolSettings(schoolId: string, settings: any) {
  const db = await getDatabase();
  return db.collection('school_settings').updateOne(
    { schoolId },
    { $set: { ...settings, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function createSyllabus(syllabusData: Omit<Syllabus, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDatabase();
  const result = await db.collection('syllabi').insertOne({
    ...syllabusData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getSyllabusByClassAndSubject(classId: string, subject: string) {
  const db = await getDatabase();
  return db
    .collection('syllabi')
    .findOne({ classId, subject });
}

export async function createSchool(schoolData: Omit<School, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDatabase();
  // Ensure slug is unique
  const existing = await db.collection('schools').findOne({ slug: schoolData.slug });
  if (existing) {
    throw new Error('School with this URL slug already exists');
  }

  const result = await db.collection('schools').insertOne({
    ...schoolData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getAllSchools() {
  const db = await getDatabase();
  return db.collection('schools').find().sort({ createdAt: -1 }).toArray();
}

export async function getSchoolBySlug(slug: string) {
  const db = await getDatabase();
  return db.collection('schools').findOne({ slug });
}

export async function getTeacherResources(teacherId: string) {
  const db = await getDatabase();
  return db
    .collection('resources')
    .find({ uploadedBy: teacherId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function deleteResource(resourceId: string, teacherId: string) {
  const db = await getDatabase();
  // Ensure the resource belongs to the teacher
  const result = await db.collection('resources').deleteOne({
    _id: new ObjectId(resourceId),
    uploadedBy: teacherId
  });
  return result.deletedCount > 0;
}
