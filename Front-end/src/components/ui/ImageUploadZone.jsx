import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiImage, FiPause, FiUpload, FiX } from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import { uploadImageToSupabase } from '../../lib/uploadImage';

const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const validateUrl = (value) => {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
        return '';
    }
};

const ImageUploadZone = ({
    onUpload,
    folder = 'general',
    multiple = false,
    accept = 'image/png,image/jpg,image/jpeg,image/webp',
    maxSizeMB = 10,
}) => {
    const inputRef = useRef(null);
    const timersRef = useRef(new Map());
    const [dragging, setDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [fileUrl, setFileUrl] = useState('');

    const acceptedHint = useMemo(() => accept.replace(/,/g, ', ').replace(/image\//g, '').toUpperCase(), [accept]);

    useEffect(() => () => {
        timersRef.current.forEach((timer) => clearInterval(timer));
        timersRef.current.clear();
    }, []);

    const syncUpload = (nextFiles) => {
        const urls = nextFiles.filter((item) => item.status === 'done' && item.url).map((item) => item.url);
        if (typeof onUpload === 'function') onUpload(urls);
    };

    const updateFile = (id, updater) => {
        setFiles((prev) => {
            const next = prev.map((item) => (item.id === id ? updater(item) : item));
            syncUpload(next);
            return next;
        });
    };

    const handleFiles = async (fileList) => {
        const selected = Array.from(fileList || []).filter(Boolean);
        if (!selected.length) return;

        const accepted = multiple ? selected : [selected[0]];
        const validFiles = accepted.filter((file) => file.size <= maxSizeMB * 1024 * 1024);
        if (validFiles.length !== accepted.length) {
            appToast.error(`File vượt quá ${maxSizeMB}MB`);
        }

        const newFiles = validFiles.map((file) => ({
            id: Math.random().toString(36).slice(2),
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            url: '',
            status: 'uploading',
        }));

        if (!newFiles.length) return;

        setFiles((prev) => [...prev, ...newFiles]);

        for (const item of newFiles) {
            const interval = setInterval(() => {
                updateFile(item.id, (current) => {
                    if (current.status !== 'uploading') return current;
                    const nextProgress = Math.min(current.progress + 5, 70);
                    return { ...current, progress: nextProgress };
                });
            }, 80);
            timersRef.current.set(item.id, interval);

            try {
                const result = await uploadImageToSupabase(item.file, { folder });
                clearInterval(interval);
                timersRef.current.delete(item.id);

                if (!result.success) {
                    updateFile(item.id, (current) => ({ ...current, status: 'error' }));
                    appToast.error(`Upload thất bại: ${result.error || item.name}`);
                    continue;
                }

                updateFile(item.id, (current) => ({
                    ...current,
                    progress: 100,
                    url: result.data.publicUrl,
                    status: 'done',
                }));
            } catch (error) {
                clearInterval(interval);
                timersRef.current.delete(item.id);
                updateFile(item.id, (current) => ({ ...current, status: 'error' }));
                appToast.error(`Upload thất bại: ${error?.message || item.name}`);
            }
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
    };

    const removeFile = (id) => {
        const timer = timersRef.current.get(id);
        if (timer) clearInterval(timer);
        timersRef.current.delete(id);
        setFiles((prev) => {
            const next = prev.filter((item) => item.id !== id);
            syncUpload(next);
            return next;
        });
    };

    const addUrl = () => {
        const url = validateUrl(fileUrl);
        if (!url) {
            appToast.error('URL không hợp lệ');
            return;
        }
        const next = [...files, {
            id: Math.random().toString(36).slice(2),
            file: null,
            name: url,
            size: 0,
            progress: 100,
            url,
            status: 'done',
        }];
        setFiles(next);
        setFileUrl('');
        syncUpload(next);
        appToast.success('Đã thêm ảnh từ URL');
    };

    return (
        <div className="image-upload-zone-wrap">
            <div
                className={`upload-zone${dragging ? ' dragging' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
            >
                <FiImage size={48} color="var(--color-text-muted, #8B8B8B)" />
                <div className="upload-zone-copy">
                    <p className="upload-zone-text">
                        Drop your image here, or <button type="button" className="upload-zone-link" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>browse</button>
                    </p>
                    <p className="upload-zone-subtext">Supports {acceptedHint || 'PNG, JPG, JPEG, WEBP'}</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="upload-file-list">
                {files.map((item) => (
                    <div key={item.id} className="upload-file-row">
                        <div className="upload-file-thumb">
                            {item.status === 'done' && item.url ? <img src={item.url} alt={item.name} /> : <FiImage />}
                        </div>
                        <div className="upload-file-info">
                            <div className="upload-file-topline">
                                <span className="upload-file-name">{item.name}</span>
                                <span className="upload-file-actions">
                                    {item.status === 'uploading' ? <FiPause /> : item.status === 'done' ? <FiCheck className="upload-success-icon" /> : null}
                                    <button type="button" className="icon-button" onClick={() => removeFile(item.id)} aria-label="Remove file"><FiX /></button>
                                </span>
                            </div>
                            <span className="upload-file-size">{item.size ? formatSize(item.size) : '—'}</span>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${item.progress}%` }} />
                            </div>
                        </div>
                        <span className="upload-file-percent">{item.progress}%</span>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default ImageUploadZone;
