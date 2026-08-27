import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Navigation, 
  Compass, 
  MapPin, 
  CheckSquare, 
  Layers, 
  RefreshCw, 
  Activity, 
  Users 
} from 'lucide-react';
import { StaffMember, StaffType } from '../types';
import { api } from '../api/apiClient';
import { StaffAttendanceRegister } from '../components/StaffAttendanceRegister';
import { StaffAttendanceGateway } from '../components/StaffAttendanceGateway';
import { CampusGeofenceSettings } from '../components/CampusGeofenceSettings';

export const StaffAttendanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'gateway' | 'geofence'>('register');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStaffData = async () => {
    try {
      setIsLoading(true);
      const [staffData, typesData] = await Promise.all([
        api.getStaffList().catch(() => []),
        api.getStaffTypes().catch(() => [])
      ]);

      if (Array.isArray(staffData)) {
        setStaffList(staffData);
      }
      if (Array.isArray(typesData)) {
        setStaffTypes(typesData);
      }
    } catch (err) {
      console.warn('Error loading staff list for attendance view:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Directory Main Title Header */}
      <div className="directory-header-container">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Staff Geolocation Attendance & Geofencing
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2, margin: 0 }}>
            Enterprise GPS perimeter tracking, real-time Haversine distance verification, and administrative attendance overrides
          </p>
        </div>

        <div className="header-action-bar">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={fetchStaffData}
            title="Refresh Staff Roster"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Top Active Navy Solid Pill Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: '#FFFFFF',
          padding: 8,
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          style={{
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: activeTab === 'register' ? 800 : 600,
            border: 'none',
            background: activeTab === 'register' ? '#0F172A' : 'transparent',
            color: activeTab === 'register' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'register') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'register') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <FileText size={15} color={activeTab === 'register' ? '#FFFFFF' : '#64748B'} />
          Attendance Register (Daily & Monthly)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          style={{
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: activeTab === 'gateway' ? 800 : 600,
            border: 'none',
            background: activeTab === 'gateway' ? '#0F172A' : 'transparent',
            color: activeTab === 'gateway' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'gateway') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'gateway') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <Navigation size={15} color={activeTab === 'gateway' ? '#FFFFFF' : '#64748B'} />
          Staff Check-In / Out Gateway
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('geofence')}
          style={{
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: activeTab === 'geofence' ? 800 : 600,
            border: 'none',
            background: activeTab === 'geofence' ? '#0F172A' : 'transparent',
            color: activeTab === 'geofence' ? '#FFFFFF' : '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 0.15s ease, color 0.15s ease'
          }}
          onMouseEnter={e => {
            if (activeTab !== 'geofence') {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#0F172A';
            }
          }}
          onMouseLeave={e => {
            if (activeTab !== 'geofence') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }
          }}
        >
          <Compass size={15} color={activeTab === 'geofence' ? '#FFFFFF' : '#64748B'} />
          Campus GPS Geofence Settings
        </button>
      </div>

      {/* Sub-Tab View Rendering */}
      {activeTab === 'register' && (
        <StaffAttendanceRegister
          staffList={staffList}
          staffTypes={staffTypes}
          onRefreshData={fetchStaffData}
        />
      )}

      {activeTab === 'gateway' && (
        <StaffAttendanceGateway
          staffList={staffList}
          onAttendanceUpdated={() => fetchStaffData()}
        />
      )}

      {activeTab === 'geofence' && (
        <CampusGeofenceSettings
          onConfigSaved={() => fetchStaffData()}
        />
      )}
    </div>
  );
};

export default StaffAttendanceView;
