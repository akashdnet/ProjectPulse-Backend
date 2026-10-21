export enum Role {
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
}

export enum ProjectStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IAuthUser {
  id: string;
  email: string;
  role: Role | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
