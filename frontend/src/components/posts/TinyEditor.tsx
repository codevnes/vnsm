'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor } from 'tinymce';

interface TinyEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onShowImageLibrary?: () => Promise<string | null>;
}

const TinyEditor: React.FC<TinyEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  disabled = false,
  onShowImageLibrary
}) => {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const initialRender = useRef<boolean>(true);
  const [editorContent, setEditorContent] = useState<string>(content);
  
  // Chỉ cập nhật state nội dung khi prop content thay đổi từ bên ngoài
  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
    }
  }, [content]);

  // Xử lý việc cập nhật nội dung khi state nội dung thay đổi
  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    
    // Chỉ cập nhật nội dung editor nếu editor đã được khởi tạo
    // và có nội dung thay đổi từ bên ngoài
    if (editorRef.current) {
      // Lưu vị trí con trỏ hiện tại
      const editor = editorRef.current;
      const selection = editor.selection;
      let bookmark = null;
      
      // Chỉ tạo bookmark nếu editor đã được focus
      if (editor.hasFocus()) {
        try {
          bookmark = selection.getBookmark(2, true);
        } catch (error) {
          console.error('Could not get bookmark', error);
        }
      }
      
      // Cập nhật nội dung chỉ khi khác với nội dung editor hiện tại
      if (editor.getContent() !== editorContent) {
        editor.setContent(editorContent);
        
        // Khôi phục vị trí con trỏ chỉ khi có bookmark hợp lệ
        if (bookmark) {
          try {
            // Đảm bảo rằng selection vẫn tồn tại sau khi cập nhật nội dung
            setTimeout(() => {
              selection.moveToBookmark(bookmark);
              editor.focus();
            }, 0);
          } catch (error) {
            console.error('Could not restore bookmark', error);
          }
        }
      }
    }
  }, [editorContent]);

  const handleImageUpload = async () => {
    if (!onShowImageLibrary) {
      return;
    }

    try {
      const imageUrl = await onShowImageLibrary();
      if (imageUrl && editorRef.current) {
        editorRef.current.execCommand('mceInsertContent', false, `<img src="${imageUrl}" alt="Inserted image" />`);
      }
    } catch (error) {
      console.error("Error handling image library selection:", error);
    }
  };
  
  // Xử lý thay đổi nội dung từ editor
  const handleEditorChange = (newContent: string) => {
    // Cập nhật state nội dung internal trước
    setEditorContent(newContent);
    
    // Sau đó mới thông báo ra bên ngoài
    if (newContent !== content) {
      onChange(newContent);
    }
  };

  return (
    <div className="w-full">
      
      <Editor
        apiKey="gqcpkc0yu6t37vrh6jaiwx7ugf0nn5o2rc106o1ugk1gwz2v"
        onInit={(evt, editor) => {
          editorRef.current = editor;
          
          // Xử lý việc selection bị mất khi editor blur và focus lại
          editor.on('blur', () => {
            try {
              if (editor.selection) {
                const bookmark = editor.selection.getBookmark(2, true);
                editor.selection.moveToBookmark(bookmark);
              }
            } catch (e) {
              console.error('Error saving selection on blur', e);
            }
          });
          
          editor.on('SetContent', () => {
            // Giữ focus và đặt con trỏ ở vị trí cuối nếu không có bookmark được khôi phục
            if (editor.hasFocus() && !editor.selection.getContent()) {
              editor.selection.select(editor.getBody(), true);
              editor.selection.collapse(false);
            }
          });
        }}
        value={editorContent}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height: 650,
          width: '100%',
          menubar: false,
          placeholder,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | table | image customimage | help',
          setup: (editor) => {
            // Add custom button for image library
            editor.ui.registry.addButton('customimage', {
              icon: 'gallery',
              tooltip: 'Insert image from library',
              onAction: handleImageUpload
            });
            
            // Lưu vị trí con trỏ trước mỗi thao tác
            editor.on('NodeChange', (e) => {
              // Không làm gì đặc biệt, chỉ đảm bảo sự kiện này có thể được kích hoạt
            });
            
            // Xử lý vấn đề con trỏ khi nội dung được đặt
            editor.on('SetContent', (e) => {
              // Không đặt lại nội dung nếu nó đang trống và nội dung ngoài không trống
              if (!e.content && editorContent) {
                e.preventDefault();
              }
            });
            
            // Bắt keydown để đảm bảo lưu vị trí con trỏ
            editor.on('keydown', () => {
              // Chỉ cần kích hoạt sự kiện, không cần xử lý gì đặc biệt
            });
          },
          // Các tùy chọn quan trọng để duy trì con trỏ
          auto_focus: undefined, // Tránh tự động focus
          auto_resize: true,
          resize: true,
          statusbar: true,
          branding: false,
          browser_spellcheck: true,
          keep_styles: true,
          entity_encoding: 'raw',
          // Tránh cache để không bị vấn đề với nội dung cũ
          cache_suffix: '?v=' + Date.now(),
          // Thêm tùy chọn quan trọng để duy trì vị trí con trỏ
          protect: [/\<\/?(if|endif)\>/g],
          convert_urls: false,
          extended_valid_elements: '*[*]'
        }}
      />
    </div>
  );
};

export default TinyEditor; 