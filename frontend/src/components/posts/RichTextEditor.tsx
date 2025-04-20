'use client';

import React, { useMemo, useState, useEffect, useRef, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
// Optional: Import bubble theme CSS if you prefer it
// import 'react-quill-new/dist/quill.bubble.css';
// import type { ReactQuillProps } from 'react-quill-new'; // Import type from react-quill-new - Type might not be exported directly

// --- Quill/Module Setup ---
import type ReactQuillType from 'react-quill-new';
import type Quill from 'quill'; // Import Quill type if needed for casting

// @ts-ignore - No official types available
import ImageResize from 'quill-image-resize-module';

// --- Dynamic Import Types ---
interface ReactQuillWrapperProps extends React.ComponentProps<typeof ReactQuillType> {
    forwardedRef: React.Ref<ReactQuillType>;
}

// --- Dynamic Import Component ---
const ReactQuill = dynamic<ReactQuillWrapperProps>(
    async () => {
        // Import Quill and the resizer module *inside* the dynamic import
        const {
            default: RQ
        } = await import('react-quill-new');
        // @ts-ignore - Import the new resize module
        const { default: ImageResize } = await import('quill-image-resize');

        // Register the module *after* importing Quill
        if (typeof window !== 'undefined') {
            // @ts-ignore - Access static Quill property
            const QuillInstance = RQ.Quill || RQ.default?.Quill;
            if (QuillInstance && typeof QuillInstance.register === 'function') {
                try {
                     QuillInstance.register('modules/imageResize', ImageResize);
                     console.log('ImageResize module (quill-image-resize) registered successfully.');
                } catch (e) {
                     console.warn("ImageResize module already registered or registration failed:", e);
                }
            } else {
                 console.error("Failed to access Quill static instance for registration.");
            }
        }

        // Return a component that explicitly handles the ref using forwardRef
        // eslint-disable-next-line react/display-name
        return forwardRef<ReactQuillType, React.ComponentProps<typeof ReactQuillType>>((props, ref) => (
             <RQ ref={ref} {...props} />
        ));
    },
    {
        ssr: false,
        loading: () => <p>Loading editor...</p>,
    }
);

// --- Main Rich Text Editor Component using ReactQuill ---

interface RichTextEditorProps {
    content: string; // Expect HTML string for content
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    // limit?: number; // Note: Character/word limit needs custom handling with Quill
    onShowImageLibrary?: () => Promise<string | null>; // Should return the selected image URL or null
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    placeholder = 'Start writing...',
    disabled = false,
    // limit
    onShowImageLibrary // Receive the function to show the library
}) => {
    // const [charCount, setCharCount] = useState(0);

    // Ref to access the Quill editor instance
    const quillRef = useRef<ReactQuillType>(null);

    // Custom image handler function
    const imageHandler = async () => {
        if (!onShowImageLibrary) {
            console.warn("RichTextEditor: onShowImageLibrary prop is not provided. Cannot open image library.");
            // Fallback to default prompt or do nothing
            const url = prompt('Enter image URL:');
            if (url && quillRef.current) {
                 const editor = quillRef.current.getEditor();
                 const range = editor.getSelection(true);
                 editor.insertEmbed(range.index, 'image', url, 'user');
            }
            return;
        }

        try {
            const imageUrl = await onShowImageLibrary(); // Call the passed function
            if (imageUrl && quillRef.current) {
                const editor = quillRef.current.getEditor(); // Get the Quill editor instance
                const range = editor.getSelection(true); // Get current selection or cursor position
                // Insert the image URL received from the dialog
                editor.insertEmbed(range.index, 'image', imageUrl, 'user'); // 'user' source for changes
                 // Optionally move cursor after image
                 editor.setSelection(range.index + 1, 0, 'user');
            }
        } catch (error) {
            console.error("Error handling image library selection:", error);
        }
    };

    // Define Quill modules (toolbar, imageResize, etc.)
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }], // Headers dropdown
                // [{ 'font': [] }], // Font family dropdown (requires font whitelist)
                // [{ 'size': ['small', false, 'large', 'huge'] }], // Font size dropdown

                ['bold', 'italic', 'underline', 'strike'],        // Basic text formatting
                [{ 'color': [] }, { 'background': [] }],          // Text color, background color

                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],      // Superscript/subscript
                [{ 'indent': '-1'}, { 'indent': '+1' }],          // Outdent/indent
                [{ 'direction': 'rtl' }],                         // Text direction (optional)

                [{ 'align': [] }], // Text alignment dropdown

                ['blockquote', 'code-block'], // Block formatting

                ['link', 'image', 'video'], // Embeds (video is basic, YouTube might need custom blot)

                ['clean'] // Remove formatting button
            ],
            handlers: {
                // Add the custom handler for the 'image' button
                image: imageHandler,
            },
        },
        // Configure the image resize module
        imageResize: {
            // parchment: Quill.import('parchment'), // Not usually needed when registered globally
             modules: ['Resize', 'DisplaySize', 'Toolbar'] // Enable basic resize, display size, and alignment toolbar
        },
        // Optional: Add more modules like image resizing, syntax highlighting, etc.
        // history: { delay: 500, maxStack: 100, userOnly: true }, // Configure undo/redo
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [onShowImageLibrary]); // Add onShowImageLibrary to dependencies if it can change

    // Define allowed formats (should match toolbar options)
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list', 'bullet', 'indent',
        'script',
        'align', 'direction',
        'blockquote', 'code-block',
        'link', 'image', 'video',
        // Formats needed by imageResize module (added automatically but good to list)
        'width', 'height', 'style', // For inline styles used by resizing
        // Custom formats if you add them
    ];

    // Custom handler for onChange to potentially calculate character count
    const handleChange = (value: string) => {
        onChange(value);
        // // Basic character count (strips HTML for a rough estimate)
        // const textOnly = value.replace(/<[^>]*>/g, '');
        // setCharCount(textOnly.length);
    };

    return (
        <div className="rich-text-editor-wrapper bg-background text-foreground border border-input rounded-md overflow-hidden">
            {/* ReactQuill component */}
            <ReactQuill
                forwardedRef={quillRef} // Pass the ref via forwardedRef
                theme="snow" // or "bubble"
                value={content}
                onChange={handleChange} // Use custom handler
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                readOnly={disabled}
                className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:prose [&_.ql-editor]:prose-sm [&_.ql-editor]:sm:prose [&_.ql-editor]:lg:prose-lg [&_.ql-editor]:dark:prose-invert [&_.ql-editor]:max-w-none"
                // Apply Tailwind prose classes to the editor content area
            />
            {/* Optional: Status bar - Needs custom implementation */}
            {/* <div className="text-xs text-muted-foreground p-2 border-t border-input flex justify-between">
                <span>{charCount} characters</span>
                {limit && (
                    <span className={charCount > limit ? 'text-destructive font-bold' : ''}>
                        {charCount}/{limit} characters
                    </span>
                )}
            </div> */}
        </div>
    );
};

export default RichTextEditor; 