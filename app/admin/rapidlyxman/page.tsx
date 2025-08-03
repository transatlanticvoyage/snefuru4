'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Brain, 
  Database, 
  MessageSquare, 
  Workflow, 
  Settings, 
  TrendingUp, 
  FileText, 
  Play, 
  Pause, 
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Eye,
  BarChart3,
  Clock,
  Users,
  Activity
} from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  createdAt: string;
  relevance?: number;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  tags: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  stepCount: number;
  lastRun?: string;
}

export default function RapidlyxManagerPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'training'>('offline');
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Rapidlyx Manager - Snefuru Admin';
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading data - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setKnowledgeEntries([
        {
          id: '1',
          title: 'WordPress Site Creation Pattern',
          content: 'Standard process for creating new WordPress sites in Snefuru...',
          type: 'pattern',
          tags: ['wordpress', 'creation', 'automation'],
          createdAt: '2024-08-03T10:30:00Z'
        },
        {
          id: '2',
          title: 'Database Migration Best Practices',
          content: 'Guidelines for safe database migrations...',
          type: 'documentation',
          tags: ['database', 'migration', 'best-practices'],
          createdAt: '2024-08-02T15:45:00Z'
        }
      ]);

      setConversations([
        {
          id: '1',
          title: 'Host account table field analysis',
          messageCount: 12,
          createdAt: '2024-08-03T09:15:00Z',
          tags: ['database', 'analysis']
        },
        {
          id: '2',
          title: 'MCP server configuration help',
          messageCount: 8,
          createdAt: '2024-08-03T08:30:00Z',
          tags: ['mcp', 'configuration']
        }
      ]);

      setWorkflows([
        {
          id: '1',
          name: 'New Site Setup',
          description: 'Complete WordPress site creation workflow',
          status: 'active',
          stepCount: 7,
          lastRun: '2024-08-03T09:00:00Z'
        },
        {
          id: '2',
          name: 'Database Backup',
          description: 'Automated database backup and verification',
          status: 'active',
          stepCount: 4,
          lastRun: '2024-08-03T06:00:00Z'
        }
      ]);

      setAgentStatus('online');
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                agentStatus === 'online' ? 'bg-green-500' : 
                agentStatus === 'training' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-2xl font-bold capitalize">{agentStatus}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {agentStatus === 'online' ? 'Ready for tasks' : 'Unavailable'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Entries</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              Total conversations stored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {workflows.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest Rapidlyx agent activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Brain className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Knowledge entry added</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Conversation analyzed</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Workflow className="h-4 w-4 text-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Workflow executed</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>Rapidlyx learning from your patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Code Patterns</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Conversation Analysis</span>
                  <span>72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Workflow Optimization</span>
                  <span>91%</span>
                </div>
                <Progress value={91} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const KnowledgeTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-300"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Knowledge
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {knowledgeEntries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{entry.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{entry.type}</Badge>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {entry.content.substring(0, 150)}...
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ConversationsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search conversations..."
            className="w-300"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {conversations.map((conversation) => (
          <Card key={conversation.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{conversation.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{conversation.messageCount} messages</Badge>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {conversation.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(conversation.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const WorkflowsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Automation Workflows</h3>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{workflow.name}</CardTitle>
                  <CardDescription>{workflow.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={workflow.status === 'active' ? 'default' : 'secondary'}
                  >
                    {workflow.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span>{workflow.stepCount} steps</span>
                {workflow.lastRun && (
                  <span className="text-muted-foreground">
                    Last run: {formatDate(workflow.lastRun)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>Configure Rapidlyx agent behavior and capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input id="agentName" defaultValue="Rapidlyx" />
            </div>
            <div>
              <Label htmlFor="logLevel">Log Level</Label>
              <select className="w-full p-2 border rounded-md">
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea 
              id="systemPrompt"
              rows={4}
              defaultValue="You are Rapidlyx, an AI agent specialized in Snefuru development workflows..."
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked />
              <span>Enable Knowledge Learning</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked />
              <span>Auto-save Conversations</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span>Sandbox Mode</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Manage connected data sources for the agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5" />
                <div>
                  <p className="font-medium">Supabase Database</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5" />
                <div>
                  <p className="font-medium">Codebase Files</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Patterns</CardTitle>
          <CardDescription>How Rapidlyx is being used over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            [Chart would go here - showing usage patterns over time]
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Rapidlyx Manager</h1>
        <p className="text-muted-foreground">
          Manage and monitor your AI agent for Snefuru development workflows
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeTab />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationsTab />
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowsTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}