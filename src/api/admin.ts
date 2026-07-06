import api from './axios';

export const getCompanies = () => api.get('/api/admin/companies');

export const getMyCompanies = () => api.get('/api/admin/companies/mine');

export const createCompany = (data: {
  name: string;
  code: string;
  startingNumber: number;
  padding: number;
}) => api.post('/api/admin/companies', data);

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) => api.post('/api/auth/register', data);

export const addUserToCompany = (
  companyId: number,
  email: string,
  role: string
) => api.post(`/api/admin/companies/${companyId}/users?email=${email}&role=${role}`);

export const uploadTemplate = (
  companyId: number,
  file: File,
  bolNumberX: number,
  bolNumberY: number,
  copyLabelX: number,
  copyLabelY: number
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bolNumberX', String(bolNumberX));
  formData.append('bolNumberY', String(bolNumberY));
  formData.append('copyLabelX', String(copyLabelX));
  formData.append('copyLabelY', String(copyLabelY));
  return api.post(`/api/companies/${companyId}/template`, formData);
};
