
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { CustomerManager } from './components/CustomerManager'; // Renaming concept: "Customers" is the entry for Sales now
import { MechanicLedger } from './components/MechanicLedger';
import { ReplacementWizard } from './components/ReplacementWizard';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'customers': return <CustomerManager />; // Replaces 'sale' tab largely
      case 'warranty': return <ReplacementWizard />;
      case 'ledger': return <MechanicLedger />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
