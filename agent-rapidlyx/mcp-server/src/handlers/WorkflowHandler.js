import fs from 'fs-extra';
import path from 'path';

export class WorkflowHandler {
  constructor({ workflowsPath, logger }) {
    this.workflowsPath = workflowsPath;
    this.logger = logger;
    this.workflows = new Map();
  }

  async initialize() {
    await fs.ensureDir(this.workflowsPath);
    await this.loadWorkflows();
    this.logger.info('✅ Workflow handler initialized');
  }

  async loadWorkflows() {
    try {
      const workflowsFile = path.join(this.workflowsPath, 'workflows.json');
      if (await fs.pathExists(workflowsFile)) {
        const data = await fs.readJson(workflowsFile);
        Object.entries(data).forEach(([key, value]) => {
          this.workflows.set(key, value);
        });
        this.logger.info(`⚡ Loaded ${this.workflows.size} workflows`);
      }
    } catch (error) {
      this.logger.warn('Failed to load workflows:', error.message);
    }
  }

  async handleTool(toolName, args) {
    switch (toolName) {
      case 'rapidlyx_workflow_execute':
        return await this.executeWorkflow(args);
        
      case 'rapidlyx_workflow_create':
        return await this.createWorkflow(args);
        
      case 'rapidlyx_workflow_list':
        return await this.listWorkflows(args);
        
      default:
        throw new Error(`Unknown workflow tool: ${toolName}`);
    }
  }

  async executeWorkflow({ workflow, params = {}, dryRun = false }) {
    try {
      const workflowDef = this.workflows.get(workflow);
      if (!workflowDef) {
        throw new Error(`Workflow not found: ${workflow}`);
      }
      
      this.logger.info(`⚡ ${dryRun ? 'Dry-run' : 'Executing'} workflow: ${workflow}`);
      
      // Placeholder for workflow execution logic
      return {
        success: true,
        workflow,
        dryRun,
        steps: workflowDef.steps?.length || 0,
        message: `Workflow ${dryRun ? 'dry-run' : 'execution'} completed`
      };
    } catch (error) {
      this.logger.error('Workflow execution error:', error);
      throw error;
    }
  }

  async createWorkflow({ name, description, steps, triggers = [] }) {
    try {
      const workflow = {
        name,
        description,
        steps,
        triggers,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      this.workflows.set(name, workflow);
      await this.saveWorkflows();
      
      this.logger.info(`⚡ Created workflow: ${name}`);
      
      return {
        success: true,
        name,
        message: 'Workflow created successfully'
      };
    } catch (error) {
      this.logger.error('Create workflow error:', error);
      throw error;
    }
  }

  async listWorkflows({ category, status = 'all' }) {
    try {
      const workflows = [...this.workflows.values()];
      
      let filtered = workflows;
      if (status !== 'all') {
        filtered = filtered.filter(w => w.status === status);
      }
      if (category) {
        filtered = filtered.filter(w => w.category === category);
      }
      
      return {
        success: true,
        workflows: filtered.map(w => ({
          name: w.name,
          description: w.description,
          status: w.status,
          stepCount: w.steps?.length || 0,
          createdAt: w.createdAt
        })),
        total: filtered.length
      };
    } catch (error) {
      this.logger.error('List workflows error:', error);
      throw error;
    }
  }

  async saveWorkflows() {
    try {
      const workflowsFile = path.join(this.workflowsPath, 'workflows.json');
      const data = Object.fromEntries(this.workflows);
      await fs.writeJson(workflowsFile, data, { spaces: 2 });
    } catch (error) {
      this.logger.error('Failed to save workflows:', error);
    }
  }

  async execute(workflowName, params) {
    return await this.executeWorkflow({ workflow: workflowName, params });
  }

  async getResource() {
    return {
      type: 'workflows',
      total: this.workflows.size,
      active: [...this.workflows.values()].filter(w => w.status === 'active').length,
      categories: [...new Set([...this.workflows.values()].map(w => w.category).filter(Boolean))]
    };
  }
}