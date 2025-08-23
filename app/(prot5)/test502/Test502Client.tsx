'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import DrenjariButtonBarDriggsmanLinks from '@/app/components/DrenjariButtonBarDriggsmanLinks';

export default function Test502Client() {
  const { user } = useAuth();
  const router = useRouter();
  const [todoItems, setTodoItems] = useState<string[]>(['Test server-side titles', 'Check authentication', 'Verify navigation']);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodoItems([...todoItems, newTodo.trim()]);
      setNewTodo('');
    }
  };

  const removeTodo = (index: number) => {
    setTodoItems(todoItems.filter((_, i) => i !== index));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-800">📝 Test502 Page</h1>
            <DrenjariButtonBarDriggsmanLinks />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Test Page - Server-Side Title</div>
            <div className="text-xs text-gray-400">Route Group: (prot5)</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Interactive Todo List Test</h2>
            
            {/* Add Todo */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo item..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              />
              <button
                onClick={addTodo}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {/* Todo List */}
            <div className="space-y-2">
              {todoItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-800">{item}</span>
                  <button
                    onClick={() => removeTodo(index)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {todoItems.length === 0 && (
                <div className="text-gray-500 text-center py-8">No todo items yet. Add one above!</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Server-Side Title Verification</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800">✅ Test Checklist:</h3>
                <ul className="mt-2 text-green-700 space-y-1">
                  <li>• View Page Source → Search for "&lt;title&gt;" → Should find "/test502 - Snefuru"</li>
                  <li>• Browser tab title appears instantly (no flash)</li>
                  <li>• Todo list functionality works (add/remove items)</li>
                  <li>• Drenjari button bar navigation works</li>
                  <li>• Authentication protection works</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800">🏗️ Architecture Comparison:</h3>
                <div className="mt-2 text-blue-700 space-y-1">
                  <div><strong>Before (Protected):</strong> Client layout → No server-side titles</div>
                  <div><strong>After (Prot5):</strong> Server layout → Client wrapper → Server-side titles ✅</div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h3 className="font-medium text-purple-800">📊 Current Stats:</h3>
                <div className="mt-2 text-purple-700 space-y-1">
                  <div>Todo Items: {todoItems.length}</div>
                  <div>User Status: {user ? 'Authenticated ✅' : 'Not authenticated ❌'}</div>
                  <div>Route: /test502</div>
                  <div>Layout Type: Server-side with client wrapper</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}