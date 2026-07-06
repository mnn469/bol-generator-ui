import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCompanies,
  createCompany,
  registerUser,
  addUserToCompany,
  uploadTemplate,
} from '../api/admin';
import type { Company } from '../types';

type Tab = 'company' | 'users' | 'template';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('company');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">BOL Generator</h1>
          <span className="text-sm text-gray-400">/ Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-600 hover:underline"
          >
            Dashboard
          </button>
          <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          {(['company', 'users', 'template'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition ${
                tab === t
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'company' ? 'Company' : t === 'users' ? 'Users' : 'Template'}
            </button>
          ))}
        </div>

        {tab === 'company' && <CompanyTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'template' && <TemplateTab />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tab 1 — Company
───────────────────────────────────────── */
function CompanyTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startingNumber, setStartingNumber] = useState(1);
  const [padding, setPadding] = useState(6);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await getCompanies();
      setCompanies(res.data);
    } catch {
      // silently ignore — table just stays empty
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await createCompany({ name, code: code.toUpperCase(), startingNumber, padding });
      setMessage(`Company created — ID: ${res.data.id}, Name: ${res.data.name}`);
      setName('');
      setCode('');
      setStartingNumber(1);
      setPadding(6);
      loadCompanies();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing companies */}
      {companies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">Existing Companies</h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-400 uppercase text-xs">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2">Code</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-gray-500">{c.id}</td>
                  <td className="py-2 pr-4 text-gray-800 font-medium">{c.name}</td>
                  <td className="py-2 font-mono text-gray-600">{c.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create company form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Create New Company</h2>

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">{message}</div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Acme Logistics"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Code <span className="text-gray-400 font-normal">(prefix for BOL numbers)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                maxLength={10}
                placeholder="e.g. ACME"
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Starting Number</label>
              <input
                type="number"
                value={startingNumber}
                onChange={(e) => setStartingNumber(Number(e.target.value))}
                min={1}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Padding <span className="text-gray-400 font-normal">(digit width)</span>
              </label>
              <input
                type="number"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                min={1}
                max={10}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Padding=6, number=25 → ACME-000025
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Company'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tab 2 — Users
───────────────────────────────────────── */
function UsersTab() {
  const [companies, setCompanies] = useState<Company[]>([]);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Assign form
  const [assignCompanyId, setAssignCompanyId] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState('USER');
  const [assignMessage, setAssignMessage] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    getCompanies()
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage('');
    setRegError('');
    setRegLoading(true);
    try {
      await registerUser({ name: regName, email: regEmail, password: regPassword });
      setRegMessage(`User "${regName}" registered successfully.`);
      setAssignEmail(regEmail); // auto-fill assign form
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      setRegError(typeof msg === 'string' ? msg : 'Failed to register user');
    } finally {
      setRegLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignMessage('');
    setAssignError('');
    setAssignLoading(true);
    try {
      await addUserToCompany(Number(assignCompanyId), assignEmail, assignRole);
      setAssignMessage(`User assigned to company as ${assignRole}.`);
      setAssignEmail('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      setAssignError(typeof msg === 'string' ? msg : 'Failed to assign user');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Register user */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Register New User</h2>

        {regMessage && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">{regMessage}</div>
        )}
        {regError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{regError}</div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                placeholder="e.g. John Smith"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                placeholder="e.g. john@company.com"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min. 6 characters"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={regLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            {regLoading ? 'Registering...' : 'Register User'}
          </button>
        </form>
      </div>

      {/* Assign user to company */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Assign User to Company</h2>

        {assignMessage && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">{assignMessage}</div>
        )}
        {assignError && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{assignError}</div>
        )}

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
            <select
              value={assignCompanyId}
              onChange={(e) => setAssignCompanyId(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select company…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">User Email</label>
              <input
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                required
                placeholder="e.g. john@company.com"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={assignLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
          >
            {assignLoading ? 'Assigning...' : 'Assign to Company'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tab 3 — Template
───────────────────────────────────────── */
function TemplateTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [bolNumberX, setBolNumberX] = useState(420);
  const [bolNumberY, setBolNumberY] = useState(720);
  const [copyLabelX, setCopyLabelX] = useState(420);
  const [copyLabelY, setCopyLabelY] = useState(695);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCompanies()
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await uploadTemplate(
        Number(companyId),
        file,
        bolNumberX,
        bolNumberY,
        copyLabelX,
        copyLabelY
      );
      setMessage('Template uploaded successfully.');
      setFile(null);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      setError(typeof msg === 'string' ? msg : 'Failed to upload template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-1">Upload BOL Template</h2>
      <p className="text-sm text-gray-400 mb-4">
        Upload a PDF template. Set the X/Y coordinates (in PDF points) where the BOL number
        and copy label should be stamped on each page.
      </p>

      {message && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 text-sm">{message}</div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">PDF Template File</label>
          <input
            type="file"
            accept=".pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 file:text-sm"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">BOL Number Position</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X (horizontal)</label>
              <input
                type="number"
                value={bolNumberX}
                onChange={(e) => setBolNumberX(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y (vertical)</label>
              <input
                type="number"
                value={bolNumberY}
                onChange={(e) => setBolNumberY(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Copy Label Position</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X (horizontal)</label>
              <input
                type="number"
                value={copyLabelX}
                onChange={(e) => setCopyLabelX(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y (vertical)</label>
              <input
                type="number"
                value={copyLabelY}
                onChange={(e) => setCopyLabelY(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Default values work for most standard BOL templates. Adjust only if text appears in wrong position.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Template'}
        </button>
      </form>
    </div>
  );
}
