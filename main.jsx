import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, BookOpen, CalendarCheck, CheckCircle2, ChevronDown, CircleDollarSign,
  ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, Search, Settings,
  ShieldCheck, Users, UserPlus, Wallet, Bell, X, Plus, ArrowUpRight, Clock3,
  FileText, School, UserRound, RefreshCw, AlertCircle
} from 'lucide-react';
import './styles.css';

const API = 'http://localhost:4000/api';
const money = (n) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(n || 0));
const dateText = (d) => d ? new Date(d).toLocaleDateString() : '—';

function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('admin@azharix.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('Dashboard');
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ studentCode:'', firstName:'', lastName:'', className:'', section:'', guardianName:'', guardianPhone:'', phone:'', email:'' });

  const request = async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const loadDashboard = async () => {
    setLoading(true); setError('');
    try {
      const [s, st] = await Promise.all([request('/dashboard/summary'), request('/students?page=1&pageSize=8')]);
      setSummary(s); setStudents(st.items); setStudentTotal(st.total);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  const loadStudents = async (q = search) => {
    setLoading(true); setError('');
    try {
      const data = await request(`/students?page=1&pageSize=100&search=${encodeURIComponent(q)}`);
      setStudents(data.items); setStudentTotal(data.total);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const me = await request('/auth/me');
        setUser(me.user);
      } catch { setToken(''); setUser(null); }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    if (page === 'Dashboard') loadDashboard();
    if (page === 'Students') loadStudents('');
  }, [token, user, page]);

  const signIn = async (e) => {
    e.preventDefault(); setLoginError('');
    try {
      const res = await fetch(`${API}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token); setUser(data.user); setPage('Dashboard');
    } catch (e) { setLoginError(e.message); }
  };
  const logout = () => { setToken(''); setUser(null); setSummary(null); setPage('Dashboard'); };
  const createStudent = async (e) => {
    e.preventDefault(); setError(''); setNotice('');
    try {
      await request('/students', { method:'POST', body:JSON.stringify(form) });
      setShowAdd(false);
      setForm({ studentCode:'', firstName:'', lastName:'', className:'', section:'', guardianName:'', guardianPhone:'', phone:'', email:'' });
      setNotice('Student registered successfully.');
      if (page === 'Dashboard') loadDashboard(); else loadStudents('');
    } catch (e) { setError(e.message); }
  };

  if (!user) return <div className="login-shell">
    <div className="login-art">
      <div className="brand brand-light"><span className="brand-mark">A</span><span>AZHARIX<small>COLLEGE MANAGEMENT</small></span></div>
      <div className="login-message">
        <div className="eyebrow">SMART CAMPUS · SIMPLE CONTROL</div>
        <h1>Every part of your college.<br/><em>One clear view.</em></h1>
        <p>Admissions, student records, attendance, fees and academic operations — connected in one secure workspace.</p>
        <div className="login-feature"><span><CheckCircle2 size={17}/></span> Real-time data from your college database</div>
        <div className="login-feature"><span><ShieldCheck size={17}/></span> Role-based access and protected records</div>
      </div>
      <div className="art-footer">AZHARIX COLLEGE · EST. 2026</div>
    </div>
    <div className="login-panel">
      <form className="login-form" onSubmit={signIn}>
        <div className="mobile-brand brand"><span className="brand-mark">A</span><span>AZHARIX<small>COLLEGE MANAGEMENT</small></span></div>
        <div className="form-kicker">WELCOME BACK</div><h2>Sign in to your workspace</h2><p className="muted">Use your authorized college account to continue.</p>
        <label>Email address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@college.edu"/>
        <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Enter your password"/>
        {loginError && <div className="error-banner"><AlertCircle size={16}/>{loginError}</div>}
        <button className="primary-btn full-btn" type="submit">Sign in <ArrowUpRight size={17}/></button>
        <div className="demo-note"><ShieldCheck size={16}/><span><b>Local demo:</b> admin@azharix.local / ChangeMe123!<br/>Change this password before any real deployment.</span></div>
      </form>
      <div className="login-copyright">© 2026 AZHARIX College Management System</div>
    </div>
  </div>;

  const nav = [
    {group:'OVERVIEW', items:[['Dashboard',LayoutDashboard],['Students',Users],['Admissions',UserPlus]]},
    {group:'ACADEMICS', items:[['Attendance',CalendarCheck],['Exams & Results',ClipboardList],['Classes & Courses',BookOpen],['Timetable',Clock3]]},
    {group:'FINANCE', items:[['Fees & Accounts',Wallet]]},
    {group:'PEOPLE & SYSTEM', items:[['Teachers & Staff',GraduationCap],['Leave Requests',CalendarCheck],['Reports',FileText],['Settings',Settings]]}
  ];
  const statCards = [
    {label:'Total students', value:summary?.metrics?.totalStudents ?? '—', note:`${summary?.metrics?.activeStudents ?? 0} active students`, icon:Users, tint:'blue'},
    {label:'New admissions', value:summary?.metrics?.newAdmissionsThisMonth ?? '—', note:'This month', icon:UserPlus, tint:'gold'},
    {label:'Fees collected', value:money(summary?.metrics?.feesCollectedThisMonth), note:'This month · recorded payments', icon:CircleDollarSign, tint:'green'},
    {label:'Outstanding fees', value:money(summary?.metrics?.outstandingFees), note:'Unpaid invoice balance', icon:Wallet, tint:'purple'}
  ];
  const initials = user.name?.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() || 'AZ';

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand sidebar-brand"><span className="brand-mark">A</span><span>AZHARIX<small>COLLEGE MANAGEMENT</small></span><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="campus-pill"><span className="campus-dot"></span><span><b>AZHARIX College</b><small>Academic workspace</small></span><ChevronDown size={15}/></div>
      <nav>{nav.map(group=><div className="nav-group" key={group.group}><div className="nav-label">{group.group}</div>{group.items.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMobileNav(false);setNotice('');}}><Icon size={18}/><span>{label}</span>{label==='Leave Requests' && summary?.metrics?.pendingLeaveRequests>0 && <i className="nav-count">{summary.metrics.pendingLeaveRequests}</i>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="support-card"><div className="support-icon"><School size={18}/></div><b>College workspace</b><p>Keep your academic operations organized and connected.</p><span>PHASE 1 · ADMIN FOUNDATION</span></div><button className="nav-item" onClick={logout}><LogOut size={18}/><span>Sign out</span></button></div>
    </aside>
    {mobileNav && <div className="nav-scrim" onClick={()=>setMobileNav(false)}></div>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="hamburger" onClick={()=>setMobileNav(true)}><Menu/></button><div><div className="breadcrumbs">AZHARIX <span>/</span> {page}</div><h1>{page}</h1></div></div><div className="topbar-actions"><div className="system-status"><span></span> Local workspace</div><button className="icon-btn" title="Notifications"><Bell size={19}/><i></i></button><div className="user-menu"><div className="avatar">{initials}</div><div className="user-meta"><b>{user.name}</b><small>{user.role.replaceAll('_',' ')}</small></div><ChevronDown size={15}/></div></div></header>
      <div className="page-content">
        {error && <div className="error-banner page-alert"><AlertCircle size={17}/>{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}
        {notice && <div className="success-banner page-alert"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice('')}><X size={16}/></button></div>}
        {page==='Dashboard' && <>
          <div className="welcome-row"><div><div className="eyebrow">COLLEGE OVERVIEW</div><h2>Good to see you, {user.name.split(' ')[0]} <span>✦</span></h2><p>Here’s what’s happening across your college today.</p></div><div className="welcome-actions"><button className="secondary-btn" onClick={loadDashboard}><RefreshCw size={16}/> Refresh</button><button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/> Add student</button></div></div>
          <div className="date-strip"><CalendarCheck size={16}/><span>{new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span><span className="date-separator"></span><span>Academic operations at a glance</span></div>
          <div className="stat-grid">{statCards.map((s,i)=><div className="stat-card" key={s.label}><div className={`stat-icon ${s.tint}`}><s.icon size={20}/></div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div><div className="stat-note"><span className="note-dot"></span>{s.note}</div></div>)}</div>
          <div className="section-heading"><div><h3>Academic snapshot</h3><p>Live counts from your database</p></div><span className="live-label"><span></span> LIVE DATA</span></div>
          <div className="snapshot-grid">
            <div className="snapshot-card"><div className="snapshot-top"><div className="snapshot-icon blue"><GraduationCap size={20}/></div><span>People</span></div><div className="snapshot-row"><span>Active students</span><b>{summary?.metrics?.activeStudents ?? '—'}</b></div><div className="snapshot-row"><span>Teachers on record</span><b>{summary?.metrics?.totalTeachers ?? '—'}</b></div><div className="snapshot-row"><span>Pending leave requests</span><b>{summary?.metrics?.pendingLeaveRequests ?? '—'}</b></div></div>
            <div className="snapshot-card"><div className="snapshot-top"><div className="snapshot-icon gold"><ClipboardList size={20}/></div><span>Assessments</span></div><div className="snapshot-row"><span>Exams created</span><b>{summary?.metrics?.totalExams ?? '—'}</b></div><div className="snapshot-row"><span>New admissions this month</span><b>{summary?.metrics?.newAdmissionsThisMonth ?? '—'}</b></div><div className="snapshot-row"><span>Student records</span><b>{summary?.metrics?.totalStudents ?? '—'}</b></div></div>
            <div className="snapshot-card highlight-card"><div className="snapshot-top"><div className="snapshot-icon green"><Activity size={20}/></div><span>System status</span></div><div className="status-line"><CheckCircle2 size={17}/><div><b>Admin workspace ready</b><small>Connected API and database required</small></div></div><div className="status-line"><ShieldCheck size={17}/><div><b>Protected admin routes</b><small>Role checks enforced by the API</small></div></div></div>
          </div>
          <div className="section-heading recent-heading"><div><h3>Recently registered students</h3><p>Latest student records in the system</p></div><button className="text-btn" onClick={()=>{setPage('Students');loadStudents('')}}>View all students <ArrowUpRight size={15}/></button></div>
          <StudentTable students={students.slice(0,5)} compact/>
        </>}
        {page==='Students' && <><div className="welcome-row"><div><div className="eyebrow">STUDENT RECORDS</div><h2>Student directory</h2><p>Search, review and register college students.</p></div><button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/> Register student</button></div><div className="table-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadStudents(search)} placeholder="Search name, student ID or class..."/></div><button className="secondary-btn" onClick={()=>loadStudents(search)}><Search size={16}/> Search</button><span className="result-count">{studentTotal} records</span></div><StudentTable students={students} onStatus={async (id,status)=>{try{await request(`/students/${id}/status`,{method:'PATCH',body:JSON.stringify({status})});loadStudents(search)}catch(e){setError(e.message)}}}/></>}
        {page!=='Dashboard' && page!=='Students' && <div className="coming-card"><div className="coming-icon"><ClipboardList size={28}/></div><div className="eyebrow">PHASED DEVELOPMENT</div><h2>{page}</h2><p>This module is included in the AZHARIX build plan. Phase 1 establishes the secure admin foundation, database schema and student registration. The next phases will connect this module to real workflows and role-specific portals.</p><div className="coming-list"><span><CheckCircle2 size={16}/> Database model foundation</span><span><CheckCircle2 size={16}/> Role-based access foundation</span><span><Clock3 size={16}/> Full workflow implementation planned next</span></div><button className="secondary-btn" onClick={()=>setPage('Dashboard')}>Back to dashboard</button></div>}
        <footer className="page-footer"><span>© 2026 AZHARIX College Management</span><span><ShieldCheck size={14}/> Secure workspace · Phase 1</span></footer>
      </div>
    </main>
    {showAdd && <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setShowAdd(false)}><form className="modal" onSubmit={createStudent}><div className="modal-head"><div><div className="eyebrow">STUDENT REGISTRATION</div><h2>Add a student</h2></div><button type="button" className="icon-btn" onClick={()=>setShowAdd(false)}><X/></button></div><div className="form-grid"><div className="field"><label>Student ID *</label><input required value={form.studentCode} onChange={e=>setForm({...form,studentCode:e.target.value})} placeholder="AZH-2026-004"/></div><div className="field"><label>Class / Course *</label><input required value={form.className} onChange={e=>setForm({...form,className:e.target.value})} placeholder="First Year"/></div><div className="field"><label>First name *</label><input required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} placeholder="First name"/></div><div className="field"><label>Last name *</label><input required value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} placeholder="Last name"/></div><div className="field"><label>Section</label><input value={form.section} onChange={e=>setForm({...form,section:e.target.value})} placeholder="A"/></div><div className="field"><label>Student phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="03xx-xxxxxxx"/></div><div className="field"><label>Guardian name</label><input value={form.guardianName} onChange={e=>setForm({...form,guardianName:e.target.value})} placeholder="Parent / guardian"/></div><div className="field"><label>Guardian phone</label><input value={form.guardianPhone} onChange={e=>setForm({...form,guardianPhone:e.target.value})} placeholder="03xx-xxxxxxx"/></div><div className="field full-field"><label>Email address</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Optional"/></div></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setShowAdd(false)}>Cancel</button><button className="primary-btn" type="submit"><CheckCircle2 size={16}/> Save student</button></div></form></div>}
  </div>;
}

function StudentTable({ students, compact=false, onStatus }) {
  if (!students?.length) return <div className="empty-state"><Users size={28}/><b>No student records yet</b><span>Register a student to see them listed here.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Status</th><th>Admission date</th>{!compact&&<th>Actions</th>}</tr></thead><tbody>{students.map(s=><tr key={s.id}><td><div className="student-cell"><div className="student-avatar">{(s.firstName?.[0]||'S')+(s.lastName?.[0]||'')}</div><div><b>{s.firstName} {s.lastName}</b><small>{s.email || 'Student profile'}</small></div></div></td><td><span className="code-pill">{s.studentCode}</span></td><td>{s.className}{s.section?` · ${s.section}`:''}</td><td><span className={`status-pill ${s.status?.toLowerCase()}`}>{s.status?.toLowerCase()}</span></td><td>{dateText(s.admissionDate || s.createdAt)}</td>{!compact&&<td><select className="status-select" aria-label="Change student status" value={s.status} onChange={e=>onStatus?.(s.id,e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="GRADUATED">Graduated</option><option value="SUSPENDED">Suspended</option></select></td>}</tr>)}</tbody></table></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
