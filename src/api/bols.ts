import api from './axios';
import type { BolRecord } from '../types';
import type { BolFormData } from '../types/BolForm';
import type { Formatting } from '../components/BolPdfEditor';

/** Convert string-based form fields to the number types the backend expects */
function toPayload(form: BolFormData, formatting?: Formatting) {
  return {
    shipper: form.shipper,
    destinationLine1: form.destinationLine1,
    destinationLine2: form.destinationLine2,
    destinationLine3: form.destinationLine3,
    date: form.date,
    po: form.po,
    storageType: form.storageType || null,
    lineItems: form.lineItems
      .filter((li) => li.lotNoMarking || li.description || li.quantity)
      .map((li) => ({
        lotNoMarking:     li.lotNoMarking,
        quantity:         li.quantity     ? parseInt(li.quantity)         : null,
        packed:           li.packed       ? parseInt(li.packed)           : null,
        netWeightPerCase: li.netWeightPerCase ? parseFloat(li.netWeightPerCase) : null,
        totalLb:          li.totalLb      ? parseFloat(li.totalLb)        : null,
        size:             li.size,
        description:      li.description,
      })),
    totalCases:    form.totalCases    ? parseInt(form.totalCases)    : null,
    totalWeightLb: form.totalWeightLb ? parseFloat(form.totalWeightLb) : null,
    timeOfPickUp:   form.timeOfPickUp,
    timeOfDelivery: form.timeOfDelivery,
    packingIsClean:      form.packingIsClean,
    labelsApplied:       form.labelsApplied,
    tempIsAcceptable:    form.tempIsAcceptable,
    countAndWeight:      form.countAndWeight,
    packagingNotBroken:  form.packagingNotBroken,
    msc:                 form.msc,
    receivedInGoodOrder: form.receivedInGoodOrder,
    pcpApproved:          form.pcpApproved,
    signature:            form.signature,
    nameOfCarrier:        form.nameOfCarrier,
    driversPrintNameSign: form.driversPrintNameSign,
    consignee:            form.consignee,
    truckTemperaturePreLoading: form.truckTemperaturePreLoading,
    // Formatting (applied by backend when generating PDF)
    fontSize: formatting?.fontSize ?? 10,
    textColor: formatting?.textColor ?? '#000000',
  };
}

export const generateBol = (companyId: number, form: BolFormData, formatting?: Formatting) =>
  api.post<BolRecord>(`/api/companies/${companyId}/bols/generate`, toPayload(form, formatting));

export const getBolHistory = (companyId: number) =>
  api.get<BolRecord[]>(`/api/companies/${companyId}/bols`);

export const voidBol = (companyId: number, bolId: number, reason: string) =>
  api.patch<BolRecord>(`/api/companies/${companyId}/bols/${bolId}/void`, { reason });

export const downloadPdf = async (companyId: number, bolId: number, bolNumber: string) => {
  const response = await api.get(`/api/companies/${companyId}/bols/${bolId}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${bolNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
