import { useState } from 'react';
import type { BolFormData, LineItem } from '../types/BolForm';
import { emptyLineItem } from '../types/BolForm';

interface Props {
  onSubmit: (form: BolFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function BolFormModal({ onSubmit, onCancel, submitting }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<BolFormData>({
    shipper: '',
    destinationLine1: '',
    destinationLine2: '',
    destinationLine3: '',
    date: today,
    po: '',
    storageType: '',
    lineItems: [emptyLineItem()],
    totalCases: '',
    totalWeightLb: '',
    timeOfPickUp: '',
    timeOfDelivery: '',
    packingIsClean: false,
    labelsApplied: false,
    tempIsAcceptable: false,
    countAndWeight: false,
    packagingNotBroken: false,
    msc: false,
    receivedInGoodOrder: false,
    pcpApproved: '',
    signature: '',
    nameOfCarrier: '',
    driversPrintNameSign: '',
    consignee: '',
    truckTemperaturePreLoading: '',
  });

  // ── Generic field updater ──────────────────────────────────────────────────
  const set = <K extends keyof BolFormData>(key: K, value: BolFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Line item helpers ──────────────────────────────────────────────────────
  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    setForm((f) => {
      const items = f.lineItems.map((li, i) => {
        if (i !== index) return li;
        const updated = { ...li, [field]: value };
        // Auto-calculate totalLb when qty or netWeight changes
        if (field === 'quantity' || field === 'netWeightPerCase') {
          const qty = parseFloat(field === 'quantity' ? value : li.quantity) || 0;
          const wt  = parseFloat(field === 'netWeightPerCase' ? value : li.netWeightPerCase) || 0;
          updated.totalLb = qty > 0 && wt > 0 ? (qty * wt).toFixed(2) : '';
        }
        return updated;
      });

      // Recalculate totals
      const totalCases = items.reduce((s, li) => s + (parseInt(li.quantity) || 0), 0);
      const totalWt    = items.reduce((s, li) => s + (parseFloat(li.totalLb) || 0), 0);

      return {
        ...f,
        lineItems: items,
        totalCases: totalCases > 0 ? String(totalCases) : '',
        totalWeightLb: totalWt > 0 ? totalWt.toFixed(2) : '',
      };
    });
  };

  const addRow = () => {
    if (form.lineItems.length < 12) {
      setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }));
    }
  };

  const removeRow = (index: number) => {
    if (form.lineItems.length === 1) return;
    setForm((f) => {
      const items = f.lineItems.filter((_, i) => i !== index);
      const totalCases = items.reduce((s, li) => s + (parseInt(li.quantity) || 0), 0);
      const totalWt    = items.reduce((s, li) => s + (parseFloat(li.totalLb) || 0), 0);
      return {
        ...f,
        lineItems: items,
        totalCases: totalCases > 0 ? String(totalCases) : '',
        totalWeightLb: totalWt > 0 ? totalWt.toFixed(2) : '',
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  // ── Shared input styles ────────────────────────────────────────────────────
  const input = 'border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500';
  const label = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">New Shipping Tally</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill all sections — BOL number will be assigned on generate</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">

          {/* ── Section 1: Header ──────────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-1 border-b">
              Shipment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>Shipper *</label>
                <input required className={input} value={form.shipper}
                  onChange={(e) => set('shipper', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Date *</label>
                  <input required type="date" className={input} value={form.date}
                    onChange={(e) => set('date', e.target.value)} />
                </div>
                <div>
                  <label className={label}>PO Number</label>
                  <input className={input} value={form.po}
                    onChange={(e) => set('po', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Destination</label>
                <input className={`${input} mb-1`} placeholder="Line 1" value={form.destinationLine1}
                  onChange={(e) => set('destinationLine1', e.target.value)} />
                <input className={`${input} mb-1`} placeholder="Line 2" value={form.destinationLine2}
                  onChange={(e) => set('destinationLine2', e.target.value)} />
                <input className={input} placeholder="Line 3" value={form.destinationLine3}
                  onChange={(e) => set('destinationLine3', e.target.value)} />
              </div>
              <div>
                <label className={label}>Storage Type</label>
                <div className="flex gap-4 mt-2">
                  {(['FREEZER', 'COOLER', 'OTHER'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="radio" name="storageType" value={t}
                        checked={form.storageType === t}
                        onChange={() => set('storageType', t)}
                        className="accent-blue-600" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Line Items ──────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-1 border-b">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Line Items
              </h3>
              <button type="button" onClick={addRow}
                disabled={form.lineItems.length >= 12}
                className="text-xs text-blue-600 hover:underline disabled:opacity-40">
                + Add Row ({form.lineItems.length}/12)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase">
                    <th className="py-2 px-1 text-left font-medium w-28">LOT No/Marking</th>
                    <th className="py-2 px-1 text-left font-medium w-16">Qty</th>
                    <th className="py-2 px-1 text-left font-medium w-16">Packed</th>
                    <th className="py-2 px-1 text-left font-medium w-24">Net Wt/Case (lb)</th>
                    <th className="py-2 px-1 text-left font-medium w-20">Total lb</th>
                    <th className="py-2 px-1 text-left font-medium w-20">Size</th>
                    <th className="py-2 px-1 text-left font-medium">Description</th>
                    <th className="py-2 px-1 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((li, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-1 px-1">
                        <input className={input} value={li.lotNoMarking}
                          onChange={(e) => updateLineItem(idx, 'lotNoMarking', e.target.value)} />
                      </td>
                      <td className="py-1 px-1">
                        <input type="number" min="0" className={input} value={li.quantity}
                          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td className="py-1 px-1">
                        <input type="number" min="0" className={input} value={li.packed}
                          onChange={(e) => updateLineItem(idx, 'packed', e.target.value)} />
                      </td>
                      <td className="py-1 px-1">
                        <input type="number" min="0" step="0.01" className={input} value={li.netWeightPerCase}
                          onChange={(e) => updateLineItem(idx, 'netWeightPerCase', e.target.value)} />
                      </td>
                      <td className="py-1 px-1">
                        <input type="number" min="0" step="0.01" className={`${input} bg-gray-50`}
                          value={li.totalLb}
                          onChange={(e) => updateLineItem(idx, 'totalLb', e.target.value)} />
                      </td>
                      <td className="py-1 px-1">
                        <input className={input} value={li.size}
                          onChange={(e) => updateLineItem(idx, 'size', e.target.value)} />
                      </td>
                      <td className="py-1 px-1">
                        <input className={input} value={li.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)} />
                      </td>
                      <td className="py-1 px-1 text-center">
                        <button type="button" onClick={() => removeRow(idx)}
                          disabled={form.lineItems.length === 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 font-bold">
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-xs">
                    <td className="py-2 px-1 text-right text-gray-600" colSpan={2}>Totals:</td>
                    <td className="py-2 px-1"></td>
                    <td className="py-2 px-1"></td>
                    <td className="py-2 px-1 text-blue-700">{form.totalWeightLb ? `${form.totalWeightLb} lb` : '—'}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>Total Cases/Totes: <strong className="text-gray-700">{form.totalCases || '—'}</strong></span>
              <span>Total Weight: <strong className="text-gray-700">{form.totalWeightLb ? `${form.totalWeightLb} lb` : '—'}</strong></span>
            </div>
          </section>

          {/* ── Section 3: Time + Checklist ────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-1 border-b">
              Pickup / Delivery &amp; Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={label}>Time of Pick Up</label>
                  <input className={input} placeholder="e.g. 09:00 AM" value={form.timeOfPickUp}
                    onChange={(e) => set('timeOfPickUp', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className={label}>Time of Delivery</label>
                  <input className={input} placeholder="e.g. 02:30 PM" value={form.timeOfDelivery}
                    onChange={(e) => set('timeOfDelivery', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Truck Temperature Pre Loading</label>
                <input className={input} placeholder="e.g. -18°C" value={form.truckTemperaturePreLoading}
                  onChange={(e) => set('truckTemperaturePreLoading', e.target.value)} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {([
                ['packingIsClean',      'Packing is Clean'],
                ['labelsApplied',       'Labels Applied'],
                ['tempIsAcceptable',    'Temp is Acceptable'],
                ['countAndWeight',      'Count & Weight'],
                ['packagingNotBroken',  'Packaging Not Broken'],
                ['msc',                 'MSC'],
                ['receivedInGoodOrder', 'Received in Good Order'],
              ] as [keyof BolFormData, string][]).map(([key, displayLabel]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox"
                    checked={form[key] as boolean}
                    onChange={(e) => set(key, e.target.checked as BolFormData[typeof key])}
                    className="accent-blue-600 w-4 h-4" />
                  <span className="text-gray-700">{displayLabel}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ── Section 4: Carrier / Signature ────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-1 border-b">
              Carrier &amp; Signature
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={label}>PCP Approved</label>
                <input className={input} value={form.pcpApproved}
                  onChange={(e) => set('pcpApproved', e.target.value)} />
              </div>
              <div>
                <label className={label}>Signature (Name)</label>
                <input className={input} value={form.signature}
                  onChange={(e) => set('signature', e.target.value)} />
              </div>
              <div>
                <label className={label}>Name of Carrier</label>
                <input className={input} value={form.nameOfCarrier}
                  onChange={(e) => set('nameOfCarrier', e.target.value)} />
              </div>
              <div>
                <label className={label}>Driver's Print Name &amp; Sign</label>
                <input className={input} value={form.driversPrintNameSign}
                  onChange={(e) => set('driversPrintNameSign', e.target.value)} />
              </div>
              <div>
                <label className={label}>Consignee</label>
                <input className={input} value={form.consignee}
                  onChange={(e) => set('consignee', e.target.value)} />
              </div>
            </div>
          </section>

          {/* ── Footer buttons ────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onCancel}
              className="px-5 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Generating...' : 'Generate BOL & PDF'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
