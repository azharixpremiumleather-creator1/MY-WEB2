import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters.');
  process.exit(1);
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please sign in.' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ error: 'You do not have permission for this action.' });
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Session is invalid or expired. Please sign in again.' });
    }
  };
}

async function logAction(actorId, action, entity, entityId, details = undefined) {
  try {
    await prisma.auditLog.create({ data: { actorId, action, entity, entityId, ...(details ? { details } : {}) } });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'AZHARIX College Management API' }));

app.post('/api/auth/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  await logAction(user.id, 'LOGIN', 'User', user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', auth(), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { id: true, name: true, email: true, role: true, active: true }
  });
  if (!user?.active) return res.status(401).json({ error: 'Account is inactive.' });
  res.json({ user });
});

app.get('/api/dashboard/summary', auth(['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN']), async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalStudents, activeStudents, totalTeachers, newAdmissions, invoices, pendingLeaves, recentStudents, unpaidInvoices, totalExams] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.teacher.count(),
    prisma.student.count({ where: { admissionDate: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { receivedAt: { gte: monthStart } } }),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.student.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, studentCode: true, firstName: true, lastName: true, className: true, status: true, createdAt: true } }),
    prisma.feeInvoice.aggregate({ _sum: { amount: true, paidAmount: true }, where: { status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] } } }),
    prisma.exam.count()
  ]);
  const collected = Number(invoices._sum.amount || 0);
  const unpaid = Math.max(0, Number(unpaidInvoices._sum.amount || 0) - Number(unpaidInvoices._sum.paidAmount || 0));
  res.json({
    metrics: { totalStudents, activeStudents, totalTeachers, newAdmissionsThisMonth: newAdmissions, feesCollectedThisMonth: collected, pendingLeaveRequests: pendingLeaves, outstandingFees: unpaid, totalExams },
    recentStudents
  });
});

app.get('/api/students', auth(['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'TEACHER']), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
  const search = String(req.query.search || '').trim();
  const where = search ? {
    OR: [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { studentCode: { contains: search, mode: 'insensitive' } },
      { className: { contains: search, mode: 'insensitive' } }
    ]
  } : {};
  const [items, total] = await Promise.all([
    prisma.student.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.student.count({ where })
  ]);
  res.json({ items, total, page, pageSize });
});

app.post('/api/students', auth(['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'RECEPTIONIST']), async (req, res) => {
  const schema = z.object({
    studentCode: z.string().trim().min(2).max(30),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    guardianName: z.string().max(100).optional(),
    guardianPhone: z.string().max(30).optional(),
    className: z.string().trim().min(1).max(80),
    section: z.string().max(30).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Check the student details.' });
  try {
    const d = parsed.data;
    const student = await prisma.student.create({ data: {
      studentCode: d.studentCode, firstName: d.firstName, lastName: d.lastName,
      email: d.email || null, phone: d.phone || null, guardianName: d.guardianName || null,
      guardianPhone: d.guardianPhone || null, className: d.className, section: d.section || null
    }});
    await logAction(req.user.sub, 'CREATE', 'Student', student.id, { studentCode: student.studentCode });
    res.status(201).json({ student });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'That student ID is already in use.' });
    console.error(e);
    res.status(500).json({ error: 'Could not save student.' });
  }
});

app.patch('/api/students/:id/status', auth(['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN']), async (req, res) => {
  const schema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED']) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid student status.' });
  try {
    const student = await prisma.student.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
    await logAction(req.user.sub, 'UPDATE_STATUS', 'Student', student.id, { status: student.status });
    res.json({ student });
  } catch {
    res.status(404).json({ error: 'Student not found.' });
  }
});

app.get('/api/audit-logs', auth(['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN']), async (_req, res) => {
  const items = await prisma.auditLog.findMany({ take: 30, orderBy: { createdAt: 'desc' }, include: { actor: { select: { name: true, email: true } } } });
  res.json({ items });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => console.log(`AZHARIX API running at http://localhost:${PORT}`));
