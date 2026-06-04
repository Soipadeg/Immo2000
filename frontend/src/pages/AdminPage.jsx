import '../styles/AdminPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, Input, FormContainer } from '@/components';
import { adminApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';



const AdminPage = () => {
  return (
    <>
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">⚡</span>
            <h1>Admin Panel</h1>
          </div>
          <p>Interface administrative alternative</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">Panneau administratif</div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Action</button>
          </div>
        </div>
      </FormContainer>
    </>
  );
};

export default AdminPage;
