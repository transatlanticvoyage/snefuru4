'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useCallback, useRef } from 'react';

interface LinePosition {
  lineNumber: number;
  top: number;
  content: string;
}

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
  const [linePositions, setLinePositions] = useState<LinePosition[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

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

  // Get document lines from TipTap editor structure
  const getDocumentLines = useCallback(() => {
    if (!editor) return [];
    
    const doc = editor.view.state.doc;
    const editorElement = editor.view.dom;
    const editorRect = editorElement.getBoundingClientRect();
    const lines: LinePosition[] = [];
    let lineNumber = 1;
    
    try {
      doc.descendants((node, pos) => {
        // Only process block-level nodes (paragraphs, headings, etc.)
        if (node.isBlock && node.type.name !== 'doc') {
          try {
            // Get the DOM coordinates for this position
            const coords = editor.view.coordsAtPos(pos + 1); // +1 to get inside the node
            const relativeTop = coords.top - editorRect.top;
            
            lines.push({
              lineNumber,
              top: relativeTop,
              content: node.textContent || ''
            });
            lineNumber++;
          } catch (e) {
            // Skip nodes that can't be positioned
            console.warn('Could not get position for node:', node.type.name);
          }
        }
        return true; // Continue traversing
      });
    } catch (e) {
      console.warn('Error parsing document structure:', e);
    }
    
    return lines;
  }, [editor]);

  const updateLines = useCallback((html: string) => {
    // Parse HTML to extract line content for backward compatibility
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.body.children;
    const newLines: string[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      newLines.push(elements[i].textContent || '');
    }
    
    setLines(newLines);
    onLinesChange?.(newLines);
    
    // Update line positions
    if (editor) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const positions = getDocumentLines();
        setLinePositions(positions);
      }, 10);
    }
  }, [onLinesChange, editor, getDocumentLines]);

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

  // Add scroll and resize listeners for real-time position updates
  useEffect(() => {
    if (!editor) return;

    const updatePositions = () => {
      const positions = getDocumentLines();
      setLinePositions(positions);
    };

    // Update positions when editor content changes or scrolls
    const editorElement = editor.view.dom;
    
    const handleScroll = () => updatePositions();
    const handleResize = () => updatePositions();
    
    editorElement.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Also update on editor focus/blur events
    const handleFocus = () => setTimeout(updatePositions, 10);
    editor.on('focus', handleFocus);
    editor.on('blur', handleFocus);
    
    // Initial position update
    setTimeout(updatePositions, 100);

    return () => {
      editorElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      editor.off('focus', handleFocus);
      editor.off('blur', handleFocus);
    };
  }, [editor, getDocumentLines]);

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
        <div 
          ref={lineNumbersRef}
          className="bg-gray-50 border-r border-gray-200 px-2 py-4 text-right select-none relative"
          style={{ minWidth: '60px' }}
        >
          {linePositions.map((linePos) => (
            <div 
              key={linePos.lineNumber}
              className="text-xs text-gray-500 absolute right-2"
              style={{ 
                top: `${linePos.top + 16}px`, // +16px for padding offset
                height: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
              title={`Line ${linePos.lineNumber}: ${linePos.content.substring(0, 50)}${linePos.content.length > 50 ? '...' : ''}`}
            >
              {linePos.lineNumber}
            </div>
          ))}
        </div>


        {/* Main Editor */}
        <div className="flex-1" ref={editorRef}>
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