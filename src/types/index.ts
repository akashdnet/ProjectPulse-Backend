export enum Role {
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
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
  status?: UserStatus | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
