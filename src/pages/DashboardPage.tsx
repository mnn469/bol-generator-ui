import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { generateBol, getBolHistory, voidBol, downloadPdf } from '../api/bols';
import { getMyCompanies } from '../api/admin';
import type { BolRecord, Company } from '../types';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [bols, setBols] = useState<BolRecord[]>([]);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // On load: fetch user's companies, then load history for the first one
  useEffect(() => {
    getMyCompanies()
      .then((res) => {
        const list: Company[] = res.data;
        setCompanies(list);
        if (list.length > 0) setSelectedCompanyId(list[0].id);
      })
      .catch(() => setError('Failed to load companies'));
  }, []);

  useEffect(() => {
    if (selectedCompanyId) fetchHistory(selectedCompanyId);
  }, [selectedCompanyId]);

  const fetchHistory = async (companyId: number) => {
    try {
      const res = await getBolHistory(companyId);
      setBols(res.data);
    } catch {
      setError('Failed to load BOL history');
    }
  };

  const handleGenerate = async () => {
    if (!selectedCompanyId) return;
    setGenerating(true);
    setMessage('');
    setError('');
    try {
      const res = await generateBol(selectedCompanyId);
      setMessage(`Generated: ${res.data.bolNumber}`);
      fetchHistory(selectedCompanyId);
    } catch {
      setError('Failed to generate BOL');
    } finally {
      setGenerating(false);
    }
  };

  const handleVoid = async (bol: BolRecord) => {
    if (!selectedCompanyId) return;
    const reason = prompt(`Enter void reason for ${bol.bolNumber}:`);
    if (!reason) return;
    try {
      await voidBol(selectedCompanyId, bol.id, reason);
      setMessage(`${bol.bolNumber} voided`);
      fetchHistory(selectedCompanyId);
    } catch {
      setError('Failed to void BOL');
    }
  };

  const handleDownload = async (bol: BolRecord) => {
    if (!selectedCompanyId) return;
    try {
      await downloadPdf(selectedCompanyId, bol.id, bol.bolNumber);
    } catch {
      setError('PDF not available for this BOL');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">BOL Generator</h1>
        <div className="flex items-center gap-4">
          {user?.roles?.includes('ADMIN') && (
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Admin Panel
            </button>
          )}
          <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Company selector (shown only if user belongs to multiple companies) */}
        {companies.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Company:</label>
            <select
              value={selectedCompanyId ?? ''}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* No company assigned yet */}
        {companies.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-5 py-4 rounded-xl mb-6 text-sm">
            You are not assigned to any company yet. Ask your admin to assign you.
          </div>
        )}

        {/* Generate BOL section */}
        {selectedCompany && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Generate New BOL
              <span className="ml-2 text-sm font-normal text-gray-400">
                — {selectedCompany.name}
              </span>
            </h2>

            {message && (
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">{message}</div>
            )}
            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate BOL'}
            </button>
          </div>
        )}

        {/* BOL History Table */}
        {selectedCompany && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">BOL History</h2>

            {bols.length === 0 ? (
              <p className="text-gray-400 text-sm">No BOLs generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b text-gray-500 uppercase text-xs">
                      <th className="py-3 pr-4">BOL Number</th>
                      <th className="py-3 pr-4">Generated By</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">PDF</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bols.map((bol) => (
                      <tr key={bol.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono font-semibold text-gray-800">{bol.bolNumber}</td>
                        <td className="py-3 pr-4 text-gray-600">{bol.generatedByName}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {new Date(bol.generatedAt).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bol.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {bol.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bol.pdfStatus === 'READY'
                              ? 'bg-blue-100 text-blue-700'
                              : bol.pdfStatus === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {bol.pdfStatus}
                          </span>
                        </td>
                        <td className="py-3 flex gap-2">
                          {bol.pdfStatus === 'READY' && (
                            <button
                              onClick={() => handleDownload(bol)}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              Download
                            </button>
                          )}
                          {bol.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleVoid(bol)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
