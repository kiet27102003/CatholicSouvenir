import React, { useMemo, useRef, useState } from 'react';
import { FiImage, FiUpload, FiX } from 'react-icons/fi';
import { appToast } from '../../lib/appToast';
import { uploadImageToSupabase } from '../../lib/uploadImage';

const ImageUpload = ({
    value = '',
    onChange,
    label = 'Ảnh tham khảo',
    helperText = 'Tải ảnh lên hoặc dán URL ảnh có sẵn.',
    folder = 'references',
    accept = 'image/*',
    disabled = false,
}) => {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const preview = useMemo(() => String(value || '').trim(), [value]);

    const emitChange = (nextValue) => {
        if (typeof onChange === 'function') {
            onChange(nextValue);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const result = await uploadImageToSupabase(file, { folder });
        setUploading(false);

        if (result.success) {
            emitChange(result.data.publicUrl);
            appToast.success('Tải ảnh thành công', 'Ảnh đã được lưu lên Supabase Storage');
            return;
        }

        appToast.error('Không thể tải ảnh', result.error || 'Vui lòng thử lại');
    };

    const clearValue = () => {
        emitChange('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <div className="image-upload-card">
                <div className="image-upload-preview">
                    {preview ? (
                        <img src={preview} alt={label} className="image-upload-preview-img" />
                    ) : (
                        <div className="image-upload-empty">
                            <FiImage />
                            <span>Chưa có ảnh</span>
                        </div>
                    )}
                </div>

                <div className="image-upload-actions">
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        disabled={disabled || uploading}
                    />
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || uploading}
                    >
                        <FiUpload /> {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                    </button>
                    <div className="image-upload-url-row">
                        <input
                            className="form-input"
                            type="url"
                            placeholder="Hoặc dán URL ảnh"
                            value={preview}
                            onChange={(e) => emitChange(e.target.value)}
                            disabled={disabled || uploading}
                        />
                        {preview ? (
                            <button type="button" className="btn btn-outline" onClick={clearValue} disabled={disabled || uploading}>
                                <FiX />
                            </button>
                        ) : null}
                    </div>
                    <p className="form-help-text">{helperText}</p>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
