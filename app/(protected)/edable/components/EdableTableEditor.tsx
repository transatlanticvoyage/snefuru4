'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { useDorliBlocks } from '../hooks/useDorliBlocks';

interface EditorBlock {
  id: string;
  type: string;
  content?: JSONContent;
  htmlContent: string;
}

interface EdableTableEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  gconPieceId?: string;
  initialTitle?: string;
  onTitleChange?: (title: string) => void;
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

export default function EdableTableEditor({ initialContent = '<p>Start typing...</p>', onContentChange, gconPieceId, initialTitle = '', onTitleChange }: EdableTableEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());

  // Fetch dorli blocks
  const { dorliBlocks, loading: dorliLoading, error: dorliError, updateDorliBlock, getDorliByPlaceholder } = useDorliBlocks(gconPieceId || null);

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

  // Check if a block content is a dorli placeholder
  const isDorliPlaceholder = (content: string): boolean => {
    return /^{{DORLI:[A-Z]+:\d+}}$/.test(content.trim());
  };

  // Extract placeholder from block content
  const extractDorliPlaceholder = (content: string): string | null => {
    const match = content.match(/^{{DORLI:[A-Z]+:\d+}}$/);
    return match ? match[0] : null;
  };

  // Replace Dorli placeholders with raw HTML content
  const resolveDorliContent = (content: string): string => {
    // Check if the content is a Dorli placeholder
    const placeholder = extractDorliPlaceholder(content);
    if (placeholder) {
      const dorliBlock = getDorliByPlaceholder(placeholder);
      if (dorliBlock) {
        console.log(`🔄 Resolving Dorli placeholder ${placeholder} with ${dorliBlock.raw.length} chars of HTML`);
        return dorliBlock.raw;
      } else {
        console.warn(`⚠️ Dorli block not found for placeholder: ${placeholder}`);
        return content; // Return original content if not found
      }
    }
    return content; // Return original content if not a placeholder
  };

  const handleBlockUpdate = useCallback((blockId: string, content: string) => {
    setBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block => {
        if (block.id === blockId) {
          // Check if the original block content was a Dorli placeholder
          const originalContent = block.htmlContent;
          const placeholder = extractDorliPlaceholder(originalContent);
          
          if (placeholder) {
            // This is a Dorli block - update the dorli table directly
            const dorliBlock = getDorliByPlaceholder(placeholder);
            if (dorliBlock) {
              console.log(`🔄 Updating Dorli block ${placeholder} with new content`);
              updateDorliBlock(dorliBlock.dorli_id, content);
            }
            // Keep the original placeholder in the block content for storage
            return { ...block, htmlContent: originalContent };
          } else {
            // Regular block - update normally
            return { ...block, htmlContent: content };
          }
        }
        return block;
      });
      
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
  }, [onContentChange, getDorliByPlaceholder, updateDorliBlock, extractDorliPlaceholder]);

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

  // Selection handlers
  const handleBlockSelection = useCallback((blockId: string) => {
    setSelectedBlocks(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(blockId)) {
        newSelection.delete(blockId);
      } else {
        newSelection.add(blockId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedBlocks.size === blocks.length) {
      // Deselect all
      setSelectedBlocks(new Set());
    } else {
      // Select all
      setSelectedBlocks(new Set(blocks.map(block => block.id)));
    }
  }, [blocks, selectedBlocks.size]);

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
          <h3 className="text-lg font-semibold text-purple-800">10-Column Table Editor</h3>
          <div className="text-sm text-purple-600">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} × 10 columns | 
            <span className={`ml-2 font-medium ${viewMode === 'visual' ? 'text-green-600' : 'text-orange-600'}`}>
              {viewMode === 'visual' ? '📝 Visual Mode' : '💻 HTML Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* 10-Column Table Structure with 6-Row Header (including prisomi and select) */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          {/* Table Header - 6 Rows */}
          <thead>
            {/* Header Row 1 - Blank placeholders */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">1</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300" style={{ padding: '6px 10px', width: '46px', maxWidth: '46px', minWidth: '46px' }}></th>
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
              <th className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">2</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300" style={{ padding: '6px 10px' }}></th>
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
              <th className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">3</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2 text-center text-sm font-bold text-purple-700">
                lineyoshi
              </th>
              <th className="border border-gray-300 p-2 text-center text-sm font-bold text-purple-700">
                Content
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
            
            {/* Header Row 4 - Toolbar row */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">4</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2">
                {/* TipTap Toolbar in Header */}
                <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {/* Tools box label */}
                    <div className="mr-2 flex items-center">
                      <span className="text-sm font-bold text-gray-800" style={{ fontSize: '14px' }}>tools_box1</span>
                    </div>
                    
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
                </div>
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
            
            {/* Header Row 5 - aval_title row */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">5</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300" style={{ padding: '6px 10px' }}></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2">
                <div className="space-y-2">
                  <div className="font-bold text-sm text-purple-700">aval_title</div>
                  <input
                    type="text"
                    value={initialTitle}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    className="w-full px-3 py-2 text-lg font-bold bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter title..."
                  />
                </div>
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
            
            {/* Header Row 6 - aval_content label row */}
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                <div className="relative group">
                  <div className="text-center text-xs font-normal text-gray-600">6</div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <span className="font-bold">prisomi column</span>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                    </div>
                  </div>
                </div>
              </th>
              <th className="border border-gray-300" style={{ padding: '6px 10px' }}>
                <input
                  type="checkbox"
                  checked={selectedBlocks.size === blocks.length && blocks.length > 0}
                  onChange={handleSelectAll}
                  className="w-[26px] h-[26px] cursor-pointer"
                />
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2">
                <div className="font-bold text-sm text-purple-700">aval_content</div>
              </th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
              <th className="border border-gray-300 p-2"></th>
            </tr>
          </thead>
          
          {/* Table Body - Each block is a row */}
          <tbody>
            {blocks.map((block, index) => {
              const rowNumber = index + 7; // Start at 7 since we have 6 header rows
              const showTooltip = rowNumber <= 5; // Only show tooltip for rows 1-5
              
              return (
                <tr key={block.id} className="hover:bg-purple-25">
                  {/* Prisomi Column */}
                  <td className="border border-gray-300 p-0 w-5" style={{ width: '20px', maxWidth: '20px', minWidth: '20px' }}>
                    <div className={`relative ${showTooltip ? 'group' : ''}`}>
                      <div className="text-center text-xs font-normal text-gray-600">{rowNumber}</div>
                      {showTooltip && (
                        <>
                          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                            <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                              <span className="font-bold">prisomi column</span>
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="border-solid border-t-gray-800 border-t-4 border-x-transparent border-x-4 border-b-0"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  {/* Select Column */}
                  <td 
                    className="border border-gray-300 cursor-pointer" 
                    style={{ padding: '6px 10px', width: '46px', maxWidth: '46px', minWidth: '46px' }}
                    onClick={() => handleBlockSelection(block.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBlocks.has(block.id)}
                      onChange={() => handleBlockSelection(block.id)}
                      className="w-[26px] h-[26px] cursor-pointer pointer-events-none"
                    />
                  </td>
                  
                  {/* Column 3 - Thing1 */}
                  <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                    -
                  </td>
                
                {/* Column 4 - Thing2 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 5 - Thing3 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 6 - lineyoshi */}
                <td className="border border-gray-300 p-2 text-center text-gray-700 text-sm font-medium">
                  {index + 1}
                </td>
                
                {/* Column 7 - Content (TipTap Editor or HTML View) */}
                <td className="border border-gray-300 p-1" style={{ width: '600px' }}>
                  {(() => {
                    const blockContent = getBlockHtml(block.id);
                    
                    // Resolve Dorli placeholders to their raw HTML content
                    const resolvedContent = resolveDorliContent(blockContent);
                    
                    // Create a resolved block for the editor
                    const resolvedBlock = {
                      ...block,
                      htmlContent: resolvedContent
                    };

                    // Regular content - render normal editor or HTML view
                    return viewMode === 'html' ? (
                      <div className="p-2 bg-gray-100 rounded border min-h-[2rem] font-mono text-xs">
                        <pre className="whitespace-pre-wrap">{resolvedContent}</pre>
                      </div>
                    ) : (
                      <BlockEditor
                        block={resolvedBlock}
                        onUpdate={handleBlockUpdate}
                        onEnterPressed={handleEnterPressed}
                        onBackspacePressed={handleBackspacePressed}
                        onFocus={handleBlockFocus}
                        focused={focusedBlock === block.id}
                        onEditorReady={handleEditorReady}
                      />
                    );
                  })()}
                </td>
                
                {/* Column 8 - Thing6 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 9 - Thing7 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 10 - Thing8 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                </tr>
              );
            })}
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
        
        /* Prisomi column specific styling */
        td:nth-child(1), th:nth-child(1) {
          width: 20px !important;
          max-width: 20px;
          min-width: 20px;
          padding: 0 !important;
        }
        
        /* Select column specific styling */
        td:nth-child(2), th:nth-child(2) {
          width: 46px !important;
          max-width: 46px;
          min-width: 46px;
          padding: 6px 10px !important;
        }
        
        /* Content column specific styling (now column 7 with prisomi and select) */
        td:nth-child(7) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        /* Other columns styling */
        td:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(7)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
        
        /* Header column styling (Content column is now 7 with prisomi and select) */
        th:nth-child(7) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        th:not(:nth-child(1)):not(:nth-child(2)):not(:nth-child(7)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
      `}</style>
    </div>
  );
}