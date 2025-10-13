import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api'; // Make sure this points to your api.js

const PlayerManagement = ({ players, setPlayers, showNotification, loading, setLoading, setProgress }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState(null); // currently editing row
  const [newRow, setNewRow] = useState(null); // temporary new player row
  const fileInputRef = useRef(null);

  // -------------------------------
  // Fetch real users from backend
  // -------------------------------
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await api.players.getAll();
        
        console.log('Fetched players response:', response);

        if (response && response.success && Array.isArray(response.users)) {
          // Keep only the properties we need for team creation
          const normalizedPlayers = response.users.map(player => ({
            id: player.id,
            name: player.name || player.display_name || '',
            username: player.username || '',
            department: player.department || 'Unassigned'
          }));

          setPlayers(normalizedPlayers); // even if empty
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []); // run once on mount

  // -------------------------------
  // CSV parsing
  // -------------------------------
  const handleFileUpload = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const nameIndex = headers.findIndex(h => h.includes('name') && !h.includes('login'));
      const usernameIndex = headers.findIndex(h => h.includes('username'));
      const deptIndex = headers.findIndex(h => h.includes('department') || h.includes('team'));

      if (nameIndex === -1) throw new Error('CSV must contain a Name column');
      if (usernameIndex === -1) throw new Error('CSV must contain a Username column');
      if (deptIndex === -1) throw new Error('CSV must contain a Department column');

      const newPlayers = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return {
          id: Date.now() + index + Math.random(),
          name: values[nameIndex] || '',
          username: values[usernameIndex] || '',
          department: values[deptIndex] || 'Unassigned'
        };
      }).filter(p => p.name && p.username);

      setPlayers(newPlayers);
      showNotification(`Successfully imported ${newPlayers.length} players`, 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if(file) handleFileUpload(file); };
  const handleFileInputChange = (e) => { const file = e.target.files[0]; if(file) handleFileUpload(file); };

  // Add new row at top
  const handleAddPlayer = () => {
    if(newRow) return; // prevent multiple add rows
    setNewRow({ id: Date.now(), name: '', username: '', department: '' });
    setEditingId(Date.now());
  };

  // Save new row
  const saveNewRow = () => {
    if(!newRow.name || !newRow.username) {
      showNotification('Name and Username are required', 'error');
      return;
    }
    setPlayers(prev => [newRow, ...prev]);
    setNewRow(null);
    setEditingId(null);
    showNotification('Player added successfully', 'success');
  };

  // Inline editing existing row
  const startEdit = (player) => { setEditingId(player.id); };
  const saveEdit = (playerId, updated) => {
    if(!updated.name || !updated.username) {
      showNotification('Name and Username are required', 'error');
      return;
    }
    setPlayers(prev => prev.map(p => p.id === playerId ? updated : p));
    setEditingId(null);
  };

  const cancelEdit = () => { setEditingId(null); if(newRow) setNewRow(null); };

  const filteredPlayers = players.filter(player =>
    (player.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📋 Player Management</h3>
      </div>
      <div className="card-body">
        {/* CSV Upload */}
        <div
          className={`csv-upload-area ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInputChange} style={{display:'none'}}/>
          <div className="upload-icon">📁</div>
          <h4>Drop CSV file here or click to upload</h4>
          <p>Expected format: Name, Username, Department</p>
          <small>Maximum 5MB, up to 500 players</small>
        </div>

        {/* Controls */}
        <div className="player-controls">
          <div className="player-search">
            <input type="text" className="form-control" placeholder="Search players..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>
          <button className="btn btn-primary" onClick={handleAddPlayer}>➕ Add Player</button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="player-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* New Row */}
              {newRow && editingId === newRow.id && (
                <tr>
                  <td><input className="form-control" value={newRow.name} onChange={e=>setNewRow({...newRow, name:e.target.value})}/></td>
                  <td><input className="form-control" value={newRow.username} onChange={e=>setNewRow({...newRow, username:e.target.value})}/></td>
                  <td><input className="form-control" value={newRow.department} onChange={e=>setNewRow({...newRow, department:e.target.value})}/></td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={saveNewRow}>💾</button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>❌</button>
                  </td>
                </tr>
              )}

              {/* Existing players */}
              {filteredPlayers.map(player => (
                <tr key={player.id}>
                  {editingId === player.id ? (
                    <>
                      <td><input className="form-control" value={player.name} onChange={e=>player.name=e.target.value}/></td>
                      <td><input className="form-control" value={player.username} onChange={e=>player.username=e.target.value}/></td>
                      <td><input className="form-control" value={player.department} onChange={e=>player.department=e.target.value}/></td>
                      <td>
                        <button className="btn btn-success btn-sm" onClick={()=>saveEdit(player.id, player)}>💾</button>
                        <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>❌</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{player.name}</td>
                      <td>{player.username}</td>
                      <td>{player.department}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={()=>startEdit(player)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>setPlayers(prev => prev.filter(p => p.id !== player.id))}>🗑️</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-summary">
            Showing {filteredPlayers.length} of {players.length} players
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;
