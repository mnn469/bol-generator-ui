import api from './axios';
import type { BolRecord } from '../types';

export const generateBol = (companyId: number) =>
  api.post<BolRecord>(`/api/companies/${companyId}/bols/generate`);

export const getBolHistory = (companyId: number) =>
  api.get<BolRecord[]>(`/api/companies/${companyId}/bols`);

export const voidBol = (companyId: number, bolId: number, reason: string) =>
  api.patch<BolRecord>(`/api/companies/${companyId}/bols/${bolId}/void`, { reason });

export const downloadPdf = async (companyId: number, bolId: number, bolNumber: string) => {
  const response = await api.get(`/api/companies/${companyId}/bols/${bolId}/pdf`, {
    responseType: 'blob', // tells axios to treat response as binary file
  });
  // Create a temporary download link and click it
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${bolNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
