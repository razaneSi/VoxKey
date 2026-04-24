import React from 'react';
import '../Components.css';

interface SystemStatusData {
  apiFlask: 'active' | 'inactive';
  moduleMl: 'active' | 'inactive';
  database: 'active' | 'inactive';
  dspEngine: 'active' | 'inactive';
}

interface SystemStatusProps {
  status?: SystemStatusData | null;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const systemStatus = status || {
    apiFlask: 'active',
    moduleMl: 'active',
    database: 'active',
    dspEngine: 'active',
  };

  const statusItems = [
    {
      name: 'API Flask',
      status: systemStatus.apiFlask,
      version: '1.0m',
    },
    {
      name: 'Module ML',
      status: systemStatus.moduleMl,
      version: 'KNN v2.1',
    },
    {
      name: 'Base de données',
      status: systemStatus.database,
      version: 'PostgreSQL',
    },
    {
      name: 'DSP Engine',
      status: systemStatus.dspEngine,
      version: 'librosa',
    },
  ];

  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active' ? '#00ffc8' : '#ff4444';
  };

  const getStatusText = (status: 'active' | 'inactive') => {
    return status === 'active' ? 'Actif' : 'Inactif';
  };

  return (
    <div className="system-status-container">
      <div className="status-header">
        <h3>Statut Système</h3>
      </div>

      <div className="status-list">
        {statusItems.map((item, index) => (
          <div
            key={item.name}
            className="status-item"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="status-info">
              <div className="status-name">{item.name}</div>
              <div className="status-indicator">
                <span
                  className="status-dot"
                  style={{
                    backgroundColor: getStatusColor(item.status),
                    boxShadow: `0 0 8px ${getStatusColor(item.status)}`,
                  }}
                ></span>
                <span className="status-text" style={{ color: getStatusColor(item.status) }}>
                  {getStatusText(item.status)}
                </span>
              </div>
            </div>
            <div className="status-version">{item.version}</div>
          </div>
        ))}
      </div>

      <div className="system-health">
        <div className="health-bar">
          <div className="health-fill" style={{ width: '98%' }}></div>
        </div>
        <p className="health-text">Santé du système: 98%</p>
      </div>
    </div>
  );
};

export default SystemStatus;