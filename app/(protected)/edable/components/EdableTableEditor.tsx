'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';

interface EditorBlock {
  id: string;
  type: string;
  content?: JSONContent;
  htmlContent: string;
}

interface EdableTableEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

// Individual block editor component
function BlockEditor({ 
  block, 
  onUpdate, 
  onEnterPressed, 
  onBackspacePressed,
  onFocus,
  focused,
  onEditorReady
}: {
  block: EditorBlock;
  onUpdate: (id: string, content: string) => void;
  onEnterPressed: (id: string) => void;
  onBackspacePressed: (id: string) => void;
  onFocus: (id: string) => void;
  focused: boolean;
  onEditorReady?: (editor: any) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure for block-level editing
        heading: { levels: [2, 3] },
        paragraph: {
          HTMLAttributes: {
            class: 'block-paragraph',
          },
        },
        // Keep document but disable some document-level features
        hardBreak: false,
        // Disable horizontal rule and code block for simplicity
        horizontalRule: false,
        codeBlock: false,
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
    content: block.htmlContent || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(block.id, html);
    },
    onFocus: () => {
      onFocus(block.id);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-2 min-h-[2rem]',
      },
      handleKeyDown: (view, event) => {
        // Handle Enter key - create new block
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onEnterPressed(block.id);
          return true;
        }
        
        // Handle Backspace at start of empty block - merge with previous
        if (event.key === 'Backspace') {
          const { from, to } = view.state.selection;
          const isEmpty = view.state.doc.textContent === '';
          
          if (from === 0 && to === 0 && isEmpty) {
            event.preventDefault();
            onBackspacePressed(block.id);
            return true;
          }
        }
        
        return false;
      },
    },
  });

  // Focus this editor when it becomes the focused block
  useEffect(() => {
    if (focused && editor) {
      editor.commands.focus();
      onEditorReady?.(editor);
    }
  }, [focused, editor, onEditorReady]);

  if (!editor) {
    return (
      <div className="p-2 text-gray-400 border border-gray-200 rounded min-h-[2rem] flex items-center">
        Loading editor...
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded ${focused ? 'ring-2 ring-purple-500 border-purple-300' : ''}`}>
      <EditorContent editor={editor} />
    </div>
  );
}

type ViewMode = 'visual' | 'html';

export default function EdableTableEditor({ initialContent = '<p>Start typing...</p>', onContentChange }: EdableTableEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');

  // Parse initial content into blocks
  useEffect(() => {
    if (initialContent) {
      parseContentIntoBlocks(initialContent);
    }
  }, [initialContent]);

  const parseContentIntoBlocks = (html: string) => {
    const parsedBlocks: EditorBlock[] = [];
    
    try {
      if (!html || html.trim() === '') {
        parsedBlocks.push({
          id: generateId(),
          type: 'paragraph',
          htmlContent: '<p>Start typing...</p>'
        });
      } else {
        console.log('Parsing content by linebreaks. Original length:', html.length);
        
        // Split by raw linebreaks (both Unix \n and Windows \r\n)
        const lines = html.split(/\r?\n/);
        
        console.log(`Found ${lines.length} lines in content`);
        
        lines.forEach((line, index) => {
          // Keep the line exactly as is, including empty lines
          const trimmedLine = line.trim();
          
          if (trimmedLine === '') {
            // Empty line - create an empty paragraph
            parsedBlocks.push({
              id: generateId(),
              type: 'paragraph',
              htmlContent: '<p></p>'
            });
          } else {
            // Line has content - detect if it's already a complete HTML element
            const isCompleteElement = /^<(?:h[1-6]|p|div|ul|ol|li|blockquote)[^>]*>.*<\/(?:h[1-6]|p|div|ul|ol|li|blockquote)>$/i.test(trimmedLine);
            
            if (isCompleteElement) {
              // It's already a complete HTML block element
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = trimmedLine;
              const element = tempDiv.firstElementChild;
              
              if (element) {
                const tagName = element.tagName.toLowerCase();
                parsedBlocks.push({
                  id: generateId(),
                  type: tagName,
                  htmlContent: trimmedLine
                });
              } else {
                // Fallback if parsing fails
                parsedBlocks.push({
                  id: generateId(),
                  type: 'paragraph',
                  htmlContent: `<p>${line}</p>` // Use original line with spaces
                });
              }
            } else {
              // It's text content (may include inline HTML) - wrap in paragraph
              parsedBlocks.push({
                id: generateId(),
                type: 'paragraph',
                htmlContent: `<p>${line}</p>` // Use original line with spaces preserved
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing content by linebreaks:', error);
      // Fallback to a single paragraph with the original content
      parsedBlocks.push({
        id: generateId(),
        type: 'paragraph',
        htmlContent: `<p>${html || 'Error parsing content. Please try again.'}</p>`
      });
    }
    
    console.log(`Created ${parsedBlocks.length} blocks from ${html.split(/\r?\n/).length} lines`);
    setBlocks(parsedBlocks);
    
    // Focus the first block
    if (parsedBlocks.length > 0) {
      setTimeout(() => {
        setFocusedBlock(parsedBlocks[0].id);
      }, 100);
    }
  };

  const generateId = () => {
    return 'block-' + Math.random().toString(36).substr(2, 9);
  };

  const handleBlockUpdate = useCallback((blockId: string, content: string) => {
    setBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, htmlContent: content }
          : block
      );
      
      // Combine all blocks into final HTML with linebreaks preserved
      const combinedHtml = updatedBlocks
        .map(block => {
          // Extract content from paragraph tags for line-based storage
          if (block.htmlContent.startsWith('<p>') && block.htmlContent.endsWith('</p>')) {
            return block.htmlContent.slice(3, -4); // Remove <p> and </p>
          }
          return block.htmlContent;
        })
        .join('\n'); // Join with linebreaks
      
      onContentChange?.(combinedHtml);
      
      return updatedBlocks;
    });
  }, [onContentChange]);

  const handleEnterPressed = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    // Create new block after current one
    const newBlock: EditorBlock = {
      id: generateId(),
      type: 'paragraph',
      htmlContent: '<p></p>'
    };
    
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      return newBlocks;
    });
    
    // Focus the new block
    setTimeout(() => {
      setFocusedBlock(newBlock.id);
    }, 50);
  }, [blocks]);

  const handleBackspacePressed = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    
    // Don't delete if it's the only block
    if (blocks.length <= 1) return;
    
    // Don't delete if it's the first block
    if (blockIndex <= 0) return;
    
    // Remove this block and focus the previous one
    setBlocks(prevBlocks => {
      const newBlocks = prevBlocks.filter(b => b.id !== blockId);
      return newBlocks;
    });
    
    // Focus the previous block
    const previousBlock = blocks[blockIndex - 1];
    if (previousBlock) {
      setFocusedBlock(previousBlock.id);
    }
  }, [blocks]);

  const handleBlockFocus = useCallback((blockId: string) => {
    setFocusedBlock(blockId);
    // Keep view mode consistent across blocks - don't reset it
  }, []);

  const handleEditorReady = useCallback((editor: any) => {
    setActiveEditor(editor);
  }, []);

  // Toolbar action handlers
  const insertLink = () => {
    if (!activeEditor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      activeEditor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertImage = () => {
    if (!activeEditor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      activeEditor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setVisualMode = () => {
    setViewMode('visual');
  };

  const setHtmlMode = () => {
    setViewMode('html');
  };

  // Get block's HTML content for HTML view
  const getBlockHtml = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    return block?.htmlContent || '';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-purple-100 border-b border-purple-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-purple-800">8-Column Table Editor</h3>
          <div className="text-sm text-purple-600">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} × 8 columns | 
            <span className={`ml-2 font-medium ${viewMode === 'visual' ? 'text-green-600' : 'text-orange-600'}`}>
              {viewMode === 'visual' ? '📝 Visual Mode' : '💻 HTML Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Column Table Structure with 4-Row Header */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          {/* Table Header - 4 Rows */}
          <thead>
            {/* Header Row 1 - Blank placeholders */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-2 w-20"></th>
              <th className="border border-gray-300 p-2 w-20"></th>
              <th className="border border-gray-300 p-2 w-20"></th>
              <th className="border border-gray-300 p-2 w-20"></th>
              <th className="border border-gray-300 p-2" style={{ width: '600px' }}></th>
              <th className="border border-gray-300 p-2 w-20"></th>
              <th className="border border-gray-300 p-2 w-20"></th>
              <th className="border border-gray-300 p-2 w-20"></th>
            </tr>
            
            {/* Header Row 2 - Blank placeholders */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
            
            {/* Header Row 3 - Content label */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2 text-center text-sm font-bold text-purple-700">
                lineyoshi
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2 text-center text-sm font-bold text-purple-700">
                Content
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
            
            {/* Header Row 4 - TipTap Toolbar */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-1">
                {/* TipTap Toolbar */}
                <div className="flex flex-wrap gap-1 justify-center">
                  {/* Text formatting */}
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded text-sm font-bold border ${
                      activeEditor?.isActive('bold') 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    B
                  </button>
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded text-sm italic border ${
                      activeEditor?.isActive('italic') 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    I
                  </button>
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleUnderline().run()}
                    className={`px-2 py-1 rounded text-sm underline border ${
                      activeEditor?.isActive('underline') 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    U
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  {/* Headings */}
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 py-1 rounded text-sm font-medium border ${
                      activeEditor?.isActive('heading', { level: 2 }) 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    H2
                  </button>
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-2 py-1 rounded text-sm font-medium border ${
                      activeEditor?.isActive('heading', { level: 3 }) 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    H3
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  {/* Links and Images */}
                  <button
                    onClick={insertLink}
                    className="px-2 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    🔗 Link
                  </button>
                  <button
                    onClick={insertImage}
                    className="px-2 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-100"
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    🖼️ Image
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  {/* Lists */}
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 rounded text-sm border ${
                      activeEditor?.isActive('bulletList') 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    • List
                  </button>
                  <button
                    onClick={() => activeEditor?.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 rounded text-sm border ${
                      activeEditor?.isActive('orderedList') 
                        ? 'bg-purple-700 text-white border-purple-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                    disabled={!activeEditor || viewMode === 'html'}
                  >
                    1. List
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1" />

                  {/* Visual/HTML Toggle Bar */}
                  <div className="flex border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={setVisualMode}
                      className={`px-3 py-1 text-xs font-medium ${
                        viewMode === 'visual'
                          ? 'bg-purple-700 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Visual
                    </button>
                    <button
                      onClick={setHtmlMode}
                      className={`px-3 py-1 text-xs font-medium ${
                        viewMode === 'html'
                          ? 'bg-purple-700 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      HTML
                    </button>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
          </thead>
          
          {/* Table Body - Each block is a row */}
          <tbody>
            {blocks.map((block, index) => (
              <tr key={block.id} className="hover:bg-purple-25">
                {/* Column 1 - Thing1 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 2 - Thing2 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 3 - lineyoshi */}
                <td className="border border-gray-300 p-2 text-center text-gray-700 text-sm font-medium">
                  {index + 1}
                </td>
                
                {/* Column 4 - Thing4 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 5 - Content (TipTap Editor or HTML View) */}
                <td className="border border-gray-300 p-1" style={{ width: '600px' }}>
                  {viewMode === 'html' ? (
                    <div className="p-2 bg-gray-100 rounded border min-h-[2rem] font-mono text-xs">
                      <div className="text-gray-600 mb-1 text-xs">Raw HTML:</div>
                      <pre className="whitespace-pre-wrap">{getBlockHtml(block.id)}</pre>
                    </div>
                  ) : (
                    <BlockEditor
                      block={block}
                      onUpdate={handleBlockUpdate}
                      onEnterPressed={handleEnterPressed}
                      onBackspacePressed={handleBackspacePressed}
                      onFocus={handleBlockFocus}
                      focused={focusedBlock === block.id}
                      onEditorReady={handleEditorReady}
                    />
                  )}
                </td>
                
                {/* Column 6 - Thing6 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 7 - Thing7 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 8 - Thing8 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with actions */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {viewMode === 'visual' ? (
              <>
                Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> to create new block, 
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-2">Backspace</kbd> at start to merge
              </>
            ) : (
              <>
                <span className="text-orange-600 font-medium">HTML View Mode:</span> Viewing raw HTML content - 
                switch to Visual mode to edit
              </>
            )}
          </div>
          <button
            onClick={() => {
              const newBlock: EditorBlock = {
                id: generateId(),
                type: 'paragraph',
                htmlContent: '<p></p>'
              };
              setBlocks(prev => [...prev, newBlock]);
              setFocusedBlock(newBlock.id);
            }}
            disabled={viewMode === 'html'}
            className={`px-3 py-1 rounded text-xs ${
              viewMode === 'html'
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            + Add Block
          </button>
        </div>
      </div>

      {/* Custom CSS for block styling and table layout */}
      <style jsx>{`
        .block-paragraph {
          margin: 0;
          padding: 0;
        }
        
        .ProseMirror {
          outline: none;
          min-width: 580px; /* Ensure minimum width for content area */
        }
        
        .ProseMirror p {
          margin: 0;
        }
        
        kbd {
          font-family: monospace;
        }
        
        /* Ensure table layout stability */
        table {
          table-layout: fixed;
          min-width: 1000px; /* Minimum table width to accommodate all columns */
        }
        
        /* Content column specific styling (now column 5) */
        td:nth-child(5) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        /* Other columns styling */
        td:not(:nth-child(5)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
        
        /* Header column styling (Content column is now 5) */
        th:nth-child(5) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        th:not(:nth-child(5)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
      `}</style>
    </div>
  );
}