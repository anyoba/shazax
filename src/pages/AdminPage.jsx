import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, limit, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth, useClerk } from '@clerk/clerk-react';

import {
  Activity,
  Building2,
  BookOpen,
  ChevronDown,
  Eye,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  CheckCircle,
  Globe,
  Layers,
} from 'lucide-react';
import { db } from '../firebase';
import { submitFormspreeContact } from '../formspree';
import AcademicStructureManager from '../components/admin/academic/AcademicStructureManager.jsx';
import InstitutionsManager from '../components/admin/academic/InstitutionsManager.jsx';
import AdminShell from '../components/admin/layout/AdminShell.jsx';
import AcademicResourcesManager from '../components/admin/resources/AcademicResourcesManager.jsx';
import { USER_ROLES } from '../constants/roles.js';
import { useUserRole } from '../hooks/useUserRole.js';
import { useResources } from '../hooks/useResources.js';
import { getFirestoreErrorMessage } from '../utils/firebaseErrors.js';
import { getAdminDashboard, getAdminUsers, updateAdminUserRole } from '../services/concoursApi.js';

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

const VISITS_KEY = 'admin_dashboard_visits';
const FORMSPREE_ID = 'mjgjpnbb'; // Replace with your Formspree ID
const ADMIN_LIST_LIMIT = 100;
const ANALYTICS_LIST_LIMIT = 50;

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
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)] opacity-35" />
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_16px_35px_rgba(139,92,246,0.22)]">
          {icon}
        </div>
        <div className="h-2 w-2 rounded-full bg-blue-300/80 shadow-[0_0_18px_rgba(147,197,253,0.9)]" />
      </div>
      <div className="text-3xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-1 text-sm font-medium text-white/48">{label}</div>
    </div>
  );
}

export default function AdminPage({ onAddResource, onDeleteResource }) {
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const { role } = useUserRole();
  const [activeTab, setActiveTab] = useState('analytics');
  const lastEmailCountRef = useRef(0);
  const [visits, setVisits] = useState(() => readJson(VISITS_KEY, []));
  const [emails, setEmails] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [roleSavingUserId, setRoleSavingUserId] = useState('');
  const [firestoreError, setFirestoreError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resLoading, setResLoading] = useState(false);
  const [resMsg, setResMsg] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [firebaseAnalytics, setFirebaseAnalytics] = useState([]);
  const [newEmailCount, setNewEmailCount] = useState(0);
  const [selectedStructureInstitutionId, setSelectedStructureInstitutionId] = useState('');
  const [resForm, setResForm] = useState({
    module: MODULES[0].id,
    category: CATEGORIES[0].id,
    title: '',
    fileName: '',
    fileUrl: '',
    correctionTitle: '',
    correctionUrl: '',
  });
  const canViewAdminData = [USER_ROLES.ADMIN, USER_ROLES.OWNER].includes(role);
  const canManageResources = [USER_ROLES.EDITOR, USER_ROLES.ADMIN, USER_ROLES.OWNER].includes(role);
  const canAccessInstitutions = [
    USER_ROLES.MODERATOR,
    USER_ROLES.EDITOR,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER,
  ].includes(role);
  const tabs = useMemo(() => {
    const nextTabs = [];

    if (canViewAdminData) {
      nextTabs.push(
        ['analytics', 'Dashboard', Activity],
        ['analytics-live', 'Live Analytics', Globe],
        ['emails', 'Emails & Contact', Mail],
        ['users', 'Users', Users],
      );
    }

    if (canAccessInstitutions) {
      nextTabs.push(['institutions', 'Etablissements', Building2]);
      nextTabs.push(['academic-structure', 'Manage Resources', Layers]);
    }

    if (canManageResources) {
      nextTabs.push(['resources', 'Resources', BookOpen]);
    }

    return nextTabs;
  }, [canAccessInstitutions, canManageResources, canViewAdminData]);
  const { resources } = useResources({
    enabled: canManageResources && activeTab === 'resources',
  });

  useEffect(() => {
    setVisits(recordVisit());
  }, []);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(([id]) => id === activeTab)) {
      setActiveTab(tabs[0][0]);
    }
  }, [activeTab, tabs]);

  function handleFirestoreError(error) {
    const message = getFirestoreErrorMessage(
      error,
      'Impossible de charger les donnees Firebase. Verifie le projet Firebase et les regles de lecture.',
    );
    console.error('Firebase snapshot failed', message);
    setFirestoreError(message);
  }

  useEffect(() => {
    if (!canViewAdminData) {
      setEmails([]);
      setNewEmailCount(0);
      lastEmailCountRef.current = 0;
      return undefined;
    }

    if (activeTab !== 'emails') return undefined;

    const waitlistQuery = query(
      collection(db, 'waitlist'),
      orderBy('createdAt', 'desc'),
      limit(ADMIN_LIST_LIMIT),
    );
    const unsubscribe = onSnapshot(
      waitlistQuery,
      (snapshot) => {
        const newEmails = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEmails(newEmails);
        
        if (lastEmailCountRef.current !== 0 && newEmails.length > lastEmailCountRef.current) {
          setNewEmailCount(newEmails.length - lastEmailCountRef.current);
          window.setTimeout(() => setNewEmailCount(0), 5000);
        }
        lastEmailCountRef.current = newEmails.length;
      },
      (error) => {
        setEmails([]);
        handleFirestoreError(error);
      },
    );

    return () => unsubscribe();
  }, [activeTab, canViewAdminData]);

  useEffect(() => {
    if (!canViewAdminData) {
      setFirebaseAnalytics([]);
      return undefined;
    }

    if (activeTab !== 'analytics-live') return undefined;

    const q = query(
      collection(db, 'analytics_visits'),
      orderBy('createdAt', 'desc'),
      limit(ANALYTICS_LIST_LIMIT),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFirebaseAnalytics(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        setFirebaseAnalytics([]);
        handleFirestoreError(error);
      },
    );

    return () => unsubscribe();
  }, [activeTab, canViewAdminData]);

  useEffect(() => {
    if (!canViewAdminData) {
      setUsers([]);
      return undefined;
    }

    if (activeTab !== 'users') return undefined;

    let cancelled = false;
    setUsersLoading(true);
    getAdminUsers(getToken)
      .then((body) => {
        if (!cancelled) setUsers(body.users || []);
      })
      .catch((error) => {
        if (!cancelled) {
          setUsers([]);
          setFirestoreError(error?.message || 'Unable to load users.');
        }
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, canViewAdminData, getToken]);

  const stats = useMemo(
    () => getStats(visits, resources, emails),
    [visits, resources, emails],
  );

  useEffect(() => {
    if (!canViewAdminData || activeTab !== 'analytics') return undefined;
    let cancelled = false;
    getAdminDashboard(getToken)
      .then((body) => {
        if (!cancelled) setAdminStats(body.stats || null);
      })
      .catch((error) => {
        if (!cancelled) setFirestoreError(error?.message || 'Unable to load admin stats.');
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, canViewAdminData, getToken]);

  const filteredUsers = useMemo(() => {
    const normalized = userQuery.trim().toLowerCase();
    return users.filter((userItem) => {
      const matchesRole = userRoleFilter === 'all' || userItem.role === userRoleFilter;
      const matchesText = !normalized || [userItem.fullName, userItem.email, userItem.id].some((value) => String(value || '').toLowerCase().includes(normalized));
      return matchesRole && matchesText;
    });
  }, [userQuery, userRoleFilter, users]);

  async function refreshDashboard() {
    setLoading(true);
    setVisits(recordVisit());
    setLastRefresh(new Date());
    try {
      if (canViewAdminData) {
        const body = await getAdminDashboard(getToken);
        setAdminStats(body.stats || null);
        if (activeTab === 'users') {
          const usersBody = await getAdminUsers(getToken);
          setUsers(usersBody.users || []);
        }
      }
    } catch (error) {
      setFirestoreError(error?.message || 'Unable to refresh dashboard.');
    } finally {
      setLoading(false);
    }
  }

  async function changeUserRole(userId, nextRole, nextStatus = 'active') {
    setRoleSavingUserId(userId);
    setFirestoreError('');
    try {
      await updateAdminUserRole({ userId, role: nextRole, status: nextStatus }, getToken);
      const usersBody = await getAdminUsers(getToken);
      setUsers(usersBody.users || []);
    } catch (error) {
      setFirestoreError(error?.message || 'Unable to update role.');
    } finally {
      setRoleSavingUserId('');
    }
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
      setResMsg(error?.message || 'Failed to publish resource.');
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
      window.alert(error?.message || 'Unable to delete resource.');
    }
  }

  function openStructureForInstitution(institution) {
    setSelectedStructureInstitutionId(institution.id);
    setActiveTab('academic-structure');
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

  return (
    <AdminShell
      activeTab={activeTab}
      canAccessConcours={[USER_ROLES.ADMIN, USER_ROLES.OWNER].includes(role)}
      loading={loading}
      newEmailCount={newEmailCount}
      onChangeTab={setActiveTab}
      onRefresh={refreshDashboard}
      onSignOut={() => signOut({ redirectUrl: '/' })}
      role={role}
      tabs={tabs}
      lastRefresh={lastRefresh}
    >
        {firestoreError ? (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {firestoreError}
          </div>
        ) : null}
        {canViewAdminData && activeTab === 'analytics' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard icon={<Users size={18} />} label="Total users" value={adminStats?.totalUsers ?? 0} />
              <StatCard icon={<Activity size={18} />} label="Active users" value={adminStats?.activeUsers ?? 0} />
              <StatCard icon={<BookOpen size={18} />} label="Total concours" value={adminStats?.totalConcours ?? 0} />
              <StatCard icon={<Layers size={18} />} label="Total questions" value={adminStats?.totalQuestions ?? 0} />
              <StatCard icon={<Eye size={18} />} label="Total attempts" value={adminStats?.totalAttempts ?? 0} />
              <StatCard icon={<CheckCircle size={18} />} label="Average score" value={(adminStats?.averageScore ?? 0) + '%'} />
              <StatCard icon={<Users size={18} />} label="New users this week" value={adminStats?.newUsersThisWeek ?? 0} />
              <StatCard icon={<Mail size={18} />} label="Waitlist Emails" value={stats.emailCount} />
            </div>
          </div>
        ) : null}

        {canViewAdminData && activeTab === 'analytics-live' ? (
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

        {canViewAdminData && activeTab === 'emails' ? (
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

        {canViewAdminData && activeTab === 'users' ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-xl font-bold">Registered Users</h2>
              <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
                <input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search users"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none"
                />
                <select
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value)}
                  className="rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-white focus:border-primary/50 focus:outline-none"
                >
                  <option value="all">All roles</option>
                  {Object.values(USER_ROLES).map((roleValue) => <option key={roleValue} value={roleValue}>{roleValue}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {usersLoading ? (
                <div className="p-6 text-white/40">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-white/40">No registered users found.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredUsers.map((userItem) => (
                    <div key={userItem.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_10rem_13rem_10rem] lg:items-center">
                      <div>
                        <div className="font-medium">{userItem.fullName || userItem.email || 'Student'}</div>
                        <div className="text-sm text-white/40">{userItem.email || 'No email yet'}</div>
                        <div className="mt-1 text-xs text-white/25">Joined {formatTimestamp(userItem.createdAt)}</div>
                      </div>
                      <div className="text-sm text-white/45">
                        <div>{userItem.attemptsCount || 0} attempts</div>
                        <div>{userItem.bestScore || 0}% best</div>
                      </div>
                      <select
                        value={userItem.role || USER_ROLES.STUDENT}
                        disabled={role !== USER_ROLES.OWNER || roleSavingUserId === userItem.id}
                        onChange={(event) => changeUserRole(userItem.id, event.target.value, userItem.roleStatus || 'active')}
                        className="rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {Object.values(USER_ROLES).map((roleValue) => <option key={roleValue} value={roleValue}>{roleValue}</option>)}
                      </select>
                      <select
                        value={userItem.roleStatus || 'active'}
                        disabled={role !== USER_ROLES.OWNER || roleSavingUserId === userItem.id}
                        onChange={(event) => changeUserRole(userItem.id, userItem.role || USER_ROLES.STUDENT, event.target.value)}
                        className="rounded-xl border border-white/10 bg-gray-950 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {canAccessInstitutions && activeTab === 'institutions' ? (
          <InstitutionsManager onManageStructure={openStructureForInstitution} />
        ) : null}

        {canAccessInstitutions && activeTab === 'academic-structure' ? (
          <AcademicStructureManager initialInstitutionId={selectedStructureInstitutionId} />
        ) : null}

        {canManageResources && activeTab === 'resources' ? (
          <AcademicResourcesManager
            resources={resources}
            onAddResource={onAddResource}
            onDeleteResource={onDeleteResource}
          />
        ) : null}

        {false && canManageResources && activeTab === 'resources' ? (
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
    </AdminShell>
  );
}
