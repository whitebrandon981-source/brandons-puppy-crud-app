import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const Body = ({ accessToken }) => {
  const [puppies, setPuppies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', breed: '', age_months: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });

  useEffect(() => {
    if (accessToken) fetchPuppies();
  }, [accessToken]);

  const fetchPuppies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/puppies');
      setPuppies(res.data);
    } catch (err) {
      console.error('Error fetching puppies:', err);
      setError('Could not load puppies. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { name: formData.name, breed: formData.breed, age_months: parseInt(formData.age_months) };
    try {
      if (editingId) {
        await api.put(`/api/puppies/${editingId}`, payload);
      } else {
        await api.post('/api/puppies', payload);
      }
      setFormData({ name: '', breed: '', age_months: '' });
      setEditingId(null);
      setShowForm(false);
      fetchPuppies();
    } catch (err) {
      console.error('Error saving puppy:', err);
      setError('Failed to save puppy. Make sure all fields are filled in.');
    }
  };

  const handleEdit = (puppy) => {
    setFormData({ name: puppy.name, breed: puppy.breed, age_months: puppy.age_months.toString() });
    setEditingId(puppy.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this puppy?')) return;
    try {
      await api.delete(`/api/puppies/${id}`);
      fetchPuppies();
    } catch (err) {
      console.error('Error deleting puppy:', err);
      setError('Failed to delete puppy.');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', breed: '', age_months: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (!accessToken) {
    return (
      <main className="app-body">
        <div className="welcome-msg">
          <h2>Welcome to Puppy Manager</h2>
          <p>Please sign in to manage your puppies.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-body">
      <div className="body-header">
        <h2>Your Puppies</h2>
        {!showForm && (
          <button className="btn btn-add" onClick={() => setShowForm(true)}>+ Add Puppy</button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Edit Puppy' : 'Add New Puppy'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="e.g. Buddy" required />
            </div>
            <div className="form-group">
              <label htmlFor="breed">Breed</label>
              <input id="breed" name="breed" type="text" value={formData.breed} onChange={handleInputChange} placeholder="e.g. Golden Retriever" required />
            </div>
            <div className="form-group">
              <label htmlFor="age_months">Age (months)</label>
              <input id="age_months" name="age_months" type="number" min="0" value={formData.age_months} onChange={handleInputChange} placeholder="e.g. 6" required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-save">{editingId ? 'Update' : 'Save'}</button>
              <button type="button" className="btn btn-cancel" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Loading puppies...</p>
      ) : puppies.length === 0 ? (
        <p className="empty-text">No puppies found. Add one above!</p>
      ) : (
        <table className="puppy-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Breed</th>
              <th>Age (months)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {puppies.map((pup) => (
              <tr key={pup.id}>
                <td>{pup.id}</td>
                <td>{pup.name}</td>
                <td>{pup.breed}</td>
                <td>{pup.age_months}</td>
                <td className="action-buttons">
                  <button className="btn btn-edit" onClick={() => handleEdit(pup)}>Edit</button>
                  <button className="btn btn-delete" onClick={() => handleDelete(pup.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default Body;
