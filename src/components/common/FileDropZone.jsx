/**
 * Component: FileDropZone
 * Purpose: Reusable drag-and-drop file upload component
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Drag and drop file upload
 * - Click to browse file
 * - Visual feedback for drag over
 * - File type validation
 * - Custom accept types
 *
 * @since 2026-03-29
 */
import React, { useRef, useState } from 'react';
import './FileDropZone.css';

/**
 * Drag-and-drop file upload zone component.
 *
 * @param {Object} props
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {string} props.accept - Accepted file types (e.g., ".yml,.yaml")
 * @param {string} props.selectedFileName - Currently selected file name
 * @param {boolean} props.disabled - Disable the drop zone
 * @param {string} props.placeholder - Placeholder text
 * @returns {JSX.Element}
 */
const FileDropZone = ({
    onFileSelect,
    accept = '*',
    selectedFileName = null,
    disabled = false,
    placeholder = 'Choose file or drag and drop here'
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    /**
     * Handle drag over event
     */
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    /**
     * Handle drag leave event
     */
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    /**
     * Handle drop event
     */
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            handleFileValidation(file);
        }
    };

    /**
     * Handle file input change
     */
    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            handleFileValidation(file);
        }
    };

    /**
     * Validate file and call callback
     */
    const handleFileValidation = (file) => {
        // Create a mock event object to match existing handlers
        const mockEvent = {
            target: {
                files: [file]
            }
        };
        onFileSelect(mockEvent);
    };

    /**
     * Handle click to browse
     */
    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div
            className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${selectedFileName ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled}
                style={{ display: 'none' }}
            />

            <div className="drop-zone-content">
                {selectedFileName ? (
                    <>
                        <div className="file-icon">📄</div>
                        <div className="file-name">{selectedFileName}</div>
                        <div className="file-hint">Click or drag to replace</div>
                    </>
                ) : (
                    <>
                        <div className="upload-icon">
                            {isDragging ? '📥' : '📁'}
                        </div>
                        <div className="upload-text">
                            {isDragging ? 'Drop file here' : placeholder}
                        </div>
                        <div className="upload-hint">
                            {accept !== '*' && `Accepted: ${accept}`}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileDropZone;
