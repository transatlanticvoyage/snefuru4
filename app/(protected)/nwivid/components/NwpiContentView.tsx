'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NwpiContent {
  id: string;
  fk_users_id: string;
  fk_sitespren_id: string;
  fk_sitespren_base: string;
  post_id: number;
  post_author: number | null;
  post_date: string | null;
  post_date_gmt: string | null;
  post_modified: string | null;
  post_content: string | null;
  post_content_filtered: string | null;
  post_title: string | null;
  post_excerpt: string | null;
  post_status: string | null;
  post_type: string | null;
  post_name: string | null;
  post_password: string | null;
  comment_status: string | null;
  ping_status: string | null;
  to_ping: string | null;
  pinged: string | null;
  guid: string | null;
  post_parent: number | null;
  menu_order: number | null;
  post_mime_type: string | null;
  comment_count: number | null;
  i_raw_metadata: any;
  i_sync_method: string | null;
  i_sync_version: number | null;
  i_sync_status: string | null;
  i_sync_started_at: string | null;
  i_sync_completed_at: string | null;
  i_sync_attempt_count: number | null;
  i_sync_error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface NwpiContentViewProps {
  content: NwpiContent;
  userInternalId: string;
}

export default function NwpiContentView({ content }: NwpiContentViewProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'sync'>('content');

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusBadge = (status: string | null, syncStatus: string | null) => {
    if (syncStatus === 'failed') {
      return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">Sync Failed</span>;
    }
    
    switch (status) {
      case 'publish':
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">Published</span>;
      case 'draft':
        return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>;
      case 'private':
        return <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">Private</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">{status || 'Unknown'}</span>;
    }
  };

  const getSyncMethodBadge = (method: string | null) => {
    switch (method) {
      case 'plugin_api':
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">Plugin API</span>;
      case 'rest_api':
        return <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">REST API</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">{method || 'Unknown'}</span>;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link 
              href="/nwjar1"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Content List
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            db table: nwpi_content
          </div>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {content.post_title || 'Untitled'}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <strong>Site:</strong> {content.fk_sitespren_base}
              </span>
              <span className="text-sm text-gray-600">
                <strong>Post ID:</strong> {content.post_id}
              </span>
              <span className="text-sm text-gray-600">
                <strong>Type:</strong> {content.post_type}
              </span>
              {getStatusBadge(content.post_status, content.i_sync_status)}
              {getSyncMethodBadge(content.i_sync_method)}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metadata'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Metadata
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Info
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Post Excerpt */}
          {content.post_excerpt && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excerpt</h3>
              <p className="text-gray-700">{content.post_excerpt}</p>
            </div>
          )}

          {/* Post Content */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Content</h3>
              <button
                onClick={() => copyToClipboard(content.post_content || '')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Copy Content
              </button>
            </div>
            <div className="p-4">
              {content.post_content ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.post_content }}
                />
              ) : (
                <p className="text-gray-500 italic">No content available</p>
              )}
            </div>
          </div>

          {/* Filtered Content (if different) */}
          {content.post_content_filtered && content.post_content_filtered !== content.post_content && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Filtered Content</h3>
              </div>
              <div className="p-4">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: content.post_content_filtered }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Post Name (Slug)</dt>
                <dd className="text-sm text-gray-900">{content.post_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">GUID</dt>
                <dd className="text-sm text-gray-900 break-all">{content.guid || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Author ID</dt>
                <dd className="text-sm text-gray-900">{content.post_author || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Parent Post</dt>
                <dd className="text-sm text-gray-900">{content.post_parent || 'None'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Menu Order</dt>
                <dd className="text-sm text-gray-900">{content.menu_order || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">MIME Type</dt>
                <dd className="text-sm text-gray-900">{content.post_mime_type || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Dates */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Published</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.post_date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Published (GMT)</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.post_date_gmt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.post_modified)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Record Created</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Record Updated</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.updated_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Comments & Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments & Settings</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Comment Status</dt>
                <dd className="text-sm text-gray-900">{content.comment_status || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ping Status</dt>
                <dd className="text-sm text-gray-900">{content.ping_status || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Comment Count</dt>
                <dd className="text-sm text-gray-900">{content.comment_count || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Password Protected</dt>
                <dd className="text-sm text-gray-900">{content.post_password ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">To Ping</dt>
                <dd className="text-sm text-gray-900">{content.to_ping || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Pinged</dt>
                <dd className="text-sm text-gray-900">{content.pinged || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* Raw Metadata */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Metadata</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                {content.i_raw_metadata ? JSON.stringify(content.i_raw_metadata, null, 2) : 'No metadata available'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sync Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Sync Method</dt>
                <dd className="text-sm text-gray-900">{getSyncMethodBadge(content.i_sync_method)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sync Version</dt>
                <dd className="text-sm text-gray-900">{content.i_sync_version || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sync Status</dt>
                <dd className="text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    content.i_sync_status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : content.i_sync_status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {content.i_sync_status || 'unknown'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Attempt Count</dt>
                <dd className="text-sm text-gray-900">{content.i_sync_attempt_count || 0}</dd>
              </div>
            </dl>
          </div>

          {/* Sync Dates */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Timing</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Sync Started</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.i_sync_started_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sync Completed</dt>
                <dd className="text-sm text-gray-900">{formatDate(content.i_sync_completed_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Error Information */}
          {content.i_sync_error_message && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Sync Error</h3>
              <p className="text-sm text-red-700">{content.i_sync_error_message}</p>
            </div>
          )}

          {/* Database References */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database References</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Content ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{content.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Site ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{content.fk_sitespren_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{content.fk_users_id}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}