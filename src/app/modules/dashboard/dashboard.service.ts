import { ProjectStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import AppError from '../../utils/AppError';

export interface ISubmissionFilterOptions {
  page?: string | number;
  limit?: string | number;
  status?: ProjectStatus;
}

const getAllSubmissions = async (filters: ISubmissionFilterOptions) => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Number(filters.limit) || 10);
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (filters.status) {
    whereCondition.status = filters.status;
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where: whereCondition,
      skip,
      take: limit,
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.submission.count({
      where: whereCondition,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: submissions,
  };
};

const updateSubmissionStatus = async (id: string, status: ProjectStatus) => {
  const existingSubmission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!existingSubmission) {
    throw new AppError(404, 'Submission not found with the provided id!');
  }

  const updatedSubmission = await prisma.submission.update({
    where: { id },
    data: { status },
  });

  return updatedSubmission;
};

const getDashboardStats = async () => {
  const groupedStats = await prisma.submission.groupBy({
    by: ['status'],
    _count: {
      _all: true,
    },
  });

  const stats = {
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
  };

  groupedStats.forEach((item) => {
    if (item.status === ProjectStatus.PENDING) {
      stats.totalPending = item._count._all;
    } else if (item.status === ProjectStatus.APPROVED) {
      stats.totalApproved = item._count._all;
    } else if (item.status === ProjectStatus.REJECTED) {
      stats.totalRejected = item._count._all;
    }
  });

  return stats;
};

export const DashboardService = {
  getAllSubmissions,
  updateSubmissionStatus,
  getDashboardStats,
};
