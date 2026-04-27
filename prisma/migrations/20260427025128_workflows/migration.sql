BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Approval] ADD [metadata] NVARCHAR(max);

-- CreateTable
CREATE TABLE [dbo].[Workflow] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [module] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Workflow_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Workflow_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Workflow_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Workflow_module_key] UNIQUE NONCLUSTERED ([module])
);

-- CreateTable
CREATE TABLE [dbo].[WorkflowState] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workflowId] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(1000) NOT NULL CONSTRAINT [WorkflowState_color_df] DEFAULT '#9e9e9e',
    [order] INT NOT NULL CONSTRAINT [WorkflowState_order_df] DEFAULT 0,
    [isInitial] BIT NOT NULL CONSTRAINT [WorkflowState_isInitial_df] DEFAULT 0,
    [isTerminal] BIT NOT NULL CONSTRAINT [WorkflowState_isTerminal_df] DEFAULT 0,
    [requiresApproval] BIT NOT NULL CONSTRAINT [WorkflowState_requiresApproval_df] DEFAULT 0,
    [approverRoleKey] NVARCHAR(1000),
    [approverGroupKey] NVARCHAR(1000),
    CONSTRAINT [WorkflowState_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [WorkflowState_workflowId_key_key] UNIQUE NONCLUSTERED ([workflowId],[key])
);

-- CreateTable
CREATE TABLE [dbo].[WorkflowTransition] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [workflowId] UNIQUEIDENTIFIER NOT NULL,
    [fromStateId] UNIQUEIDENTIFIER NOT NULL,
    [toStateId] UNIQUEIDENTIFIER NOT NULL,
    [label] NVARCHAR(1000),
    CONSTRAINT [WorkflowTransition_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [WorkflowTransition_workflowId_fromStateId_toStateId_key] UNIQUE NONCLUSTERED ([workflowId],[fromStateId],[toStateId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [WorkflowState_workflowId_order_idx] ON [dbo].[WorkflowState]([workflowId], [order]);

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowState] ADD CONSTRAINT [WorkflowState_workflowId_fkey] FOREIGN KEY ([workflowId]) REFERENCES [dbo].[Workflow]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowTransition] ADD CONSTRAINT [WorkflowTransition_workflowId_fkey] FOREIGN KEY ([workflowId]) REFERENCES [dbo].[Workflow]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowTransition] ADD CONSTRAINT [WorkflowTransition_fromStateId_fkey] FOREIGN KEY ([fromStateId]) REFERENCES [dbo].[WorkflowState]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowTransition] ADD CONSTRAINT [WorkflowTransition_toStateId_fkey] FOREIGN KEY ([toStateId]) REFERENCES [dbo].[WorkflowState]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
