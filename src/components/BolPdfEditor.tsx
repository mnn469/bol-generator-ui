import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { BolFormData, LineItem } from '../types/BolForm';
import { emptyLineItem, emptyForm } from '../types/BolForm';

// ── PDF dimensions (A4 in points, PDFBox bottom-left origin) ─────────────────
const PDF_W = 595;
const PDF_H = 842;

// ── Table constants (mirror PdfService.java) ──────────────────────────────────
const TABLE_ROW_START_Y = 510;
const TABLE_ROW_H = 17;

export interface Formatting {
  fontSize: number;
  textColor: string;
  highlightColor: string | null;
}

interface Props {
  onSubmit: (form: BolFormData, formatting: Formatting) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function BolPdfEditor({ onSubmit, onCancel, submitting }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const [formatting, setFormatting] = useState<Formatting>({
    fontSize: 10,
    textColor: '#000000',
    highlightColor: null,
  });

  const [form, setForm] = useState<BolFormData>(emptyForm());

  // ── Render template PDF onto canvas ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url,
      ).toString();

      const container = containerRef.current;
      if (!container || cancelled) return;

      const s = container.clientWidth / PDF_W;
      const pdf = await pdfjsLib.getDocument('/shipping_tally.pdf').promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: s });

      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      if (!cancelled) {
        setScale(s);
        setPdfLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Form state helpers ────────────────────────────────────────────────────
  const set = <K extends keyof BolFormData>(key: K, value: BolFormData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    setForm(f => {
      const items = f.lineItems.map((li, i) => {
        if (i !== index) return li;
        const updated = { ...li, [field]: value };
        if (field === 'quantity' || field === 'netWeightPerCase') {
          const qty = parseFloat(field === 'quantity' ? value : li.quantity) || 0;
          const wt = parseFloat(field === 'netWeightPerCase' ? value : li.netWeightPerCase) || 0;
          updated.totalLb = qty > 0 && wt > 0 ? (qty * wt).toFixed(2) : '';
        }
        return updated;
      });
      const tc = items.reduce((s, li) => s + (parseInt(li.quantity) || 0), 0);
      const tw = items.reduce((s, li) => s + (parseFloat(li.totalLb) || 0), 0);
      return {
        ...f,
        lineItems: items,
        totalCases: tc > 0 ? String(tc) : '',
        totalWeightLb: tw > 0 ? tw.toFixed(2) : '',
      };
    });
  };

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  // Converts PDF (bottom-left origin, points) → CSS absolute (top-left origin, pixels)
  // h = visual height of the field in PDF points
  const pos = useCallback(
    (x: number, y: number, w: number, h = 14): React.CSSProperties => ({
      position: 'absolute',
      left: Math.round(x * scale),
      // PDF y is the baseline; shift up by (h-2) so baseline sits near input bottom
      top: Math.round((PDF_H - y - h + 2) * scale),
      width: Math.round(w * scale),
      height: Math.round(h * scale),
    }),
    [scale],
  );

  const checkPos = useCallback(
    (x: number, y: number): React.CSSProperties => ({
      position: 'absolute',
      left: Math.round(x * scale),
      // CH=10: checkbox box size in PDF pt; formula mirrors pos() baseline alignment
      top: Math.round((PDF_H - y - 8) * scale),
      width: Math.round(10 * scale),
      height: Math.round(10 * scale),
    }),
    [scale],
  );

  // Text styling that reacts to formatting toolbar
  const textStyle = useMemo(
    (): React.CSSProperties => ({
      fontSize: formatting.fontSize * scale,
      color: formatting.textColor,
      backgroundColor: formatting.highlightColor
        ? `${formatting.highlightColor}55`
        : 'transparent',
      paddingLeft: 2,
      paddingRight: 2,
      boxSizing: 'border-box',
      fontFamily: 'Helvetica, Arial, sans-serif',
      outline: 'none',
    }),
    [formatting, scale],
  );

  // ── Shared field props factory ─────────────────────────────────────────────
  const f = (x: number, y: number, w: number, h = 14) => ({
    className: 'pdf-field',
    style: { ...pos(x, y, w, h), ...textStyle },
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-700">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm px-4 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <h2 className="text-sm font-bold text-gray-800 whitespace-nowrap">New Shipping Tally</h2>

        <div className="h-4 border-l border-gray-200" />

        {/* Font size */}
        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
          Font size
          <select
            value={formatting.fontSize}
            onChange={e => setFormatting(f => ({ ...f, fontSize: +e.target.value }))}
            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[7, 8, 9, 10, 11, 12, 14].map(s => (
              <option key={s} value={s}>{s} pt</option>
            ))}
          </select>
        </label>

        {/* Text colour */}
        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap cursor-pointer">
          Text color
          <input
            type="color"
            value={formatting.textColor}
            onChange={e => setFormatting(f => ({ ...f, textColor: e.target.value }))}
            className="w-7 h-6 border border-gray-300 rounded cursor-pointer p-0"
            title="Text color"
          />
        </label>

        {/* Highlight */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
          Highlight
          <input
            type="color"
            value={formatting.highlightColor ?? '#fef08a'}
            onChange={e => setFormatting(f => ({ ...f, highlightColor: e.target.value }))}
            className="w-7 h-6 border border-gray-300 rounded cursor-pointer p-0"
            title="Highlight color"
          />
          <button
            type="button"
            onClick={() =>
              setFormatting(f => ({
                ...f,
                highlightColor: f.highlightColor ? null : '#fef08a',
              }))
            }
            className={`px-2 py-0.5 rounded border text-xs font-medium transition ${
              formatting.highlightColor
                ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                : 'border-gray-300 text-gray-500 hover:border-gray-400'
            }`}
          >
            {formatting.highlightColor ? 'On' : 'Off'}
          </button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(form, formatting)}
            disabled={submitting || !form.shipper || !form.date}
            className="px-5 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
          >
            {submitting ? 'Generating…' : 'Generate BOL'}
          </button>
        </div>
      </div>

      {/* ── Scrollable PDF area ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex justify-center py-6">
        <div
          ref={containerRef}
          className="relative shadow-2xl bg-white"
          style={{ width: 794, flexShrink: 0 }}
        >
          {/* Rendered PDF page */}
          <canvas ref={canvasRef} className="block" />

          {!pdfLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <span className="text-sm text-gray-400 animate-pulse">Loading template…</span>
            </div>
          )}

          {/* ── Overlay inputs (only after PDF renders so scale is known) ─────── */}
          {pdfLoaded && scale > 0 && (
            <>
              {/* ── Header ───────────────────────────────────────────────────── */}
              <input {...f(110, 663, 270)} placeholder="Shipper"
                value={form.shipper} onChange={e => set('shipper', e.target.value)} />

              <input {...f(110, 612, 270)} placeholder="Destination line 1"
                value={form.destinationLine1} onChange={e => set('destinationLine1', e.target.value)} />
              <input {...f(110, 597, 270)} placeholder="Line 2"
                value={form.destinationLine2} onChange={e => set('destinationLine2', e.target.value)} />
              <input {...f(110, 582, 270)} placeholder="Line 3"
                value={form.destinationLine3} onChange={e => set('destinationLine3', e.target.value)} />

              <input type="date" {...f(460, 621, 128)}
                value={form.date} onChange={e => set('date', e.target.value)} />
              <input {...f(460, 604, 128)} placeholder="PO #"
                value={form.po} onChange={e => set('po', e.target.value)} />

              {/* Storage type checkboxes */}
              {(['FREEZER', 'COOLER', 'OTHER'] as const).map((type, i) => (
                <div
                  key={type}
                  className="pdf-check"
                  style={{
                    ...checkPos(403, [571, 557, 543][i]),
                    color: formatting.textColor,
                    fontSize: Math.round(8 * scale),
                  }}
                  onClick={() => set('storageType', form.storageType === type ? '' : type)}
                >
                  {form.storageType === type ? 'X' : ''}
                </div>
              ))}

              {/* ── Table rows ───────────────────────────────────────────────── */}
              {form.lineItems.map((li, idx) => {
                const rY = TABLE_ROW_START_Y - idx * TABLE_ROW_H;
                const rH = TABLE_ROW_H - 2;
                return (
                  <div key={idx}>
                    <input {...f(16, rY, 118, rH)} placeholder="LOT"
                      value={li.lotNoMarking} onChange={e => updateLineItem(idx, 'lotNoMarking', e.target.value)} />
                    <input type="number" {...f(136, rY, 44, rH)} placeholder="Qty"
                      value={li.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} />
                    <input type="number" {...f(182, rY, 44, rH)} placeholder="Pkd"
                      value={li.packed} onChange={e => updateLineItem(idx, 'packed', e.target.value)} />
                    <input type="number" step="0.01" {...f(234, rY, 60, rH)} placeholder="Net Wt"
                      value={li.netWeightPerCase} onChange={e => updateLineItem(idx, 'netWeightPerCase', e.target.value)} />
                    <input type="number" step="0.01" {...f(302, rY, 60, rH)} placeholder="Total lb"
                      value={li.totalLb} onChange={e => updateLineItem(idx, 'totalLb', e.target.value)} />
                    <input {...f(370, rY, 46, rH)} placeholder="Size"
                      value={li.size} onChange={e => updateLineItem(idx, 'size', e.target.value)} />
                    <input {...f(424, rY, 162, rH)} placeholder="Description"
                      value={li.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} />
                  </div>
                );
              })}

              {/* Add / remove row controls */}
              <div
                style={{
                  position: 'absolute',
                  left: Math.round(16 * scale),
                  top: Math.round((PDF_H - (TABLE_ROW_START_Y - form.lineItems.length * TABLE_ROW_H) + 3) * scale),
                  display: 'flex',
                  gap: Math.round(8 * scale),
                  fontSize: Math.round(8 * scale),
                }}
              >
                {form.lineItems.length < 12 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }))}
                    style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                  >
                    + Add row ({form.lineItems.length}/12)
                  </button>
                )}
                {form.lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => {
                      const items = f.lineItems.slice(0, -1);
                      const tc = items.reduce((s, li) => s + (parseInt(li.quantity) || 0), 0);
                      const tw = items.reduce((s, li) => s + (parseFloat(li.totalLb) || 0), 0);
                      return { ...f, lineItems: items, totalCases: tc > 0 ? String(tc) : '', totalWeightLb: tw > 0 ? tw.toFixed(2) : '' };
                    })}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                  >
                    − Remove last
                  </button>
                )}
              </div>

              {/* ── Summary row ──────────────────────────────────────────────── */}
              <input type="number" {...f(136, 274, 100, 12)} placeholder="Cases"
                value={form.totalCases} onChange={e => set('totalCases', e.target.value)} />
              <input type="number" step="0.01" {...f(302, 274, 100, 12)} placeholder="Total wt"
                value={form.totalWeightLb} onChange={e => set('totalWeightLb', e.target.value)} />

              {/* ── Time ─────────────────────────────────────────────────────── */}
              <input {...f(136, 240, 170)} placeholder="Time of Pick Up"
                value={form.timeOfPickUp} onChange={e => set('timeOfPickUp', e.target.value)} />
              <input {...f(136, 222, 170)} placeholder="Time of Delivery"
                value={form.timeOfDelivery} onChange={e => set('timeOfDelivery', e.target.value)} />

              {/* ── Checklist checkboxes ──────────────────────────────────────── */}
              {([
                ['packingIsClean',     225, 210],
                ['labelsApplied',      400, 210],
                ['tempIsAcceptable',   225, 196],
                ['countAndWeight',     400, 196],
                ['packagingNotBroken', 225, 182],
                ['msc',                400, 182],
                ['receivedInGoodOrder', 18, 168],
              ] as [keyof BolFormData, number, number][]).map(([key, x, y]) => (
                <div
                  key={String(key)}
                  className="pdf-check"
                  style={{
                    ...checkPos(x, y),
                    color: formatting.textColor,
                    fontSize: Math.round(8 * scale),
                  }}
                  onClick={() => set(key, !(form[key] as boolean) as never)}
                >
                  {form[key] ? 'X' : ''}
                </div>
              ))}

              {/* ── Carrier / Signature ───────────────────────────────────────── */}
              <input {...f(342, 240, 120)} placeholder="PCP Approved"
                value={form.pcpApproved} onChange={e => set('pcpApproved', e.target.value)} />
              <input {...f(342, 215, 120)} placeholder="Signature"
                value={form.signature} onChange={e => set('signature', e.target.value)} />
              <input {...f(482, 232, 100)} placeholder="Carrier"
                value={form.nameOfCarrier} onChange={e => set('nameOfCarrier', e.target.value)} />
              <input {...f(482, 199, 100)} placeholder="Driver"
                value={form.driversPrintNameSign} onChange={e => set('driversPrintNameSign', e.target.value)} />
              <input {...f(482, 161, 100)} placeholder="Consignee"
                value={form.consignee} onChange={e => set('consignee', e.target.value)} />

              {/* ── Truck temperature ─────────────────────────────────────────── */}
              <input {...f(370, 152, 110)} placeholder="Truck Temp"
                value={form.truckTemperaturePreLoading}
                onChange={e => set('truckTemperaturePreLoading', e.target.value)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
