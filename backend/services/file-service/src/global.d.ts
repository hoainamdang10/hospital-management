declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        department_id?: string;
      };
    }
  }
}

export {};
