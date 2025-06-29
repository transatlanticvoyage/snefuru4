'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useCallback } from 'react';

interface TipTapEditorProps {
  initialContent?: string;
  content?: string;
  onChange?: (content: string) => void;
  onLinesChange?: (lines: string[]) => void;
}

export default function TipTapEditor({ initialContent = '', content, onChange, onLinesChange }: TipTapEditorProps) {
  const [isCodeView, setIsCodeView] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [lines, setLines] = useState<string[]>([]);

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
          class: 'text-blue-600 underline',
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
      const html = editor.getHTML();
      setHtmlContent(html);
      updateLines(html);
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const updateLines = useCallback((html: string) => {
    // Parse HTML to extract line content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.body.children;
    const newLines: string[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      newLines.push(elements[i].textContent || '');
    }
    
    setLines(newLines);
    onLinesChange?.(newLines);
  }, [onLinesChange]);

  useEffect(() => {
    if (editor) {
      const html = editor.getHTML();
      setHtmlContent(html);
      updateLines(html);
    }
  }, [editor, updateLines]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const handleCodeViewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlContent(e.target.value);
  };

  const applyHtmlChanges = () => {
    if (editor) {
      editor.commands.setContent(htmlContent);
      setIsCodeView(false);
    }
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
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex flex-wrap gap-1">
          {/* Text formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('bold') 
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm italic ${
              editor.isActive('italic') 
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded text-sm underline ${
              editor.isActive('underline') 
                ? 'bg-gray-700 text-white' 
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
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              editor.isActive('heading', { level: 3 }) 
                ? 'bg-gray-700 text-white' 
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
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            • List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive('orderedList') 
                ? 'bg-gray-700 text-white' 
                : 'bg-white border border-gray-300 hover:bg-gray-100'
            }`}
          >
            1. List
          </button>

          <div className="ml-auto">
            <button
              onClick={() => setIsCodeView(!isCodeView)}
              className="px-3 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
            >
              {isCodeView ? 'Visual' : 'HTML'} View
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area with Line Numbers and Sidebar */}
      <div className="flex">
        {/* Line Numbers */}
        <div className="bg-gray-50 border-r border-gray-200 px-2 py-4 text-right select-none">
          {lines.map((_, index) => (
            <div 
              key={index} 
              className="text-xs text-gray-500 leading-6"
              style={{ minHeight: '1.5rem' }}
            >
              {index + 1}
            </div>
          ))}
        </div>


        {/* Main Editor */}
        <div className="flex-1">
          {isCodeView ? (
            <div className="p-4">
              <textarea
                value={htmlContent}
                onChange={handleCodeViewChange}
                className="w-full h-[400px] font-mono text-sm p-4 border border-gray-300 rounded"
                placeholder="HTML content..."
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={applyHtmlChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply Changes
                </button>
                <button
                  onClick={() => setIsCodeView(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <EditorContent 
                editor={editor} 
                className="min-h-[400px]"
              />
              {/* Line tracking overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {editor.view.state.doc.content.content.map((node, index) => (
                  <div
                    key={index}
                    data-line-id={`line-${index + 1}`}
                    className="invisible"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Lines: {lines.length}</span>
          <span>Characters: {editor.getText().length}</span>
        </div>
      </div>
    </div>
  );
}