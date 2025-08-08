import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { SchemaItem, FileUpload } from '../../types/realtor';
import { toast } from 'sonner';

interface FileUploadFieldProps {
  schema: SchemaItem;
  value: FileUpload[] | string;
  onChange: (value: FileUpload[]) => void;
  onBlur: (value: FileUpload[]) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const FileUploadField = React.memo<FileUploadFieldProps>(({
  schema,
  value,
  onChange,
  onBlur,
  disabled = false,
  shouldDisableForClientIntake = false
}) => {
  const { special_input } = schema.display_attributes;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Parse current value
  const files = Array.isArray(value) ? value : [];
  
  const acceptedTypes = special_input?.fileUpload?.accept || "*/*";
  const maxSize = special_input?.fileUpload?.maxSize || 10; // MB
  const maxFiles = special_input?.fileUpload?.maxFiles || 5;

  const validateFile = (file: File): string | null => {
    // Size validation
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Type validation (basic)
    if (acceptedTypes !== "*/*") {
      const allowedExtensions = acceptedTypes.split(',').map(ext => ext.trim().toLowerCase());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.some(ext => ext === fileExtension || ext === '*/*')) {
        return `File type not allowed. Accepted types: ${acceptedTypes}`;
      }
    }

    return null;
  };

  const handleFileSelection = useCallback(async (selectedFiles: FileList) => {
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newFiles: FileUpload[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      // In a real implementation, you'd upload to your storage service
      // For now, we'll create a mock file upload object
      const fileUpload: FileUpload = {
        files: [URL.createObjectURL(file)],
        count: 1,
        id: `file_${Date.now()}_${i}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded',
        uploadedAt: new Date(),
        // In real implementation, this would be the storage URL
        url: URL.createObjectURL(file)
      };

      newFiles.push(fileUpload);
    }

    const updatedFiles = [...files, ...newFiles];
    onChange(updatedFiles);
    onBlur(updatedFiles);
    setUploading(false);

    if (newFiles.length > 0) {
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }
  }, [files, maxFiles, onChange, onBlur]);

  const handleFileRemoval = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onChange(updatedFiles);
    onBlur(updatedFiles);
    toast.success('File removed');
  }, [files, onChange, onBlur]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || shouldDisableForClientIntake || uploading || files.length >= maxFiles}
          className={clsx(
            "flex items-center gap-2",
            shouldDisableForClientIntake && "cursor-not-allowed opacity-50"
          )}
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>
        
        <div className="text-sm text-gray-500">
          {acceptedTypes !== "*/*" && (
            <div>Accepted: {acceptedTypes}</div>
          )}
          <div>Max size: {maxSize}MB | Max files: {maxFiles}</div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files);
            // Reset input so same file can be selected again
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Uploaded Files ({files.length}/{maxFiles})
          </div>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {file.originalName || 'Unnamed file'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {file.size ? formatFileSize(file.size) : 'Unknown size'}
                      {file.uploadedAt && (
                        <span className="ml-2">
                          Uploaded {file.uploadedAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => file.id && handleFileRemoval(file.id)}
                    disabled={disabled || shouldDisableForClientIntake}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone for drag and drop (future enhancement) */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500 text-sm">
        Drag and drop files here, or click "Choose Files" above
        <br />
        {acceptedTypes !== "*/*" && (
          <span className="text-xs">Accepted formats: {acceptedTypes}</span>
        )}
      </div>
    </div>
  );
});

FileUploadField.displayName = 'FileUploadField';

export default FileUploadField;