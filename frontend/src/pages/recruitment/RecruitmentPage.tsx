import { useState } from 'react';
import {
    Briefcase, Plus, Search, Mail, Phone, Calendar,
    ChevronRight, User, MoreHorizontal, Clock, CheckCircle, XCircle,
    Star, MapPin, Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

interface Candidate {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    department: string;
    stage: Stage;
    appliedDate: string;
    experience: string;
    rating?: number;
    location?: string;
    note?: string;
}

// ─── Static Config ─────────────────────────────────────────────────────────────

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
    { id: 'applied',   label: 'Applied',   color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    { id: 'screening', label: 'Screening', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
    { id: 'interview', label: 'Interview', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
    { id: 'offer',     label: 'Offer',     color: '#7c3aed', bg: 'rgba(124,58,237,0.1)'  },
    { id: 'hired',     label: 'Hired',     color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
    { id: 'rejected',  label: 'Rejected',  color: '#dc2626', bg: 'rgba(220,38,38,0.07)'  },
];

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Sales', 'Operations', 'Design'];

const INITIAL_CANDIDATES: Candidate[] = [
    { id: '1', name: 'Aanya Kapoor', email: 'aanya@example.com', phone: '+91 98765 43210', role: 'Senior Frontend Engineer', department: 'Engineering', stage: 'interview', appliedDate: '2026-02-10', experience: '5 years', rating: 4, location: 'Pune', note: 'Strong React skills, portfolio looks great' },
    { id: '2', name: 'Rohan Mehta', email: 'rohan@example.com', role: 'Product Designer', department: 'Design', stage: 'screening', appliedDate: '2026-02-14', experience: '3 years', rating: 3, location: 'Mumbai' },
    { id: '3', name: 'Priya Joshi', email: 'priya@example.com', phone: '+91 87654 32109', role: 'HR Manager', department: 'HR', stage: 'offer', appliedDate: '2026-02-05', experience: '7 years', rating: 5, location: 'Bangalore', note: 'Excellent cultural fit, references checked' },
    { id: '4', name: 'Dev Sharma', email: 'dev@example.com', role: 'Backend Engineer', department: 'Engineering', stage: 'applied', appliedDate: '2026-02-18', experience: '2 years', location: 'Remote' },
    { id: '5', name: 'Neha Singh', email: 'neha@example.com', role: 'Marketing Lead', department: 'Marketing', stage: 'applied', appliedDate: '2026-02-19', experience: '4 years', rating: 3 },
    { id: '6', name: 'Arjun Patel', email: 'arjun@example.com', role: 'Sales Executive', department: 'Sales', stage: 'hired', appliedDate: '2026-01-28', experience: '6 years', rating: 5, note: 'Start date: March 1st' },
    { id: '7', name: 'Sneha Verma', email: 'sneha@example.com', role: 'Data Analyst', department: 'Engineering', stage: 'rejected', appliedDate: '2026-02-01', experience: '1 year' },
];

const JOB_OPENINGS = [
    { id: '1', title: 'Senior Frontend Engineer', dept: 'Engineering', openings: 2, applicants: 14 },
    { id: '2', title: 'Product Designer', dept: 'Design', openings: 1, applicants: 8 },
    { id: '3', title: 'HR Manager', dept: 'HR', openings: 1, applicants: 5 },
    { id: '4', title: 'Backend Engineer', dept: 'Engineering', openings: 3, applicants: 22 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarBg(name: string) {
    const colors = ['#0d968b', '#7c3aed', '#3b82f6', '#10b981', '#f59e0b'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
    const init = name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    return <div className={`avatar avatar-${size}`} style={{ background: getAvatarBg(name) }}>{init}</div>;
}

function StarRating({ value }: { value?: number }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3,4,5].map(i => (
                <Star key={i} size={11} fill={i <= value ? '#f59e0b' : 'none'} color={i <= value ? '#f59e0b' : '#cbd5e1'} />
            ))}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RecruitmentPage() {
    const [view, setView] = useState<'pipeline' | 'jobs'>('pipeline');
    const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

    const filtered = candidates.filter(c => {
        const q = search.toLowerCase();
        const matchSearch = !q || c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
        const matchDept = deptFilter === 'All' || c.department === deptFilter;
        return matchSearch && matchDept;
    });

    // Drag and drop
    const handleDragStart = (id: string) => setDragId(id);

    const handleDrop = (stage: Stage) => {
        if (!dragId) return;
        setCandidates(prev => prev.map(c => c.id === dragId ? { ...c, stage } : c));
        toast.success(`Moved to ${STAGES.find(s => s.id === stage)?.label}`);
        setDragId(null);
        setDragOverStage(null);
    };

    const moveCandidate = (id: string, newStage: Stage) => {
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
        if (selectedCandidate?.id === id) {
            setSelectedCandidate(prev => prev ? { ...prev, stage: newStage } : null);
        }
    };

    const getNextStage = (current: Stage): Stage | null => {
        const order: Stage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];
        const idx = order.indexOf(current);
        return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
    };

    const summary = {
        total: candidates.length,
        active: candidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length,
        hired: candidates.filter(c => c.stage === 'hired').length,
        toReview: candidates.filter(c => c.stage === 'applied').length,
    };

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Recruitment</h1>
                    <p className="page-subtitle">Manage candidates and hiring pipeline</p>
                </div>
                <div className="page-actions">
                    <div style={{
                        display: 'flex', background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius)', padding: 3, gap: 3,
                    }}>
                        {(['pipeline', 'jobs'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)} style={{
                                padding: '6px 14px', border: 'none', cursor: 'pointer',
                                borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                                background: view === v ? 'var(--bg-white)' : 'transparent',
                                color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
                                boxShadow: view === v ? 'var(--shadow-xs)' : 'none',
                                transition: 'all 0.15s',
                            }}>
                                {v === 'pipeline' ? 'Pipeline' : 'Job Openings'}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={15} /> Add Candidate
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total Candidates', value: summary.total, color: '#0d968b', bg: 'rgba(13,150,139,0.1)' },
                    { label: 'Active Pipeline', value: summary.active, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Hired This Month', value: summary.hired, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Need Review', value: summary.toReview, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                ].map(c => (
                    <div className="stat-card" key={c.label}>
                        <div className="stat-card-header">
                            <span className="stat-card-label">{c.label}</span>
                            <div className="stat-card-icon" style={{ background: c.bg }}>
                                <Briefcase size={17} color={c.color} />
                            </div>
                        </div>
                        <div className="stat-card-value">{c.value}</div>
                    </div>
                ))}
            </div>

            {view === 'jobs' ? (
                <JobsView />
            ) : (
                <>
                    {/* Search + Filter */}
                    <div className="search-filter-bar">
                        <div className="search-input-wrapper">
                            <span className="search-input-icon"><Search size={15} /></span>
                            <input type="text" className="search-input"
                                placeholder="Search candidates, roles..."
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="filter-chips">
                            {['All', ...DEPARTMENTS].map(d => (
                                <button key={d} className={`filter-chip${deptFilter === d ? ' active' : ''}`}
                                    onClick={() => setDeptFilter(d)}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <div style={{
                        display: 'flex', gap: 14, overflowX: 'auto',
                        paddingBottom: 8, minHeight: 500,
                    }}>
                        {STAGES.map(stage => {
                            const stageCandidates = filtered.filter(c => c.stage === stage.id);
                            const isDragOver = dragOverStage === stage.id;

                            return (
                                <div
                                    key={stage.id}
                                    style={{ flex: '0 0 220px', minWidth: 220 }}
                                    onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
                                    onDragLeave={() => setDragOverStage(null)}
                                    onDrop={() => handleDrop(stage.id)}
                                >
                                    {/* Column Header */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: 12,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <div style={{
                                                width: 9, height: 9, borderRadius: '50%',
                                                background: stage.color, flexShrink: 0,
                                            }} />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {stage.label}
                                            </span>
                                        </div>
                                        <span style={{
                                            background: stage.bg, color: stage.color,
                                            fontSize: 11, fontWeight: 700,
                                            padding: '2px 8px', borderRadius: 20,
                                        }}>
                                            {stageCandidates.length}
                                        </span>
                                    </div>

                                    {/* Drop Zone */}
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', gap: 10,
                                        minHeight: 80,
                                        background: isDragOver ? stage.bg : 'transparent',
                                        borderRadius: 'var(--radius-lg)',
                                        transition: 'background 0.15s',
                                        padding: isDragOver ? 4 : 0,
                                    }}>
                                        {stageCandidates.length === 0 && !isDragOver && (
                                            <div style={{
                                                border: '1.5px dashed var(--border)',
                                                borderRadius: 'var(--radius-lg)',
                                                height: 80, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--text-light)', fontSize: 12, fontWeight: 500,
                                            }}>
                                                Drop here
                                            </div>
                                        )}

                                        {stageCandidates.map(c => (
                                            <div
                                                key={c.id}
                                                draggable
                                                onDragStart={() => handleDragStart(c.id)}
                                                onClick={() => setSelectedCandidate(c)}
                                                style={{
                                                    background: 'var(--bg-white)',
                                                    border: `1px solid ${selectedCandidate?.id === c.id ? stage.color : 'var(--border)'}`,
                                                    borderRadius: 'var(--radius-lg)',
                                                    padding: 14,
                                                    cursor: 'grab',
                                                    boxShadow: 'var(--shadow-xs)',
                                                    transition: 'all 0.15s',
                                                    userSelect: 'none',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                                                    <Avatar name={c.name} size="sm" />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {c.name}
                                                        </div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {c.role}
                                                        </div>
                                                    </div>
                                                </div>

                                                {c.rating && <StarRating value={c.rating} />}

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                    <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
                                                        {c.experience}
                                                    </span>
                                                    {c.location && (
                                                        <span style={{ fontSize: 10, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                            <MapPin size={10} />{c.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Candidate Detail Panel */}
            {selectedCandidate && (
                <CandidateDrawer
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onMove={moveCandidate}
                    getNextStage={getNextStage}
                />
            )}

            {/* Add Candidate Modal */}
            {showAddModal && (
                <AddCandidateModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={c => {
                        setCandidates(prev => [...prev, c]);
                        setShowAddModal(false);
                    }}
                />
            )}
        </div>
    );
}

// ─── Candidate Detail Drawer ──────────────────────────────────────────────────

function CandidateDrawer({ candidate: c, onClose, onMove, getNextStage }: {
    candidate: Candidate;
    onClose: () => void;
    onMove: (id: string, stage: Stage) => void;
    getNextStage: (s: Stage) => Stage | null;
}) {
    const stage = STAGES.find(s => s.id === c.stage)!;
    const next = getNextStage(c.stage);

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
            background: 'var(--bg-white)', borderLeft: '1px solid var(--border)',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
            zIndex: 200, display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.2s ease',
        }}>
            <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

            {/* Header */}
            <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={c.name} size="lg" />
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{c.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{c.role}</div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: stage.bg, color: stage.color }}>
                        {stage.label}
                    </span>
                    <span className="badge badge-gray">{c.department}</span>
                    <span className="badge badge-gray">{c.experience} exp.</span>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
                {/* Contact */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
                        Contact
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                            <Mail size={14} color="var(--text-muted)" />{c.email}
                        </div>
                        {c.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                <Phone size={14} color="var(--text-muted)" />{c.phone}
                            </div>
                        )}
                        {c.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                <MapPin size={14} color="var(--text-muted)" />{c.location}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                            <Calendar size={14} />Applied {new Date(c.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Rating */}
                {c.rating && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                            Rating
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {[1,2,3,4,5].map(i => (
                                <Star key={i} size={20} fill={i <= (c.rating ?? 0) ? '#f59e0b' : 'none'} color={i <= (c.rating ?? 0) ? '#f59e0b' : '#cbd5e1'} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {c.note && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                            Notes
                        </div>
                        <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                            background: 'var(--bg-subtle)', borderRadius: 'var(--radius)',
                            padding: '10px 12px', margin: 0,
                        }}>
                            {c.note}
                        </p>
                    </div>
                )}

                {/* Stage Pipeline Visual */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
                        Pipeline
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {STAGES.filter(s => s.id !== 'rejected').map(s => {
                            const order: Stage[] = ['applied', 'screening', 'interview', 'offer', 'hired'];
                            const currentIdx = order.indexOf(c.stage);
                            const stageIdx = order.indexOf(s.id);
                            const isPast = stageIdx < currentIdx;
                            const isCurrent = s.id === c.stage;
                            return (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isPast || isCurrent ? s.bg : 'var(--bg-subtle)',
                                        border: `1.5px solid ${isCurrent ? s.color : isPast ? s.color : 'var(--border)'}`,
                                    }}>
                                        {isPast && <CheckCircle size={12} color={s.color} />}
                                        {isCurrent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />}
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                                        color: isCurrent ? s.color : isPast ? 'var(--text-muted)' : 'var(--text-light)',
                                    }}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8 }}>
                {next && (
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => { onMove(c.id, next); }}
                    >
                        Move to {STAGES.find(s => s.id === next)?.label}
                        <ChevronRight size={14} />
                    </button>
                )}
                {c.stage !== 'rejected' && c.stage !== 'hired' && (
                    <button
                        className="btn btn-danger"
                        onClick={() => { onMove(c.id, 'rejected'); onClose(); }}
                    >
                        <XCircle size={14} />
                        Reject
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Jobs View ────────────────────────────────────────────────────────────────

function JobsView() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Active Job Openings</span>
                <button className="btn btn-primary btn-sm"><Plus size={13} /> Post New Job</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {JOB_OPENINGS.map(job => (
                    <div key={job.id} style={{
                        background: 'var(--bg-white)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', padding: '18px 22px',
                        display: 'flex', alignItems: 'center', gap: 16,
                        boxShadow: 'var(--shadow-xs)',
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: 'var(--primary-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Briefcase size={20} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{job.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                {job.dept} · {job.openings} opening{job.openings > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{job.applicants}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Applicants</div>
                            </div>
                            <button className="btn btn-secondary btn-sm">View Pipeline</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Add Candidate Modal ──────────────────────────────────────────────────────

function AddCandidateModal({ onClose, onAdd }: {
    onClose: () => void;
    onAdd: (c: Candidate) => void;
}) {
    const [form, setForm] = useState({
        name: '', email: '', phone: '', role: '', department: 'Engineering',
        experience: '', location: '', note: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.role) {
            toast.error('Name, email and role are required');
            return;
        }
        const newCandidate: Candidate = {
            id: Date.now().toString(),
            ...form,
            stage: 'applied',
            appliedDate: new Date().toISOString().split('T')[0],
        };
        onAdd(newCandidate);
        toast.success(`${form.name} added to pipeline`);
    };

    const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">Add New Candidate</span>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className="form-input" placeholder="Jane Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input className="form-input" type="email" placeholder="jane@email.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Role Applying For *</label>
                                <input className="form-input" placeholder="Frontend Engineer" value={form.role} onChange={e => update('role', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <select className="form-input" value={form.department} onChange={e => update('department', e.target.value)}
                                    style={{ appearance: 'none', cursor: 'pointer' }}>
                                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => update('phone', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience</label>
                                <input className="form-input" placeholder="3 years" value={form.experience} onChange={e => update('experience', e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input className="form-input" placeholder="Mumbai, India" value={form.location} onChange={e => update('location', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea className="form-input" rows={2} placeholder="Any initial notes about this candidate..." value={form.note} onChange={e => update('note', e.target.value)} style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary"><Plus size={14} /> Add to Pipeline</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
