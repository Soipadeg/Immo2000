import '../styles/AdminSettingsPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, Input } from '@/components';
import { settingsApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';



const AdminSettingsPage = () => {
  return (
    <div className="p-4 space-y-4">
      <div>AdminSettingsPage</div>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">Simplified AdminSettingsPage content for refactor.</div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Action</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
