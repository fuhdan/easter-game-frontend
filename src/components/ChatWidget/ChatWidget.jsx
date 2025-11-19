/**
 * Component: ChatWidget
 * Purpose: Main chat widget container with drag and resize
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Container for entire chat interface
 * - Toggle open/close functionality
 * - Draggable window (via header)
 * - Resizable window (via corner handle)
 * - Persists position/size to localStorage
 * - Keyboard shortcuts (Esc to close)
 * - Contains ChatHeader, ChatBody, ChatFooter
 * - Responsive design (mobile + desktop)
 *
 * @since 2025-11-09
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatToggleButton from './ChatToggleButton';
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatFooter from './ChatFooter';
import './ChatWidget.css';

// Default window dimensions and position
const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 750;
const DEFAULT_POSITION = { x: window.innerWidth - 540, y: window.innerHeight - 800 };
const MIN_WIDTH = 320;
const MIN_HEIGHT = 400;

/**
 * ChatWidget - Main chat container component with drag and resize
 *
 * @returns {JSX.Element}
 */
const ChatWidget = () => {
  const { user } = useChat();
  // Chat open/close state
  const [isOpen, setIsOpen] = useState(false);

  // Window position and size
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Ref for popup container
  const popupRef = useRef(null);

  /**
   * Load saved position and size from localStorage
   */
  useEffect(() => {
    const saved = localStorage.getItem('chatWindowState');
    if (saved) {
      try {
        const { position: savedPos, size: savedSize } = JSON.parse(saved);
        if (savedPos) setPosition(savedPos);
        if (savedSize) setSize(savedSize);
      } catch (e) {
        console.warn('[ChatWidget] Failed to load saved state:', e);
      }
    }
  }, []);

  /**
   * Save position and size to localStorage
   */
  useEffect(() => {
    localStorage.setItem('chatWindowState', JSON.stringify({ position, size }));
  }, [position, size]);

  /**
   * Toggle chat open/close
   */
  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  /**
   * Close chat
   */
  const closeChat = () => {
    setIsOpen(false);
  };

  /**
   * Start dragging
   */
  const handleDragStart = useCallback((e) => {
    // Only allow dragging from header (not close button or other interactive elements)
    if (e.target.closest('.chat-close-button') || e.target.closest('button')) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  /**
   * Start resizing
   */
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation(); // Prevent drag from starting
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  }, [size]);

  /**
   * Handle mouse move for drag and resize
   */
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(MIN_WIDTH, resizeStart.width + deltaX);
        const newHeight = Math.max(MIN_HEIGHT, resizeStart.height + deltaY);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Esc to close
      if (event.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="chat-widget" role="complementary" aria-label="Chat assistant">
      {/* Toggle Button */}
      <ChatToggleButton isOpen={isOpen} onClick={toggleChat} />

      {/* Chat Popup - Draggable and Resizable */}
      {isOpen && (
        <div
          ref={popupRef}
          id="chat-widget-popup"
          className={`chat-popup ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-header-title"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            cursor: isDragging ? 'move' : isResizing ? 'nwse-resize' : 'default'
          }}
        >
          {/* Header - Draggable */}
          <div
            className="chat-header-drag-handle"
            onMouseDown={handleDragStart}
            style={{ cursor: 'move' }}
          >
            <ChatHeader onClose={closeChat} />
          </div>

          {/* Body */}
          <ChatBody user={user} />

          {/* Footer */}
          <ChatFooter />

          {/* Resize Handle */}
          <div
            className="chat-resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
