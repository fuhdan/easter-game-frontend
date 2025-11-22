/**
 * Component: GameModal
 * Purpose: Modal for creating/editing game content
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - Create/edit game metadata
 * - Select event and category
 * - Configure difficulty, points, order
 * - Set story and challenge text
 *
 * @since 2025-11-20
 */

import React from 'react';

function GameModal({ game, gameForm, events, categories, onFormChange, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <h3>{game ? '✏️ Edit Game' : '➕ Create New Game'}</h3>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="game-title">Title *</label>
            <input
              type="text"
              id="game-title"
              value={gameForm.title}
              onChange={(e) => onFormChange({ ...gameForm, title: e.target.value })}
              className="form-control"
              placeholder="Game name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-description">Description *</label>
            <textarea
              id="game-description"
              value={gameForm.description}
              onChange={(e) => onFormChange({ ...gameForm, description: e.target.value })}
              className="form-control"
              rows="2"
              placeholder="Short description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-solution">Solution/Password *</label>
            <input
              type="text"
              id="game-solution"
              value={gameForm.solution_password}
              onChange={(e) => onFormChange({ ...gameForm, solution_password: e.target.value })}
              className="form-control"
              placeholder="Correct answer (e.g., margarete)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-story">Story Text</label>
            <textarea
              id="game-story"
              value={gameForm.story_text}
              onChange={(e) => onFormChange({ ...gameForm, story_text: e.target.value })}
              className="form-control"
              rows="4"
              placeholder="Main story/theme text shown on game screen (e.g., Faust summary)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-challenge">Challenge Text</label>
            <textarea
              id="game-challenge"
              value={gameForm.challenge_text}
              onChange={(e) => onFormChange({ ...gameForm, challenge_text: e.target.value })}
              className="form-control"
              rows="3"
              placeholder="Initial challenge/instructions (e.g., 'Find the female main character...')"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="game-event">Event</label>
              <select
                id="game-event"
                value={gameForm.event_id || ''}
                onChange={(e) => onFormChange({ ...gameForm, event_id: parseInt(e.target.value) })}
                className="form-control"
                required
              >
                <option value="">Select Event...</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.year} - {event.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="game-category">Category</label>
              <select
                id="game-category"
                value={gameForm.category_id || ''}
                onChange={(e) => onFormChange({ ...gameForm, category_id: e.target.value ? parseInt(e.target.value) : null })}
                className="form-control"
              >
                <option value="">No Category</option>
                {categories.filter(cat => !cat.event_id || cat.event_id === gameForm.event_id).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="game-difficulty">Difficulty</label>
              <select
                id="game-difficulty"
                value={gameForm.difficulty_level}
                onChange={(e) => onFormChange({ ...gameForm, difficulty_level: e.target.value })}
                className="form-control"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="game-education">Educational Purpose</label>
            <textarea
              id="game-education"
              value={gameForm.educational_purpose}
              onChange={(e) => onFormChange({ ...gameForm, educational_purpose: e.target.value })}
              className="form-control"
              rows="2"
              placeholder="What players learn (e.g., 'Shows why SSL is essential')"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-skills">Technical Skills Required</label>
            <input
              type="text"
              id="game-skills"
              value={gameForm.technical_skills}
              onChange={(e) => onFormChange({ ...gameForm, technical_skills: e.target.value })}
              className="form-control"
              placeholder="e.g., tcpdump, Wireshark, Python"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="game-points">Points</label>
              <input
                type="number"
                id="game-points"
                value={gameForm.points_value}
                onChange={(e) => onFormChange({ ...gameForm, points_value: parseInt(e.target.value) })}
                className="form-control"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="game-max-hints">Max Hints</label>
              <input
                type="number"
                id="game-max-hints"
                value={gameForm.max_hints !== undefined ? gameForm.max_hints : 0}
                onChange={(e) => onFormChange({ ...gameForm, max_hints: parseInt(e.target.value) })}
                className="form-control"
                min="0"
                title="Maximum number of AI hints available for this game (0 = no hints)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="game-order">Display Order</label>
              <input
                type="number"
                id="game-order"
                value={gameForm.order_index}
                onChange={(e) => onFormChange({ ...gameForm, order_index: parseInt(e.target.value) })}
                className="form-control"
                min="0"
              />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ Save Game
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameModal;
