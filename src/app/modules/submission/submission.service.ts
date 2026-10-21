import { ProjectStatus, Submission } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../utils/AppError';

export interface ICreateSubmissionPayload {
  projectName: string;
  repoUrl: string;
  liveLink: string;
  description: string;
}

const createSubmission = async (
  studentId: string,
  payload: ICreateSubmissionPayload
): Promise<Submission> => {
  // Check if a submission with exact studentId and repoUrl already exists
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      studentId_repoUrl: {
        studentId,
        repoUrl: payload.repoUrl,
      },
    },
  });

  if (existingSubmission) {
    throw new AppError(409, 'Duplicate submission: You have already submitted this repository!');
  }

  const submission = await prisma.submission.create({
    data: {
      projectName: payload.projectName,
      repoUrl: payload.repoUrl,
      liveLink: payload.liveLink,
      description: payload.description,
      status: ProjectStatus.PENDING,
      studentId,
    },
  });

  return submission;
};

export const SubmissionService = {
  createSubmission,
};
