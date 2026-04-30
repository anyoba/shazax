import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

import {
  Activity,
  BookOpen,
  ChevronDown,
  Eye,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  CheckCircle,
  Globe,
} from 'lucide-react';
import { db } from '../firebase';
import { submitFormspreeContact } from '../formspree';

const MODULES = [
  { id: 'Thermodynamics', label: 'Thermodynamics' },
  { id: 'Mechanics', label: 'Mechanics' },
  { id: 'Analysis 2', label: 'Analysis 2' },
  { id: 'Algebra 2', label: 'Algebra 2' },
  { id: 'Structure of Matter', label: 'Structure of Matter' },
];

const CATEGORIES = [
  { id: 'Courses', label: 'Courses' },
  { id: 'TD', label: 'TD' },
  { id: 'Exams', label: 'Exams' },
  { id: 'Resources', label: 'Resources' },
];

const ADMIN_USER = 'shazaxx';
const ADMIN_PASS = '2008';
const AUTH_KEY = 'admin_auth';
const VISITS_KEY = 'admin_dashboard_visits';
const FORMSPREE_ID = 'mjgjpnbb'; // Replace with your Formspree ID

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function formatTimestamp(value) {
  if (!value) return 'Unknown';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value).toLocaleString();
  return 'Unknown';
}

function recordVisit() {
  const visits = readJson(VISITS_KEY, []);
  const nextVisit = {
    id: Date.now(),
    path: window.location.pathname,
    device:
      window.innerWidth < 640 ? 'Mobile' : window.innerWidth < 1024 ? 'Tablet' : 'Desktop',
    ts: Date.now(),
  };
  const nextVisits = [nextVisit, ...visits].slice(0, 50);
  window.localStorage.setItem(VISITS_KEY, JSON.stringify(nextVisits));
  return nextVisits;
}

function getStats(visits, resources, emails) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    pageViews: visits.length,
    todayViews: visits.filter((visit) => visit.ts >= todayStart.getTime()).length,
    resourceCount: resources.length,
    emailCount: emails.length,
  };
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/50">{label}</div>
    </div>
  );
}

export default function AdminPage({ resources, onAddResource, onDeleteResource }) {
  const [authed, setAuthed] = useState(() => window.sessionStorage.getItem(AUTH_KEY) === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [visits, setVisits] = useState(() => readJson(VISITS_KEY, []));
  const [emails, setEmails] = useState([]);
  const [users, setUsers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resLoading, setResLoading] = useState(false);
  const [resMsg, setResMsg] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [firebaseAnalytics, setFirebaseAnalytics] = useState([]);
  const [newEmailCount, setNewEmailCount] = useState(0);
  const [lastEmailCount, setLastEmailCount] = useState(0);
  const [resForm, setResForm] = useState({
    module: MODULES[0].id,
    category: CATEGORIES[0].id,
    title: '',
    fileName: '',
    fileUrl: '',
    correctionTitle: '',
    correctionUrl: '',
  });

  useEffect(() => {
    setVisits(recordVisit());
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'waitlist'),
      (snapshot) => {
        const newEmails = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEmails(newEmails);
        
        // Detect new emails
        if (lastEmailCount !== 0 && newEmails.length > lastEmailCount) {
          setNewEmailCount(newEmails.length - lastEmailCount);
          window.setTimeout(() => setNewEmailCount(0), 5000);
        }
        setLastEmailCount(newEmails.length);
      },
      () => {
        setEmails([]);
      },
    );

    return () => unsubscribe();
  }, [lastEmailCount]);

  useEffect(() => {
    const q = query(collection(db, 'analytics_visits'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFirebaseAnalytics(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).slice(0, 50));
      },
      () => {
        setFirebaseAnalytics([]);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      () => {
        setUsers([]);
      },
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(
    () => getStats(visits, resources, emails),
    [visits, resources, emails],
  );

  function login(event) {
    event.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      window.sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthed(true);
      setError('');
      return;
    }
    setError('Invalid credentials. Try again.');
  }

  function logout() {
    window.sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  function refreshDashboard() {
    setLoading(true);
    setVisits(recordVisit());
    setLastRefresh(new Date());
    window.setTimeout(() => setLoading(false), 300);
  }

  async function addResource(event) {
    event.preventDefault();
    setResLoading(true);
    setResMsg('');

    try {
      await onAddResource({
        module: resForm.module,
        category: resForm.category,
        title: resForm.title,
        fileName: resForm.fileName,
        fileUrl: resForm.fileUrl,
        correctionTitle: resForm.correctionTitle,
        correctionUrl: resForm.correctionUrl,
      });

      setResForm({
        module: MODULES[0].id,
        category: CATEGORIES[0].id,
        title: '',
        fileName: '',
        fileUrl: '',
        correctionTitle: '',
        correctionUrl: '',
      });
      setResMsg('Resource published successfully.');
    } catch (error) {
      console.error('Failed to publish resource', error);
      setResMsg('Failed to publish resource.');
    } finally {
      setResLoading(false);
    }
  }

  async function deleteResource(id) {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await onDeleteResource(id);
    } catch (error) {
      console.error('Failed to delete resource', error);
      window.alert('Unable to delete resource.');
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    setContactMsg('');
    
    try {
      const result = await submitFormspreeContact(
        contactForm.email,
        contactForm.name,
        contactForm.message
      );
      
      if (result.success) {
        setContactMsg('Message sent successfully!');
        setContactForm({ name: '', email: '', message: '' });
        window.setTimeout(() => setContactMsg(''), 3000);
      } else {
        setContactMsg('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setContactMsg('Error sending message.');
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Lock size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          </div>

          <form onSubmit={login} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            />
            <AnimatePresence>
              {error ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-sm text-red-400">
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>
            <button className="w-full rounded-xl bg-primary py-3 font-semibold text-white">Sign In</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-1">
            {[
              ['analytics', 'Dashboard', Activity],
              ['analytics-live', 'Live Analytics', Globe],
              ['emails', 'Emails & Contact', Mail],
              ['users', 'Users', Users],
              ['resources', 'Resources', BookOpen],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                  activeTab === id ? 'bg-white/15 text-white' : 'text-white/50'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {newEmailCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-sm text-green-400"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                {newEmailCount} new email{newEmailCount !== 1 ? 's' : ''}
              </motion.div>
            )}
            {lastRefresh ? <span className="text-xs text-white/30">Last refresh: {lastRefresh.toLocaleTimeString()}</span> : null}
            <button onClick={refreshDashboard} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-white/60 hover:text-red-400">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard icon={<Eye size={18} />} label="Page Views" value={stats.pageViews} />
              <StatCard icon={<Users size={18} />} label="Today's Views" value={stats.todayViews} />
              <StatCard icon={<BookOpen size={18} />} label="Resources" value={stats.resourceCount} />
              <StatCard icon={<Mail size={18} />} label="Waitlist Emails" value={stats.emailCount} />
            </div>
          </div>
        ) : null}

        {activeTab === 'analytics-live' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Real-time Visitor Analytics</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {firebaseAnalytics.length === 0 ? (
                <div className="p-6 text-white/40">No visitor data yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {firebaseAnalytics.map((visit) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="font-medium">{visit.pathname}</span>
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-white/40">
                          <span>{visit.screenWidth}x{visit.screenHeight}</span>
                          <span>{visit.language}</span>
                          <span className="capitalize">{visit.referrer === 'direct' ? 'Direct' : 'Referrer'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/30">{formatTimestamp(visit.createdAt)}</div>
                        <div className="mt-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">{visit.sessionId.slice(0, 8)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'emails' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Emails & Contact Management</h2>
            
            {/* Waitlist Emails Section */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <Mail size={18} />
                Waitlist Emails (Real-time from Firebase)
              </h3>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {emails.length === 0 ? (
                  <div className="p-6 text-white/40">No emails found.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {emails.map((email, index) => (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between gap-4 p-4 hover:bg-white/5"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                            <CheckCircle size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{email.email || 'No email'}</div>
                            <div className="text-xs text-white/35">Joined: {formatTimestamp(email.createdAt)}</div>
                          </div>
                        </div>
                        <a
                          href={`mailto:${email.email}`}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Send Email
                        </a>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Form Section */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <Mail size={18} />
                Send Contact Message (Formspree)
              </h3>
              <form onSubmit={handleContactSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your name"
                    required
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Your email"
                    required
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <textarea
                  value={contactForm.message}
                  onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Your message"
                  required
                  rows={4}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white"
                  >
                    <Mail size={14} />
                    Send Message
                  </button>
                  {contactMsg ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-green-400"
                    >
                      {contactMsg}
                    </motion.span>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {activeTab === 'users' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Registered Users</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {users.length === 0 ? (
                <div className="p-6 text-white/40">No registered users found yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">{userItem.fullName || userItem.email || 'Student'}</div>
                        <div className="text-sm text-white/40">{userItem.email || 'No email yet'}</div>
                      </div>
                      <div className="text-sm text-white/40">Joined {formatTimestamp(userItem.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'resources' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Manage Resources</h2>

            <form onSubmit={addResource} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <select
                    value={resForm.module}
                    onChange={(event) => setResForm((current) => ({ ...current, module: event.target.value }))}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-primary/50 focus:outline-none"
                  >
                    {MODULES.map((moduleItem) => (
                      <option key={moduleItem.id} value={moduleItem.id} className="bg-gray-900">
                        {moduleItem.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-4 text-white/30" />
                </div>

                <div className="relative">
                  <select
                    value={resForm.category}
                    onChange={(event) => setResForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-primary/50 focus:outline-none"
                  >
                    {CATEGORIES.map((categoryItem) => (
                      <option key={categoryItem.id} value={categoryItem.id} className="bg-gray-900">
                        {categoryItem.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-4 text-white/30" />
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <input
                  value={resForm.title}
                  onChange={(event) => setResForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Title"
                  required
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
                <input
                  value={resForm.fileName}
                  onChange={(event) => setResForm((current) => ({ ...current, fileName: event.target.value }))}
                  placeholder="Displayed file name"
                  required
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
                <input
                  value={resForm.fileUrl}
                  onChange={(event) => setResForm((current) => ({ ...current, fileUrl: event.target.value }))}
                  placeholder="File URL"
                  required
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
                <input
                  value={resForm.correctionTitle}
                  onChange={(event) => setResForm((current) => ({ ...current, correctionTitle: event.target.value }))}
                  placeholder="Correction title"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
                <input
                  value={resForm.correctionUrl}
                  onChange={(event) => setResForm((current) => ({ ...current, correctionUrl: event.target.value }))}
                  placeholder="Correction URL"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={resLoading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white"
                >
                  <Plus size={14} />
                  {resLoading ? 'Saving...' : 'Add Resource'}
                </button>
                {resMsg ? <span className="text-sm text-green-400">{resMsg}</span> : null}
              </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {resources.length === 0 ? (
                <div className="p-6 text-white/40">No resources found.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-sm text-white/40">
                          {resource.module} • {resource.category}
                        </div>
                      </div>
                      <button onClick={() => deleteResource(resource.id)} className="text-white/40 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
