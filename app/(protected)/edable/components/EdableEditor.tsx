'use client';

import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useCallback } from 'react';

interface EdableEditorProps {
  initialTitle?: string;
  initialContent?: string;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
}

export default function EdableEditor({ 
  initialTitle = '', 
  initialContent = '', 
  onTitleChange, 
  onContentChange 
}: EdableEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [contentBlocks, setContentBlocks] = useState<JSONContent[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Underline,
    ],
    content: initialContent || '<p>Start typing here...</p>',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const html = editor.getHTML();
      
      // Extract content blocks (paragraphs, headings, etc.)
      const blocks = json.content || [];
      setContentBlocks(blocks);
      
      onContentChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && initialContent && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Update title when prop changes
  useEffect(() => {
    if (initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) {
    return <div className="p-8 text-center text-gray-500">Loading editor...</div>;
  }

  return (
    <div className="w-full">
      {/* Title Editor */}
      <div className="border-b border-gray-200 p-4 bg-purple-50">
        <label className="block text-sm font-bold text-purple-700 mb-2">
          Title (aval_title)
        </label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full px-4 py-3 text-2xl font-bold border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter title..."
        />
      </div>

      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex flex-wrap gap-1">
          {/* Text formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('bold') 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm italic ${
              editor.isActive('italic') 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded text-sm underline ${
              editor.isActive('underline') 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            U
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 2 }) 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 3 }) 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            H3
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

          {/* Links and Images */}
          <button
            onClick={insertLink}
            className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
          >
            🔗 Link
          </button>
          <button
            onClick={insertImage}
            className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
          >
            🖼️ Image
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive('bulletList') 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive('orderedList') 
                ? 'bg-purple-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            1. List
          </button>
        </div>
      </div>

      {/* Table-style Editor Layout */}
      <div className="min-h-[500px]">
        {/* Header Row */}
        <div className="flex border-b border-gray-200 bg-purple-100">
          <div className="w-2/3 px-4 py-2 font-semibold text-purple-800">Content</div>
          <div className="w-1/3 px-4 py-2 font-semibold text-purple-800 border-l border-gray-200">Annotations</div>
        </div>

        {/* Content Rows */}
        <div className="relative">
          <EditorContent 
            editor={editor}
            className="edable-content"
          />
          
          {/* Right column overlay for annotations */}
          <div className="absolute top-0 right-0 w-1/3 h-full border-l border-gray-200 bg-purple-50 bg-opacity-50 pointer-events-none">
            <div className="p-4 h-full">
              {contentBlocks.map((block, index) => (
                <div 
                  key={index}
                  className="mb-4 p-2 bg-white bg-opacity-70 rounded border border-purple-200 text-xs text-purple-600"
                  style={{ 
                    minHeight: '40px',
                    // Rough estimation of block height - could be improved with more complex positioning
                  }}
                >
                  <div className="font-semibold">Block {index + 1}</div>
                  <div className="text-purple-500">
                    {block.type === 'paragraph' && '📝 Paragraph'}
                    {block.type === 'heading' && `📰 Heading ${block.attrs?.level || ''}`}
                    {block.type === 'bulletList' && '• List'}
                    {block.type === 'orderedList' && '1. List'}
                  </div>
                  <div className="mt-1 text-xs">
                    {/* Placeholder for future annotation features */}
                    <button className="text-purple-600 hover:text-purple-800">+ Add note</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-purple-50 text-xs text-purple-700">
        <div className="flex justify-between">
          <span>Blocks: {contentBlocks.length}</span>
          <span>Characters: {editor.getText().length}</span>
        </div>
      </div>

      {/* Custom CSS for table-style layout */}
      <style jsx>{`
        .edable-content {
          width: 66.666667%; /* 2/3 width */
          min-height: 400px;
        }
        
        .edable-content .ProseMirror {
          padding: 1rem;
          outline: none;
          border: none;
        }
        
        .edable-content .ProseMirror p,
        .edable-content .ProseMirror h1,
        .edable-content .ProseMirror h2,
        .edable-content .ProseMirror h3,
        .edable-content .ProseMirror ul,
        .edable-content .ProseMirror ol {
          margin-bottom: 1rem;
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: rgba(147, 51, 234, 0.02);
        }
        
        .edable-content .ProseMirror p:hover,
        .edable-content .ProseMirror h1:hover,
        .edable-content .ProseMirror h2:hover,
        .edable-content .ProseMirror h3:hover,
        .edable-content .ProseMirror ul:hover,
        .edable-content .ProseMirror ol:hover {
          background: rgba(147, 51, 234, 0.05);
        }
      `}</style>
    </div>
  );
}