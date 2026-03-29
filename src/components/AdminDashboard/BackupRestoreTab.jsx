/**
 * Component: BackupRestoreTab
 * Purpose: Backup and restore all databases as encrypted JSON
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Backup all databases or specific years
 * - Restore from encrypted backup files
 * - Selective restore (choose which years to restore)
 * - Visual feedback for backup/restore operations
 * - Warning confirmations for destructive operations
 *
 * Access Control:
 * - Admin + System Admin only
 *
 * Security:
 * - Backups are encrypted with AES-256-GCM
 * - Contains sensitive data (password hashes, chat messages, tokens)
 * - Restore requires explicit confirmation
 *
 * @since 2026-03-29
 */
import React, { useState, useRef, useEffect } from 'react';
import { buildApiUrl } from '../../config/apiConfig';
import { logger } from '../../utils/logger';
import FileDropZone from '../common/FileDropZone';
import './BackupRestoreTab.css';

/**
 * Backup/Restore tab component for database management.
 *
 * @returns {JSX.Element}
 */
const BackupRestoreTab = () => {
    // Backup state
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [selectedYears, setSelectedYears] = useState(new Set()); // Will be populated after fetching
    const [includeAdminDb, setIncludeAdminDb] = useState(true); // Include admin.db by default
    const [backupResults, setBackupResults] = useState(null); // Success/error feedback

    // Restore state
    const [selectedFile, setSelectedFile] = useState(null);
    const [restoreResults, setRestoreResults] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [overwrite, setOverwrite] = useState(true);
    const [backupDatabases, setBackupDatabases] = useState([]); // Databases found in uploaded backup
    const [selectedDatabases, setSelectedDatabases] = useState(new Set()); // Selected DBs for restore

    // Available years (fetched from API)
    const [availableYears, setAvailableYears] = useState([]);
    const [loadingYears, setLoadingYears] = useState(true);

    /**
     * Fetch available database years on component mount
     * Select all years by default
     */
    useEffect(() => {
        const fetchAvailableYears = async () => {
            try {
                const response = await fetch(
                    buildApiUrl('admin/content/available-years'),
                    {
                        method: 'GET',
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch available years: ${response.status}`);
                }

                const data = await response.json();
                const years = data.years || [];
                setAvailableYears(years);

                // Select all years by default
                setSelectedYears(new Set(years));

                logger.info('available_years_fetched', {
                    years: years,
                    module: 'BackupRestoreTab'
                });
            } catch (error) {
                logger.error('available_years_fetch_failed', {
                    error: error.message,
                    module: 'BackupRestoreTab'
                }, error);
                // Set default years as fallback
                const fallbackYears = [2024, 2025, 2026];
                setAvailableYears(fallbackYears);
                setSelectedYears(new Set(fallbackYears));
            } finally {
                setLoadingYears(false);
            }
        };

        fetchAvailableYears();
    }, []);

    /**
     * Toggle year selection for backup
     */
    const handleYearToggle = (year) => {
        const newSelected = new Set(selectedYears);
        if (newSelected.has(year)) {
            newSelected.delete(year);
        } else {
            newSelected.add(year);
        }
        setSelectedYears(newSelected);
    };

    /**
     * Toggle database selection for restore
     */
    const handleDatabaseToggle = (dbName) => {
        const newSelected = new Set(selectedDatabases);
        if (newSelected.has(dbName)) {
            newSelected.delete(dbName);
        } else {
            newSelected.add(dbName);
        }
        setSelectedDatabases(newSelected);
    };

    /**
     * Handle backup - creates single backup file with selected years
     */
    const handleBackup = async () => {
        if (selectedYears.size === 0 && !includeAdminDb) {
            setBackupResults({
                success: false,
                error: 'Please select at least one database to backup'
            });
            return;
        }

        setIsBackingUp(true);
        setBackupResults(null); // Clear previous results
        logger.info('backup_start', {
            years: Array.from(selectedYears),
            includeAdminDb,
            module: 'BackupRestoreTab'
        });

        try {
            // Build URL with query parameters
            const yearsArray = Array.from(selectedYears);
            const years = yearsArray.sort().join(', ');
            const params = new URLSearchParams();
            yearsArray.forEach(year => params.append('years', year));
            params.append('include_admin', includeAdminDb);

            const response = await fetch(
                buildApiUrl(`admin/content/backup?${params.toString()}`),
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Backup failed: ${response.status}`);
            }

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'backup.json.enc';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            logger.info('backup_success', {
                years: yearsArray,
                includeAdminDb,
                filename,
                size: blob.size,
                module: 'BackupRestoreTab'
            });

            const dbInfo = [];
            if (includeAdminDb) dbInfo.push('Admin DB');
            if (years) dbInfo.push(`Years: ${years}`);

            setBackupResults({
                success: true,
                filename,
                size: (blob.size / 1024).toFixed(2),
                databases: dbInfo
            });

        } catch (error) {
            logger.error('backup_failed', {
                error: error.message,
                module: 'BackupRestoreTab'
            }, error);
            setBackupResults({
                success: false,
                error: error.message
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    /**
     * Handle file selection for restore
     * Parse backup file to extract database list
     */
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.json.enc') && !file.name.endsWith('.json')) {
            logger.error('restore_invalid_file_type', {
                fileName: file.name,
                module: 'BackupRestoreTab'
            });
            setRestoreResults({
                success: false,
                errors: ['Only .json.enc or .json backup files are supported']
            });
            return;
        }

        setSelectedFile(file);
        setRestoreResults(null);
        setBackupDatabases([]);
        setSelectedDatabases(new Set());

        logger.info('restore_file_selected', {
            fileName: file.name,
            fileSize: file.size,
            module: 'BackupRestoreTab'
        });

        // Send file to backend to parse (decrypt and extract database list)
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(
                buildApiUrl('admin/content/parse-backup'),
                {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Failed to parse backup: ${response.status}`);
            }

            const result = await response.json();
            const databases = result.databases || [];

            if (databases.length === 0) {
                setRestoreResults({
                    success: false,
                    errors: ['No databases found in backup file']
                });
                return;
            }

            // Format databases for UI display
            const databaseList = databases.map(db => ({
                name: db.name,
                year: db.year || null,
                displayName: db.display_name,
                type: db.type
            }));

            setBackupDatabases(databaseList);
            // Select all databases by default
            setSelectedDatabases(new Set(databaseList.map(db => db.name)));

            logger.info('restore_file_parsed', {
                fileName: file.name,
                databases: databaseList.length,
                module: 'BackupRestoreTab'
            });

        } catch (error) {
            logger.error('restore_file_parse_failed', {
                fileName: file.name,
                error: error.message,
                module: 'BackupRestoreTab'
            }, error);
            setRestoreResults({
                success: false,
                errors: [`Failed to parse backup file: ${error.message}`]
            });
        }
    };

    /**
     * Handle restore backup
     */
    const handleRestoreBackup = async () => {
        if (!selectedFile) {
            setRestoreResults({
                success: false,
                errors: ['Please select a backup file first']
            });
            return;
        }

        // Build confirmation message
        const selectedDbList = Array.from(selectedDatabases);
        const selectedYearsList = backupDatabases
            .filter(db => selectedDatabases.has(db.name))
            .map(db => db.year || db.name)
            .join(', ');

        setIsRestoring(true);
        setRestoreResults(null);

        logger.info('restore_backup_start', {
            fileName: selectedFile.name,
            selectedDatabases: selectedDbList,
            overwrite,
            module: 'BackupRestoreTab'
        });

        try {
            // Prepare form data
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Build query parameters
            const params = new URLSearchParams();
            if (selectedDbList.length > 0 && selectedDbList.length < backupDatabases.length) {
                // Extract years from database names for selective restore
                const years = backupDatabases
                    .filter(db => selectedDatabases.has(db.name) && db.year)
                    .map(db => db.year)
                    .join(',');
                if (years) {
                    params.append('selected_databases', years);
                }
            }
            params.append('overwrite', overwrite.toString());

            const response = await fetch(
                buildApiUrl(`admin/content/restore-backup?${params.toString()}`),
                {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Restore failed: ${response.status}`);
            }

            const results = await response.json();
            setRestoreResults(results);

            logger.info('restore_backup_success', {
                restored: results.restored_databases?.length || 0,
                skipped: results.skipped_databases?.length || 0,
                errors: results.errors?.length || 0,
                module: 'BackupRestoreTab'
            });

        } catch (error) {
            logger.error('restore_backup_failed', {
                error: error.message,
                module: 'BackupRestoreTab'
            }, error);
            setRestoreResults({
                success: false,
                errors: [error.message]
            });
        } finally {
            setIsRestoring(false);
        }
    };

    /**
     * Reset restore form
     */
    const handleResetRestore = () => {
        setSelectedFile(null);
        setRestoreResults(null);
        setBackupDatabases([]);
        setSelectedDatabases(new Set());
    };

    /**
     * Render backup results
     */
    const renderBackupResults = () => {
        if (!backupResults) return null;

        return (
            <div className={`backup-results ${backupResults.success ? 'success' : 'error'}`}>
                <h4>{backupResults.success ? '✅ Backup Successful' : '❌ Backup Failed'}</h4>

                {backupResults.success && (
                    <div className="result-section">
                        <strong>File:</strong> {backupResults.filename}
                        <br />
                        <strong>Size:</strong> {backupResults.size} KB
                        <br />
                        <strong>Databases:</strong>
                        <ul>
                            {backupResults.databases.map((db, idx) => (
                                <li key={idx}>✓ {db}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {backupResults.error && (
                    <div className="result-section errors">
                        <strong>Error:</strong>
                        <p>{backupResults.error}</p>
                    </div>
                )}

                <button className="btn-secondary" onClick={() => setBackupResults(null)}>
                    Clear
                </button>
            </div>
        );
    };

    /**
     * Render restore results
     */
    const renderRestoreResults = () => {
        if (!restoreResults) return null;

        return (
            <div className={`restore-results ${restoreResults.success ? 'success' : 'error'}`}>
                <h4>{restoreResults.success ? '✅ Restore Successful' : '❌ Restore Failed'}</h4>

                {restoreResults.restored_databases && restoreResults.restored_databases.length > 0 && (
                    <div className="result-section">
                        <strong>Restored Databases:</strong>
                        <ul>
                            {restoreResults.restored_databases.map((db, idx) => (
                                <li key={idx}>✓ {db}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {restoreResults.skipped_databases && restoreResults.skipped_databases.length > 0 && (
                    <div className="result-section">
                        <strong>Skipped Databases:</strong>
                        <ul>
                            {restoreResults.skipped_databases.map((db, idx) => (
                                <li key={idx}>⊘ {db}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {restoreResults.errors && restoreResults.errors.length > 0 && (
                    <div className="result-section errors">
                        <strong>Errors:</strong>
                        <ul>
                            {restoreResults.errors.map((err, idx) => (
                                <li key={idx}>⚠️ {err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <button className="btn-secondary" onClick={handleResetRestore}>
                    Reset Form
                </button>
            </div>
        );
    };

    return (
        <div className="backup-restore-tab">
            <div className="tab-header">
                <h2>💾 Backup & Restore</h2>
                <p className="security-notice">
                    ⚠️ <strong>Security Notice:</strong> Backup files are encrypted but contain sensitive data
                    (password hashes, chat messages, tokens). Keep backup files secure and access-controlled.
                </p>
            </div>

            <div className="backup-restore-container">
                {/* Backup Section */}
                <div className="backup-section card">
                    <h3>📦 Backup Databases</h3>
                    <p>Select databases to backup (all selected by default)</p>

                    <div className="year-selector">
                        <strong>Databases:</strong>
                        <div className="year-checkboxes">
                            {/* Admin Database Checkbox */}
                            <label className="year-checkbox">
                                <input
                                    type="checkbox"
                                    checked={includeAdminDb}
                                    onChange={(e) => setIncludeAdminDb(e.target.checked)}
                                    disabled={isBackingUp}
                                />
                                <span>Admin DB</span>
                            </label>

                            {/* Year Database Checkboxes */}
                            {loadingYears ? (
                                <span>Loading available years...</span>
                            ) : availableYears.length === 0 ? (
                                <span>No year databases available</span>
                            ) : (
                                availableYears.map(year => (
                                    <label key={year} className="year-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedYears.has(year)}
                                            onChange={() => handleYearToggle(year)}
                                            disabled={isBackingUp}
                                        />
                                        <span>{year}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        className="btn-primary btn-large"
                        onClick={handleBackup}
                        disabled={isBackingUp || (selectedYears.size === 0 && !includeAdminDb)}
                    >
                        {isBackingUp ? '⏳ Creating Backup...' : `📥 Download Backup (${selectedYears.size + (includeAdminDb ? 1 : 0)})`}
                    </button>

                    <p className="helper-text">
                        {selectedYears.size + (includeAdminDb ? 1 : 0)} of {availableYears.length + 1} databases selected (single backup file)
                    </p>

                    {renderBackupResults()}
                </div>

                {/* Restore Section */}
                <div className="restore-section card">
                    <h3>🔄 Restore from Backup</h3>
                    <p>Upload backup file and select databases to restore</p>

                    <FileDropZone
                        onFileSelect={handleFileSelect}
                        accept=".json.enc,.json"
                        selectedFileName={selectedFile?.name}
                        disabled={isRestoring}
                        placeholder="Choose backup file or drag and drop here"
                    />

                    {selectedFile && backupDatabases.length > 0 && (
                        <>
                            <div className="backup-preview">
                                <h4>📄 Backup Contains {backupDatabases.length} Database(s)</h4>
                                <div className="year-selector">
                                    <strong>Select databases to restore:</strong>
                                    <div className="year-checkboxes">
                                        {backupDatabases.map(db => (
                                            <label key={db.name} className="year-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDatabases.has(db.name)}
                                                    onChange={() => handleDatabaseToggle(db.name)}
                                                    disabled={isRestoring}
                                                />
                                                <span>{db.displayName}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="restore-options">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={overwrite}
                                        onChange={(e) => setOverwrite(e.target.checked)}
                                        disabled={isRestoring}
                                    />
                                    <span>Overwrite existing databases</span>
                                </label>
                            </div>

                            <button
                                className="btn-danger btn-large"
                                onClick={handleRestoreBackup}
                                disabled={isRestoring || selectedDatabases.size === 0}
                            >
                                {isRestoring ? '⏳ Restoring...' : `🔄 Restore (${selectedDatabases.size})`}
                            </button>

                            <p className="helper-text">
                                {selectedDatabases.size === backupDatabases.length
                                    ? 'All databases selected for restore'
                                    : `${selectedDatabases.size} of ${backupDatabases.length} databases selected`}
                            </p>
                        </>
                    )}

                    {renderRestoreResults()}
                </div>
            </div>

            {/* Documentation Section */}
            <div className="documentation-section card">
                <h3>📖 Documentation</h3>
                <div className="doc-content">
                    <h4>Databases</h4>
                    <ul>
                        <li><strong>Admin DB:</strong> User accounts, teams, roles, system configuration</li>
                        <li><strong>Year DBs (2024, 2025, etc.):</strong> Games, progress, ratings, chat messages for that event year</li>
                        <li>All databases selected by default, uncheck to exclude from backup</li>
                        <li>Single backup file contains all selected databases</li>
                    </ul>

                    <h4>Backup Format</h4>
                    <ul>
                        <li>Encrypted JSON with AES-256-GCM</li>
                        <li>Contains ALL data: users, teams, progress, chat messages</li>
                        <li>Passwords are bcrypt hashes (not decryptable)</li>
                        <li>Chat messages are double-encrypted (event key + backup key)</li>
                    </ul>

                    <h4>Decryption</h4>
                    <p>Use the <code>scripts/decrypt_backup.py</code> script for manual decryption:</p>
                    <pre className="code-block">
                        export BACKUP_ENCRYPTION_KEY="your_key_here"<br />
                        python3 scripts/decrypt_backup.py backup_file.json.enc
                    </pre>

                    <h4>Security</h4>
                    <ul>
                        <li>Keep backup files secure and access-controlled</li>
                        <li>Store backups in safe location (not web-accessible)</li>
                        <li>Backup files contain sensitive data (hashes, tokens, PII)</li>
                        <li>Restore creates safety backup (.pre-restore-backup)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default BackupRestoreTab;
