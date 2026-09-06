import React from 'react';

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'light' | 'dark' | 'circle' | 'pill';
}

/**
 * Base Shimmer Skeleton
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  style = {},
  width,
  height,
  borderRadius,
  variant = 'light'
}) => {
  const isDark = variant === 'dark';
  const isCircle = variant === 'circle';
  const isPill = variant === 'pill';

  const computedBorderRadius = borderRadius !== undefined
    ? borderRadius
    : isCircle
    ? '50%'
    : isPill
    ? '9999px'
    : '8px';

  return (
    <div
      className={`${isDark ? 'skeleton-pulse-dark' : 'skeleton-pulse'} ${className}`}
      style={{
        width: width !== undefined ? width : '100%',
        height: height !== undefined ? height : '16px',
        borderRadius: computedBorderRadius,
        flexShrink: 0,
        ...style
      }}
    />
  );
};

/**
 * Table Row Skeleton for <tr> inside <tbody>
 */
export interface TableRowSkeletonProps {
  columns: number;
  columnWidths?: (string | number)[];
}

export const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  columns,
  columnWidths = []
}) => {
  // Semi-randomized realistic widths for columns without explicit width
  const defaultWidths = ['70%', '85%', '50%', '65%', '40%', '80%', '60%', '45%'];

  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }}>
      {Array.from({ length: columns }).map((_, idx) => {
        const width = columnWidths[idx] || defaultWidths[idx % defaultWidths.length];
        return (
          <td key={idx} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton width={width} height={14} borderRadius={6} />
              {idx === 0 && (
                <Skeleton width="40%" height={10} borderRadius={4} />
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
};

/**
 * Table Skeleton: Renders N TableRowSkeleton instances
 */
export interface TableSkeletonProps {
  columns: number;
  rows?: number;
  columnWidths?: (string | number)[];
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  rows = 5,
  columnWidths
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <TableRowSkeleton
          key={idx}
          columns={columns}
          columnWidths={columnWidths}
        />
      ))}
    </>
  );
};

/**
 * KPI Stat Card Skeleton
 */
export const KpiCardSkeleton: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: '18px 20px',
        boxShadow: '0 2px 4px rgba(15,23,42,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="45%" height={12} borderRadius={4} />
        <Skeleton width={32} height={32} borderRadius={8} />
      </div>
      <Skeleton width="60%" height={28} borderRadius={8} />
      <Skeleton width="35%" height={11} borderRadius={4} />
    </div>
  );
};

/**
 * Card Skeleton (for Batch cards, Teacher cards, Homework cards)
 */
export const CardSkeleton: React.FC<{ height?: string | number; style?: React.CSSProperties; className?: string }> = ({ height, style, className }) => {
  return (
    <div
      className={`card ${className || ''}`}
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        height: height || undefined,
        ...style
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Skeleton width={38} height={38} borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="65%" height={14} borderRadius={6} />
            <Skeleton width="40%" height={10} borderRadius={4} />
          </div>
        </div>
        <Skeleton width={28} height={28} borderRadius={6} />
      </div>

      {/* Card Body Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <Skeleton width="90%" height={12} borderRadius={4} />
        <Skeleton width="75%" height={12} borderRadius={4} />
      </div>

      {/* Card Footer */}
      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: 10,
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Skeleton width="30%" height={12} borderRadius={4} />
        <Skeleton width="25%" height={18} borderRadius={9999} />
      </div>
    </div>
  );
};

/**
 * Grid of Card Skeletons
 */
export interface CardGridSkeletonProps {
  count?: number;
  gridClassName?: string;
  style?: React.CSSProperties;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  gridClassName = 'card-grid-3',
  style
}) => {
  return (
    <div className={gridClassName} style={{ width: '100%', minWidth: 0, ...style }}>
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Dark Overview Card Skeleton (for Academy Overview in Dashboard)
 */
export const DashboardOverviewSkeleton: React.FC = () => {
  return (
    <div className="card-dark overview-card">
      <div className="overview-header" style={{ marginBottom: 16 }}>
        <div className="overview-title-group" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Skeleton variant="dark" width={160} height={22} borderRadius={6} />
          <Skeleton variant="dark" width={80} height={20} borderRadius={9999} />
        </div>
      </div>

      {/* Primary Stats Row */}
      <div className="overview-primary-stats">
        <div className="primary-stat-item">
          <Skeleton variant="dark" width={44} height={44} borderRadius={12} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <Skeleton variant="dark" width={60} height={24} borderRadius={6} />
            <Skeleton variant="dark" width={110} height={12} borderRadius={4} />
          </div>
        </div>
        <div className="primary-stat-item">
          <Skeleton variant="dark" width={44} height={44} borderRadius={12} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <Skeleton variant="dark" width={60} height={24} borderRadius={6} />
            <Skeleton variant="dark" width={110} height={12} borderRadius={4} />
          </div>
        </div>
      </div>

      {/* Subcards */}
      <div className="overview-subcards">
        <div className="subcard-item" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton variant="dark" width={18} height={18} borderRadius={4} />
          <Skeleton variant="dark" width="50%" height={16} borderRadius={4} />
          <Skeleton variant="dark" width="80%" height={10} borderRadius={4} />
        </div>
        <div className="subcard-item" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton variant="dark" width={18} height={18} borderRadius={4} />
          <Skeleton variant="dark" width="50%" height={16} borderRadius={4} />
          <Skeleton variant="dark" width="80%" height={10} borderRadius={4} />
        </div>
        <div className="subcard-item" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton variant="dark" width={18} height={18} borderRadius={4} />
          <Skeleton variant="dark" width="50%" height={16} borderRadius={4} />
          <Skeleton variant="dark" width="80%" height={10} borderRadius={4} />
        </div>
      </div>
    </div>
  );
};
