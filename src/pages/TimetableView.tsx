import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Calendar, 
  Plus, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Layers,
  Sparkles,
  Search,
  Filter,
  Pencil,
  Copy
} from 'lucide-react';
import { api, peekApiCache } from '../api/apiClient';
import { useApiCacheSync } from '../lib/useApiCacheSync';
import { Batch, Subject, Teacher } from '../types';
import { ModernSelect } from '../components/ModernSelect';
import { timeRangesOverlap } from '../lib/timeOverlap';
import { showToast } from '../lib/toast';

interface TimetableViewProps {
  batches?: Batch[];
  subjects?: Subject[];
  teachers?: Teacher[];
}

export const TimetableView: React.FC<TimetableViewProps> = ({ 
  batches: propBatches, 
  subjects: propSubjects, 
  teachers: propTeachers 
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [timetableSlots, setTimetableSlots] = useState<any[]>(() => peekApiCache<any[]>('/timetable') || []);
  const [batches, setBatches] = useState<Batch[]>(propBatches || peekApiCache<any[]>('/batches') || []);
  const [subjects, setSubjects] = useState<Subject[]>(propSubjects || peekApiCache<any[]>('/subjects') || []);
  const [teachers, setTeachers] = useState<Teacher[]>(propTeachers || peekApiCache<any[]>('/teachers') || []);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('ALL');

  // Add Slot Modal State
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [formDay, setFormDay] = useState('Monday');
  const [formBatchId, setFormBatchId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('10:30 AM');
  const [formTopic, setFormTopic] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'teacher' | 'room'>('day');
  const [copyTargets, setCopyTargets] = useState<string[]>([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchInitialData = async () => {
    try {
      const [slotsData, batchesData, subjectsData, teachersData] = await Promise.all([
        api.getTimetableSlots().catch(() => []),
        api.getBatches().catch(() => []),
        api.getSubjects().catch(() => []),
        api.getTeachers().catch(() => [])
      ]);

      setTimetableSlots(Array.isArray(slotsData) ? slotsData : []);
      setBatches(batchesData || []);
      setSubjects(subjectsData || []);
      const activeTeachers = (teachersData || []).filter((t: any) => {
        const st = (t.status || '').toLowerCase();
        return st !== 'terminated' && st !== 'inactive' && st !== 'left' && st !== 'resigned';
      });
      setTeachers(activeTeachers);

      if (batchesData && batchesData.length > 0 && !formBatchId) setFormBatchId(batchesData[0].id);
      if (subjectsData && subjectsData.length > 0 && !formSubjectId) setFormSubjectId(subjectsData[0].id);
      if (activeTeachers.length > 0 && !formTeacherId) setFormTeacherId(activeTeachers[0].id);
    } catch (err) {
      console.error('Error loading timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);
  useApiCacheSync<any[]>('/timetable', rows => { if (Array.isArray(rows)) setTimetableSlots(rows); });

  // Filtered slots for selected day and filters
  const daySlots = timetableSlots.filter(s => s.day === selectedDay);
  const filteredSlots = daySlots.filter(slot => {
    const matchesSearch = !searchQuery || 
      slot.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      slot.batch?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.teacher?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.room?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatchFilter === 'ALL' || slot.batch_id === selectedBatchFilter || slot.batch?.id === selectedBatchFilter;
    const matchesRoom = selectedRoomFilter === 'ALL' || slot.room === selectedRoomFilter;
    return matchesSearch && matchesBatch && matchesRoom;
  });

  // Extract unique rooms for filter
  const uniqueRooms = Array.from(new Set(timetableSlots.map(s => s.room).filter(Boolean)));

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const payload = {
      day: formDay,
      startTime: formStartTime,
      endTime: formEndTime,
      room: formRoom.trim(),
      batchId: formBatchId,
      subjectId: formSubjectId || undefined,
      teacherId: formTeacherId || undefined,
      topic: formTopic.trim() || undefined
    };

    if (!payload.batchId) {
      setConflictError('Pick a batch. The timetable does not invent one.');
      return;
    }

    const localConflict = timetableSlots.find(s =>
      s.id !== editingSlotId &&
      s.day === formDay &&
      (
        (formRoom.trim() && s.room && s.room.toLowerCase() === formRoom.trim().toLowerCase() &&
          timeRangesOverlap(formStartTime, formEndTime, s.start_time, s.end_time)) ||
        (formTeacherId && (s.teacher_id === formTeacherId || s.teacher?.id === formTeacherId) &&
          timeRangesOverlap(formStartTime, formEndTime, s.start_time, s.end_time))
      )
    );

    if (localConflict) {
      setConflictError(`Clash with "${localConflict.batch?.name}" (${localConflict.start_time}–${localConflict.end_time}) on ${formDay}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSlotId) {
        const res = await api.updateTimetableSlot(editingSlotId, payload);
        setTimetableSlots(prev => prev.map(s => s.id === editingSlotId ? (res || { ...s, ...payload }) : s));
        showToast('Slot updated.', 'success');
      } else {
        const res = await api.createTimetableSlot(payload);
        setTimetableSlots(prev => [res || { ...payload, id: `slot-${Date.now()}` }, ...prev]);
        showToast('Slot added.', 'success');
      }
      setIsAddSlotOpen(false);
      setEditingSlotId(null);
      setFormTopic('');
      setConflictError(null);
    } catch (err: any) {
      setConflictError(err.message || 'Could not save slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    // 0ms Optimistic UI update
    setTimetableSlots(prev => prev.filter(s => s.id !== slotId));

    try {
      await api.deleteTimetableSlot(slotId);
    } catch (err) {
      console.error('Error deleting timetable slot:', err);
      fetchInitialData();
    }
  };

  // Metrics for selected day
  const classesTodayCount = daySlots.length;
  const facultyOnDutyCount = new Set(daySlots.map(s => s.teacher_id || s.teacher?.id).filter(Boolean)).size;
  const roomsInUseCount = new Set(daySlots.map(s => s.room).filter(Boolean)).size;
  const conflictCount = timetableSlots.reduce((count, slot, idx) => {
    const clash = timetableSlots.some((other, j) =>
      j !== idx &&
      other.day === slot.day &&
      (
        (slot.room && other.room && slot.room.toLowerCase() === other.room.toLowerCase() &&
          timeRangesOverlap(slot.start_time, slot.end_time, other.start_time, other.end_time)) ||
        (slot.teacher_id && other.teacher_id && slot.teacher_id === other.teacher_id &&
          timeRangesOverlap(slot.start_time, slot.end_time, other.start_time, other.end_time))
      )
    );
    return count + (clash ? 1 : 0);
  }, 0);

  const batchOptions = [
    { value: 'ALL', label: 'All Cohorts' },
    ...batches.map(b => ({ value: b.id, label: b.name }))
  ];

  const roomOptions = [
    { value: 'ALL', label: 'All Rooms / Labs' },
    ...uniqueRooms.map(r => ({ value: r, label: r }))
  ];

  const modalBatchOptions = batches.map(b => ({ value: b.id, label: b.name }));
  const modalSubjectOptions = subjects.map(s => ({ value: s.id, label: s.name }));
  const modalTeacherOptions = teachers.map(t => ({ 
    value: t.id, 
    label: (t as any)?.user?.full_name || (t as any)?.user?.name || t.name || 'Assigned Faculty' 
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Academic Timetable & Room Planner
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Conflict-free weekly schedule matrix, room allocation, and faculty collision solver
          </p>
        </div>
        <div className="header-action-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={async () => {
              const targets = copyTargets.length ? copyTargets : daysOfWeek.filter(d => d !== selectedDay);
              try {
                const res = await api.copyTimetableDay(selectedDay, targets);
                showToast(`Copied ${res.createdCount || 0} slot(s). Skipped ${res.skippedCount || 0} clash(es).`, 'success');
                fetchInitialData();
              } catch (err: any) {
                showToast(err.message || 'Copy failed.', 'error');
              }
            }}
          >
            <Copy size={16} /> Copy {selectedDay} to other days
          </button>
          <button 
            className="btn-primary" 
            onClick={() => {
              setFormDay(selectedDay);
              setEditingSlotId(null);
              setConflictError(null);
              setIsAddSlotOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Add Schedule Slot
          </button>
        </div>
      </div>

      {/* Top Academic Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Classes on {selectedDay}</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{classesTodayCount} Slots</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Active Rooms in Use</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', marginTop: 2 }}>{roomsInUseCount} Rooms</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Faculty on Duty</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563EB', marginTop: 2 }}>{facultyOnDutyCount} Teachers</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(15,23,42,0.03)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#86198F', textTransform: 'uppercase' }}>Range clashes</span>
          <div style={{ fontSize: 22, fontWeight: 900, color: conflictCount ? '#DC2626' : '#15803D', marginTop: 2 }}>{conflictCount ? `${conflictCount} found` : 'None'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {(['day', 'week'] as const).map(mode => (
          <button
            key={mode}
            type="button"
            className={viewMode === mode ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setViewMode(mode)}
          >
            {mode === 'day' ? 'Day' : 'Week grid'}
          </button>
        ))}
      </div>

      {/* Weekday Navigation Bar (Rule 15 Navy Solid Pill standard) */}
      <div style={{ 
        display: 'flex', 
        gap: 6, 
        background: '#FFFFFF', 
        padding: '6px 8px', 
        borderRadius: 12, 
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        boxShadow: '0 1px 3px rgba(15,23,42,0.02)'
      }}>
        {daysOfWeek.map(day => {
          const isActive = selectedDay === day;
          const count = timetableSlots.filter(s => s.day === day).length;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1,
                minWidth: 100,
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? '#0F172A' : 'transparent',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Calendar size={14} color={isActive ? '#FFFFFF' : '#64748B'} />
              {day}
              <span style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9999,
                background: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: isActive ? '#FFFFFF' : '#64748B',
                fontWeight: 600
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modern Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        background: '#FFFFFF', 
        padding: '12px 16px', 
        borderRadius: 14, 
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.02)'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <input 
            type="text" 
            placeholder="Search subject, cohort, teacher, or room..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              height: 38, 
              paddingLeft: 12, 
              paddingRight: 12, 
              borderRadius: 10, 
              border: '1px solid #CBD5E1', 
              fontSize: 13, 
              color: '#0F172A',
              background: '#FFFFFF',
              outline: 'none'
            }} 
          />
        </div>

        <div style={{ width: 180 }}>
          <ModernSelect
            options={batchOptions}
            value={selectedBatchFilter}
            onChange={setSelectedBatchFilter}
            placeholder="All Cohorts"
          />
        </div>

        <div style={{ width: 180 }}>
          <ModernSelect
            options={roomOptions}
            value={selectedRoomFilter}
            onChange={setSelectedRoomFilter}
            placeholder="All Rooms"
          />
        </div>
      </div>

      {viewMode === 'week' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                {daysOfWeek.map(day => <th key={day}>{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(timetableSlots.map(s => `${s.start_time}|${s.end_time}`))).sort().map(key => {
                const [start, end] = key.split('|');
                return (
                  <tr key={key}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{start}–{end}</td>
                    {daysOfWeek.map(day => {
                      const cell = timetableSlots.filter(s => s.day === day && s.start_time === start && s.end_time === end);
                      return (
                        <td key={day} style={{ fontSize: 12, verticalAlign: 'top' }}>
                          {cell.map(s => (
                            <div key={s.id} style={{ marginBottom: 6 }}>
                              <strong>{s.batch?.name || 'Batch'}</strong>
                              <div>{s.subject?.name || ''}</div>
                              <div style={{ color: '#64748B' }}>{s.room || ''} {s.teacher?.user?.full_name || ''}</div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {timetableSlots.length === 0 && <p style={{ padding: 16, color: '#64748B' }}>No weekly slots yet.</p>}
        </div>
      )}

      {/* Timetable Schedule Grid */}
      {viewMode === 'day' && filteredSlots.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filteredSlots.map((slot) => (
            <div 
              key={slot.id} 
              style={{ 
                background: '#FFFFFF', 
                borderRadius: 14, 
                border: '1px solid #E2E8F0', 
                padding: 16, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 10, 
                boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                position: 'relative'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 600 }}>
                  {slot.batch?.name || 'General Cohort'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} color="#64748B" /> {slot.start_time} – {slot.end_time}
                  </span>
                  <button
                    onClick={() => {
                      setEditingSlotId(slot.id);
                      setFormDay(slot.day);
                      setFormBatchId(slot.batch_id || slot.batch?.id || '');
                      setFormSubjectId(slot.subject_id || slot.subject?.id || '');
                      setFormTeacherId(slot.teacher_id || slot.teacher?.id || '');
                      setFormRoom(slot.room || '');
                      setFormStartTime(slot.start_time);
                      setFormEndTime(slot.end_time);
                      setFormTopic(slot.topic || '');
                      setConflictError(null);
                      setIsAddSlotOpen(true);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 2 }}
                    title="Edit slot"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 2 }}
                    title="Remove Slot"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Subject & Topic */}
              <div>
                <h3 style={{ fontSize: 14.5, fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  {slot.subject?.name || slot.subject || 'Curriculum Subject'}
                </h3>
                {slot.topic && (
                  <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>
                    Topic: {slot.topic}
                  </p>
                )}
              </div>

              {/* Room & Teacher Badges */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: '#F8FAFC', 
                padding: '8px 12px', 
                borderRadius: 10, 
                border: '1px solid #E2E8F0',
                fontSize: 12,
                marginTop: 2
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0F172A', fontWeight: 600 }}>
                  <MapPin size={13} color="#2563EB" /> {slot.room}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0F172A', fontWeight: 600 }}>
                  <User size={13} color="#16A34A" /> {slot.teacher?.user?.full_name || slot.teacher || 'Assigned Faculty'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'day' ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', color: '#94A3B8' }}>
          <Clock size={40} color="#CBD5E1" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px auto' }} />
          <strong style={{ fontSize: 15, color: '#0F172A' }}>No Classes Scheduled for {selectedDay}</strong>
          <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0 0' }}>
            Click "Add Schedule Slot" above to schedule a class for this weekday.
          </p>
        </div>
      ) : null}

      {/* 4-Island Floating Architecture: Add Schedule Slot Modal */}
      {isAddSlotOpen && (
        <div 
          className="floating-island-overlay" 
          onClick={() => setIsAddSlotOpen(false)}
          style={{ zIndex: 1300 }}
        >
          <div 
            className="floating-island-container" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 540 }}
          >
            {/* Island 1: Floating Dark Navy Header */}
            <div style={{ 
              background: '#0F172A', 
              color: '#FFFFFF', 
              padding: '16px 20px', 
              borderRadius: 16, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <Clock size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                    {editingSlotId ? 'Edit class slot' : 'Schedule Class Slot'}
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Assign cohort, subject, room & faculty with automated conflict validation
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddSlotOpen(false)} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: 'none', 
                  color: '#94A3B8', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Island 3: Scrollable Form Card */}
            <div style={{ 
              padding: 22, 
              background: '#FFFFFF', 
              borderRadius: 16, 
              border: '1px solid #E2E8F0', 
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              maxHeight: '70vh', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}>
              {/* Conflict Error Callout */}
              {conflictError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  color: '#991B1B',
                  fontSize: 12.5,
                  fontWeight: 600
                }}>
                  <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>{conflictError}</div>
                </div>
              )}

              <form id="add-slot-form" onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Weekday</label>
                    <ModernSelect
                      options={daysOfWeek.map(d => ({ value: d, label: d }))}
                      value={formDay}
                      onChange={setFormDay}
                      placeholder="Select Day"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Target Cohort</label>
                    <ModernSelect
                      options={modalBatchOptions.length > 0 ? modalBatchOptions : [{ value: '', label: 'General Batch' }]}
                      value={formBatchId}
                      onChange={setFormBatchId}
                      placeholder="Select Cohort"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Curriculum Subject</label>
                    <ModernSelect
                      options={modalSubjectOptions.length > 0 ? modalSubjectOptions : [{ value: '', label: 'General Subject' }]}
                      value={formSubjectId}
                      onChange={setFormSubjectId}
                      placeholder="Select Subject"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Assigned Faculty</label>
                    <ModernSelect
                      options={modalTeacherOptions.length > 0 ? modalTeacherOptions : [{ value: '', label: 'General Faculty' }]}
                      value={formTeacherId}
                      onChange={setFormTeacherId}
                      placeholder="Select Faculty"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Room / Lab</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formRoom} 
                      onChange={e => setFormRoom(e.target.value)} 
                      placeholder="e.g. Room 101"
                      style={{ height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600 }}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Start Time</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formStartTime} 
                      onChange={e => setFormStartTime(e.target.value)} 
                      placeholder="09:00 AM"
                      style={{ height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600 }}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>End Time</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formEndTime} 
                      onChange={e => setFormEndTime(e.target.value)} 
                      placeholder="10:30 AM"
                      style={{ height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600 }}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Topic / Lecture Description</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Chapter 4: Quadratic Equations" 
                    value={formTopic} 
                    onChange={e => setFormTopic(e.target.value)} 
                    style={{ height: 38, borderRadius: 10, fontSize: 13 }}
                  />
                </div>
              </form>
            </div>

            {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button 
                type="button" 
                onClick={() => setIsAddSlotOpen(false)}
                style={{ 
                  padding: '9px 20px', 
                  borderRadius: 9999, 
                  border: '1px solid #CBD5E1', 
                  background: '#FFFFFF', 
                  color: '#334155', 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-slot-form"
                disabled={isSubmitting}
                style={{ 
                  padding: '9px 24px', 
                  borderRadius: 9999, 
                  border: 'none', 
                  background: isSubmitting ? '#94A3B8' : '#0F172A', 
                  color: '#FFFFFF', 
                  fontWeight: 700, 
                  fontSize: 13, 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
                }}
              >
                <Plus size={15} /> {isSubmitting ? 'Validating...' : 'Schedule Class Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TimetableView;
