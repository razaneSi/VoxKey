import React from 'react';
import '../Components.css';

interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

interface ActivityLogProps {
  activities?: Activity[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities = [] }) => {
  const displayActivities =
    activities.length > 0
      ? activities
      : [
          {
            id: '1',
            type: 'success',
            message: 'Voix vérifiée — score 94%',
            timestamp: '14:22:08',
          },
          {
            id: '2',
            type: 'success',
            message: 'Pattern clavier confirmé',
            timestamp: '14:21:45',
          },
          {
            id: '3',
            type: 'info',
            message: 'Authentification réussie',
            timestamp: '14:20:12',
          },
          {
            id: '4',
            type: 'warning',
            message: 'Anomalie détectée — re-vérification',
            timestamp: '14:20:08',
          },
          {
            id: '5',
            type: 'success',
            message: 'Voix vérifiée — score 87%',
            timestamp: '14:17:05',
          },
          {
            id: '6',
            type: 'error',
            message: 'Pattern clavier inhabituel',
            timestamp: '14:16:31',
          },
        ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#00ffc8';
      case 'warning':
        return '#ffa500';
      case 'error':
        return '#ff4444';
      case 'info':
      default:
        return '#00d4ff';
    }
  };

  return (
    <div className="activity-log-container">
      <div className="log-header">
        <h3>Journal d'Activité</h3>
      </div>

      <div className="activity-list">
        {displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            className={`activity-item activity-${activity.type}`}
            style={{
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <div className="activity-icon" style={{ color: getActivityColor(activity.type) }}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <p className="activity-message">{activity.message}</p>
              <span className="activity-time">{activity.timestamp}</span>
            </div>
            <div className="activity-dot" style={{ backgroundColor: getActivityColor(activity.type) }}></div>
          </div>
        ))}
      </div>

      <div className="activity-timeline">
        {displayActivities.map((_, index) => (
          <div
            key={`line-${index}`}
            className="timeline-connector"
            style={{
              height: index < displayActivities.length - 1 ? '100%' : '0%',
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
