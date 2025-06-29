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
  focused 
}: {
  block: EditorBlock;
  onUpdate: (id: string, content: string) => void;
  onEnterPressed: (id: string) => void;
  onBackspacePressed: (id: string) => void;
  onFocus: (id: string) => void;
  focused: boolean;
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
    }
  }, [focused, editor]);

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

export default function EdableTableEditor({ initialContent = '<p>Start typing...</p>', onContentChange }: EdableTableEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);

  // Parse initial content into blocks
  useEffect(() => {
    if (initialContent) {
      parseContentIntoBlocks(initialContent);
    }
  }, [initialContent]);

  const parseContentIntoBlocks = (html: string) => {
    const parsedBlocks: EditorBlock[] = [];
    
    try {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html || '<p>Start typing...</p>';
      
      const elements = tempDiv.children;
      
      // If no block elements found, create a single paragraph
      if (elements.length === 0 || tempDiv.textContent?.trim() === '') {
        parsedBlocks.push({
          id: generateId(),
          type: 'paragraph',
          htmlContent: '<p>Start typing...</p>'
        });
      } else {
        // Convert each block element to an editor block
        Array.from(elements).forEach((element) => {
          const blockHtml = element.outerHTML;
          const blockType = element.tagName.toLowerCase();
          
          // Ensure we have valid content
          if (blockHtml && blockHtml.trim() !== '') {
            parsedBlocks.push({
              id: generateId(),
              type: blockType === 'p' ? 'paragraph' : blockType,
              htmlContent: blockHtml
            });
          }
        });
        
        // If no valid blocks were created, add a default paragraph
        if (parsedBlocks.length === 0) {
          parsedBlocks.push({
            id: generateId(),
            type: 'paragraph',
            htmlContent: '<p>Start typing...</p>'
          });
        }
      }
    } catch (error) {
      console.error('Error parsing content into blocks:', error);
      // Fallback to a single paragraph
      parsedBlocks.push({
        id: generateId(),
        type: 'paragraph',
        htmlContent: '<p>Start typing...</p>'
      });
    }
    
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
      
      // Combine all blocks into final HTML and call onChange
      const combinedHtml = updatedBlocks
        .map(block => block.htmlContent)
        .join('');
      
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
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-purple-100 border-b border-purple-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-purple-800">7-Column Table Editor</h3>
          <div className="text-sm text-purple-600">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} × 7 columns
          </div>
        </div>
      </div>

      {/* 7-Column Table Structure */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          {/* Table Header */}
          <thead>
            <tr className="bg-purple-50">
              <th className="border border-gray-300 p-2 text-left text-sm font-bold text-purple-700 w-20">
                Thing1
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-bold text-purple-700 w-20">
                Thing2
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-bold text-purple-700 w-20">
                Thing3
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-medium text-purple-700" style={{ width: '600px' }}>
                Content
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-bold text-purple-700 w-20">
                Thing5
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-bold text-purple-700 w-20">
                Thing6
              </th>
              <th className="border border-gray-300 p-2 text-left text-sm font-bold text-purple-700 w-20">
                Thing7
              </th>
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
                
                {/* Column 3 - Thing3 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 4 - Content (TipTap Editor) */}
                <td className="border border-gray-300 p-1" style={{ width: '600px' }}>
                  <BlockEditor
                    block={block}
                    onUpdate={handleBlockUpdate}
                    onEnterPressed={handleEnterPressed}
                    onBackspacePressed={handleBackspacePressed}
                    onFocus={handleBlockFocus}
                    focused={focusedBlock === block.id}
                  />
                </td>
                
                {/* Column 5 - Thing5 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 6 - Thing6 */}
                <td className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                  -
                </td>
                
                {/* Column 7 - Thing7 */}
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
            Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> to create new block, 
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-2">Backspace</kbd> at start to merge
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
            className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
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
        
        /* Content column specific styling */
        td:nth-child(4) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        /* Other columns styling */
        td:not(:nth-child(4)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
        
        /* Header column styling */
        th:nth-child(4) {
          width: 600px !important;
          max-width: 600px;
          min-width: 600px;
        }
        
        th:not(:nth-child(4)) {
          width: 80px;
          max-width: 120px;
          min-width: 60px;
        }
      `}</style>
    </div>
  );
}