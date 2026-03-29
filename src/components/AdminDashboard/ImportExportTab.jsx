/**
 * Component: ImportExportTab
 * Purpose: Import and export event configuration as YAML
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Export current event configuration to YAML file
 * - Import event configuration from YAML file
 * - Overwrite option for updating existing records
 * - Visual feedback for import results
 *
 * @since 2026-03-29
 */
import React, { useState } from 'react';
import { buildApiUrl } from '../../config/apiConfig';
import { logger } from '../../utils/logger';
import FileDropZone from '../common/FileDropZone';
import './ImportExportTab.css';

/**
 * Import/Export tab component for event configuration management.
 *
 * @returns {JSX.Element}
 */
const ImportExportTab = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [overwrite, setOverwrite] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    /**
     * Handle file selection
     */
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
                logger.error('import_invalid_file_type', {
                    fileName: file.name,
                    module: 'ImportExportTab'
                });
                setImportResults({
                    success: false,
                    errors: ['Only .yml or .yaml files are supported']
                });
                return;
            }

            setSelectedFile(file);
            setImportResults(null); // Clear previous results
            logger.info('import_file_selected', {
                fileName: file.name,
                fileSize: file.size,
                module: 'ImportExportTab'
            });
        }
    };

    /**
     * Handle export event
     */
    const handleExportEvent = async () => {
        setIsExporting(true);
        logger.info('export_request_start', {
            module: 'ImportExportTab'
        });

        try {
            const response = await fetch(
                buildApiUrl('admin/content/export-event/1'), // Assuming event_id=1
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/x-yaml',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Export failed: ${response.status} ${response.statusText}`);
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'event_export.yml';
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
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            logger.info('export_success', {
                filename,
                module: 'ImportExportTab'
            });

        } catch (error) {
            logger.error('export_failed', {
                errorMessage: error.message,
                module: 'ImportExportTab'
            }, error);
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Handle import event
     */
    const handleImportEvent = async () => {
        if (!selectedFile) {
            return;
        }

        setIsImporting(true);
        setImportResults(null);
        logger.info('import_request_start', {
            fileName: selectedFile.name,
            overwrite,
            module: 'ImportExportTab'
        });

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(
                buildApiUrl(`admin/content/import-event?overwrite=${overwrite}`),
                {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Import failed: ${response.status}`);
            }

            const results = await response.json();
            setImportResults(results);

            logger.info('import_success', {
                fileName: selectedFile.name,
                results,
                module: 'ImportExportTab'
            });

            // Clear file selection on success
            if (results.success) {
                setSelectedFile(null);
            }

        } catch (error) {
            logger.error('import_failed', {
                fileName: selectedFile.name,
                errorMessage: error.message,
                module: 'ImportExportTab'
            }, error);

            setImportResults({
                success: false,
                errors: [error.message]
            });
        } finally {
            setIsImporting(false);
        }
    };

    /**
     * Render import results
     */
    const renderImportResults = () => {
        if (!importResults) {
            return null;
        }

        const { success, created, updated, errors } = importResults;

        return (
            <div className={`import-results ${success ? 'success' : 'error'}`}>
                <h4>{success ? '✓ Import Successful' : '✗ Import Failed'}</h4>

                {success && created && (
                    <div className="results-created">
                        <strong>Created:</strong>
                        <ul>
                            {created.event && <li>Event: {created.event}</li>}
                            {created.games > 0 && <li>Games: {created.games}</li>}
                            {created.hints > 0 && <li>Hints: {created.hints}</li>}
                            {created.categories > 0 && <li>Categories: {created.categories}</li>}
                            {created.system_prompts > 0 && <li>System Prompts: {created.system_prompts}</li>}
                            {created.dependencies > 0 && <li>Dependencies: {created.dependencies}</li>}
                            {created.rewards > 0 && <li>Rewards: {created.rewards}</li>}
                        </ul>
                    </div>
                )}

                {success && updated && Object.keys(updated).length > 0 && (
                    <div className="results-updated">
                        <strong>Updated:</strong>
                        <ul>
                            {Object.entries(updated).map(([key, value]) => (
                                <li key={key}>{key}: {value}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {errors && errors.length > 0 && (
                    <div className="results-errors">
                        <strong>Errors:</strong>
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="import-export-tab">
            <div className="import-export-sections">
                {/* Export Section */}
                <div className="export-section">
                    <h3>📥 Export Event Configuration</h3>
                    <p>Download the current event configuration as a YAML file.</p>
                    <div className="export-info">
                        <strong>Includes:</strong>
                        <ul>
                            <li>Event metadata and story</li>
                            <li>Games and hints</li>
                            <li>Categories and system prompts</li>
                            <li>Dependencies and rewards</li>
                        </ul>
                        <strong>Excludes:</strong>
                        <ul>
                            <li>Users and teams</li>
                            <li>Game progress and status</li>
                        </ul>
                    </div>
                    <button
                        className="export-button"
                        onClick={handleExportEvent}
                        disabled={isExporting}
                    >
                        {isExporting ? '⏳ Exporting...' : '📥 Export Event YAML'}
                    </button>
                </div>

                {/* Import Section */}
                <div className="import-section">
                    <h3>📤 Import Event Configuration</h3>
                    <p>Upload a YAML file to import or update event configuration.</p>

                    <FileDropZone
                        onFileSelect={handleFileSelect}
                        accept=".yml,.yaml"
                        selectedFileName={selectedFile?.name}
                        disabled={isImporting}
                        placeholder="Choose YAML file or drag and drop here"
                    />

                    <div className="import-options">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={overwrite}
                                onChange={(e) => setOverwrite(e.target.checked)}
                            />
                            <span>Overwrite existing records</span>
                        </label>
                        <p className="option-help">
                            {overwrite
                                ? 'Existing records will be updated with new data from YAML'
                                : 'Existing records will be skipped, only new records will be created'
                            }
                        </p>
                    </div>

                    <button
                        className="import-button"
                        onClick={handleImportEvent}
                        disabled={!selectedFile || isImporting}
                    >
                        {isImporting ? '⏳ Importing...' : '📤 Import Event YAML'}
                    </button>

                    {renderImportResults()}
                </div>
            </div>
        </div>
    );
};

export default ImportExportTab;
