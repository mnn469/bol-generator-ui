export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  roles: string[];
}

export interface Company {
  id: number;
  name: string;
  code: string;
}

export interface BolRecord {
  id: number;
  bolNumber: string;
  numericNumber: number;
  status: 'ACTIVE' | 'VOIDED';
  pdfStatus: 'PENDING' | 'READY' | 'FAILED';
  generatedByName: string;
  generatedAt: string;
}
