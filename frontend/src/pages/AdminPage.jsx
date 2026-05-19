import React, { useState, useEffect } from 'react';
import { Button, Alert, Input } from '@/components';
import { adminApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPage.css';



const AdminPage = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">AdminPage</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="mb-4">Simplified AdminPage content for refactor.</p>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Action</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
