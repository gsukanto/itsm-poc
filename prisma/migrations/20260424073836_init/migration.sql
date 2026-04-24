BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [entraOid] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [displayName] NVARCHAR(1000) NOT NULL,
    [givenName] NVARCHAR(1000),
    [surname] NVARCHAR(1000),
    [jobTitle] NVARCHAR(1000),
    [department] NVARCHAR(1000),
    [managerId] UNIQUEIDENTIFIER,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_entraOid_key] UNIQUE NONCLUSTERED ([entraOid]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermission] (
    [roleId] UNIQUEIDENTIFIER NOT NULL,
    [permissionId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [RolePermission_pkey] PRIMARY KEY CLUSTERED ([roleId],[permissionId])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [roleId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([userId],[roleId])
);

-- CreateTable
CREATE TABLE [dbo].[Group] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [Group_type_df] DEFAULT 'support',
    [isActive] BIT NOT NULL CONSTRAINT [Group_isActive_df] DEFAULT 1,
    CONSTRAINT [Group_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Group_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[GroupMembership] (
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [groupId] UNIQUEIDENTIFIER NOT NULL,
    [isLead] BIT NOT NULL CONSTRAINT [GroupMembership_isLead_df] DEFAULT 0,
    CONSTRAINT [GroupMembership_pkey] PRIMARY KEY CLUSTERED ([userId],[groupId])
);

-- CreateTable
CREATE TABLE [dbo].[AuditEvent] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [entityType] NVARCHAR(1000) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [actorId] UNIQUEIDENTIFIER,
    [before] NVARCHAR(max),
    [after] NVARCHAR(max),
    [metadata] NVARCHAR(max),
    [occurredAt] DATETIME2 NOT NULL CONSTRAINT [AuditEvent_occurredAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Attachment] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [entityType] NVARCHAR(1000) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [contentType] NVARCHAR(1000) NOT NULL,
    [sizeBytes] INT NOT NULL,
    [blobPath] NVARCHAR(1000) NOT NULL,
    [uploadedById] UNIQUEIDENTIFIER,
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [Attachment_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Attachment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Worklog] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [entityType] NVARCHAR(1000) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [authorId] UNIQUEIDENTIFIER,
    [visibility] NVARCHAR(1000) NOT NULL CONSTRAINT [Worklog_visibility_df] DEFAULT 'internal',
    [body] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Worklog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Worklog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [recipientId] UNIQUEIDENTIFIER NOT NULL,
    [channel] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [body] NVARCHAR(max) NOT NULL,
    [entityType] NVARCHAR(1000),
    [entityId] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Notification_status_df] DEFAULT 'queued',
    [sentAt] DATETIME2,
    [readAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Approval] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [entityType] NVARCHAR(1000) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [stepNumber] INT NOT NULL,
    [approverId] UNIQUEIDENTIFIER,
    [approverGroupId] UNIQUEIDENTIFIER,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Approval_status_df] DEFAULT 'pending',
    [comment] NVARCHAR(max),
    [decidedAt] DATETIME2,
    [dueAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Approval_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Approval_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ServiceHours] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [timezone] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceHours_timezone_df] DEFAULT 'UTC',
    [schedule] NVARCHAR(max) NOT NULL,
    CONSTRAINT [ServiceHours_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ServiceHours_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Holiday] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [serviceHoursId] UNIQUEIDENTIFIER NOT NULL,
    [date] DATETIME2 NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Holiday_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Sla] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [priority] NVARCHAR(1000),
    [serviceHoursId] UNIQUEIDENTIFIER,
    [responseMins] INT,
    [resolveMins] INT,
    [isActive] BIT NOT NULL CONSTRAINT [Sla_isActive_df] DEFAULT 1,
    [supplierId] UNIQUEIDENTIFIER,
    CONSTRAINT [Sla_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Sla_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[SlaTimer] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [slaId] UNIQUEIDENTIFIER NOT NULL,
    [entityType] NVARCHAR(1000) NOT NULL,
    [entityId] NVARCHAR(1000) NOT NULL,
    [metric] NVARCHAR(1000) NOT NULL,
    [startedAt] DATETIME2 NOT NULL,
    [pausedAt] DATETIME2,
    [pausedTotalSec] INT NOT NULL CONSTRAINT [SlaTimer_pausedTotalSec_df] DEFAULT 0,
    [dueAt] DATETIME2 NOT NULL,
    [metAt] DATETIME2,
    [breached] BIT NOT NULL CONSTRAINT [SlaTimer_breached_df] DEFAULT 0,
    [breachedAt] DATETIME2,
    CONSTRAINT [SlaTimer_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CiType] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [parentId] UNIQUEIDENTIFIER,
    [attributesSchema] NVARCHAR(max),
    CONSTRAINT [CiType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CiType_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[ConfigurationItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [ciTypeId] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ConfigurationItem_status_df] DEFAULT 'active',
    [environment] NVARCHAR(1000),
    [ownerGroupId] UNIQUEIDENTIFIER,
    [attributes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ConfigurationItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ConfigurationItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ConfigurationItem_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[CiRelationship] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sourceId] UNIQUEIDENTIFIER NOT NULL,
    [targetId] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CiRelationship_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CiRelationship_sourceId_targetId_type_key] UNIQUE NONCLUSTERED ([sourceId],[targetId],[type])
);

-- CreateTable
CREATE TABLE [dbo].[CiBaseline] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER NOT NULL,
    [snapshot] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CiBaseline_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CiBaseline_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [domain] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [parentId] UNIQUEIDENTIFIER,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_domain_key_key] UNIQUE NONCLUSTERED ([domain],[key])
);

-- CreateTable
CREATE TABLE [dbo].[Incident] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Incident_status_df] DEFAULT 'new',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [Incident_priority_df] DEFAULT 'P3',
    [urgency] NVARCHAR(1000) NOT NULL CONSTRAINT [Incident_urgency_df] DEFAULT 'medium',
    [impact] NVARCHAR(1000) NOT NULL CONSTRAINT [Incident_impact_df] DEFAULT 'medium',
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [Incident_source_df] DEFAULT 'portal',
    [isMajor] BIT NOT NULL CONSTRAINT [Incident_isMajor_df] DEFAULT 0,
    [categoryId] UNIQUEIDENTIFIER,
    [requesterId] UNIQUEIDENTIFIER NOT NULL,
    [assigneeId] UNIQUEIDENTIFIER,
    [supportGroupId] UNIQUEIDENTIFIER,
    [problemId] UNIQUEIDENTIFIER,
    [resolution] NVARCHAR(max),
    [resolutionCode] NVARCHAR(1000),
    [resolvedAt] DATETIME2,
    [closedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Incident_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [triggerEventId] UNIQUEIDENTIFIER,
    CONSTRAINT [Incident_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Incident_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[IncidentCi] (
    [incidentId] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [IncidentCi_pkey] PRIMARY KEY CLUSTERED ([incidentId],[ciId])
);

-- CreateTable
CREATE TABLE [dbo].[ServiceCatalogCategory] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [parentId] UNIQUEIDENTIFIER,
    CONSTRAINT [ServiceCatalogCategory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ServiceCatalogCategory_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[CatalogItem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [categoryId] UNIQUEIDENTIFIER NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [CatalogItem_isActive_df] DEFAULT 1,
    [formSchema] NVARCHAR(max),
    [approvalSchema] NVARCHAR(max),
    [fulfilmentSchema] NVARCHAR(max),
    [estCostCents] INT,
    [estDeliveryDays] INT,
    CONSTRAINT [CatalogItem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CatalogItem_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[ServiceRequest] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceRequest_status_df] DEFAULT 'new',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [ServiceRequest_priority_df] DEFAULT 'P3',
    [catalogItemId] UNIQUEIDENTIFIER,
    [formData] NVARCHAR(max),
    [requesterId] UNIQUEIDENTIFIER NOT NULL,
    [assigneeId] UNIQUEIDENTIFIER,
    [supportGroupId] UNIQUEIDENTIFIER,
    [resolvedAt] DATETIME2,
    [closedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ServiceRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ServiceRequest_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ServiceRequest_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[FulfilmentTask] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [requestId] UNIQUEIDENTIFIER NOT NULL,
    [sequence] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [FulfilmentTask_status_df] DEFAULT 'pending',
    [assigneeId] UNIQUEIDENTIFIER,
    [groupId] UNIQUEIDENTIFIER,
    [completedAt] DATETIME2,
    CONSTRAINT [FulfilmentTask_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Problem] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Problem_status_df] DEFAULT 'new',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [Problem_priority_df] DEFAULT 'P3',
    [raisedById] UNIQUEIDENTIFIER NOT NULL,
    [assigneeId] UNIQUEIDENTIFIER,
    [supportGroupId] UNIQUEIDENTIFIER,
    [rootCause] NVARCHAR(max),
    [workaround] NVARCHAR(max),
    [resolution] NVARCHAR(max),
    [resolvedAt] DATETIME2,
    [closedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Problem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Problem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Problem_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[ProblemCi] (
    [problemId] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ProblemCi_pkey] PRIMARY KEY CLUSTERED ([problemId],[ciId])
);

-- CreateTable
CREATE TABLE [dbo].[KnownError] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [problemId] UNIQUEIDENTIFIER NOT NULL,
    [symptoms] NVARCHAR(max) NOT NULL,
    [cause] NVARCHAR(max) NOT NULL,
    [workaround] NVARCHAR(max) NOT NULL,
    [publishedAt] DATETIME2,
    CONSTRAINT [KnownError_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [KnownError_problemId_key] UNIQUE NONCLUSTERED ([problemId])
);

-- CreateTable
CREATE TABLE [dbo].[ChangeRequest] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [changeType] NVARCHAR(1000) NOT NULL CONSTRAINT [ChangeRequest_changeType_df] DEFAULT 'normal',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ChangeRequest_status_df] DEFAULT 'draft',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [ChangeRequest_priority_df] DEFAULT 'P3',
    [riskScore] INT NOT NULL CONSTRAINT [ChangeRequest_riskScore_df] DEFAULT 0,
    [riskLevel] NVARCHAR(1000) NOT NULL CONSTRAINT [ChangeRequest_riskLevel_df] DEFAULT 'low',
    [raisedById] UNIQUEIDENTIFIER NOT NULL,
    [ownerId] UNIQUEIDENTIFIER,
    [supportGroupId] UNIQUEIDENTIFIER,
    [plannedStart] DATETIME2,
    [plannedEnd] DATETIME2,
    [actualStart] DATETIME2,
    [actualEnd] DATETIME2,
    [implementationPlan] NVARCHAR(max),
    [rollbackPlan] NVARCHAR(max),
    [testPlan] NVARCHAR(max),
    [postReview] NVARCHAR(max),
    [releaseId] UNIQUEIDENTIFIER,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ChangeRequest_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ChangeRequest_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ChangeRequest_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[ChangeCi] (
    [changeId] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ChangeCi_pkey] PRIMARY KEY CLUSTERED ([changeId],[ciId])
);

-- CreateTable
CREATE TABLE [dbo].[FreezeWindow] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [startsAt] DATETIME2 NOT NULL,
    [endsAt] DATETIME2 NOT NULL,
    [scope] NVARCHAR(max),
    [reason] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [FreezeWindow_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [FreezeWindow_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Release] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [Release_type_df] DEFAULT 'minor',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Release_status_df] DEFAULT 'planning',
    [managerId] UNIQUEIDENTIFIER,
    [plannedAt] DATETIME2,
    [releasedAt] DATETIME2,
    [releasePlan] NVARCHAR(max),
    [deploymentPlan] NVARCHAR(max),
    [rollbackPlan] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Release_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Release_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Release_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[ReleaseTask] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [releaseId] UNIQUEIDENTIFIER NOT NULL,
    [sequence] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ReleaseTask_status_df] DEFAULT 'pending',
    [assigneeId] UNIQUEIDENTIFIER,
    [dueAt] DATETIME2,
    [completedAt] DATETIME2,
    CONSTRAINT [ReleaseTask_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ReleaseCi] (
    [releaseId] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [ReleaseCi_pkey] PRIMARY KEY CLUSTERED ([releaseId],[ciId])
);

-- CreateTable
CREATE TABLE [dbo].[KbArticle] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [KbArticle_status_df] DEFAULT 'draft',
    [authorId] UNIQUEIDENTIFIER,
    [category] NVARCHAR(1000),
    [tags] NVARCHAR(max),
    [body] NVARCHAR(max) NOT NULL,
    [publishedAt] DATETIME2,
    [reviewDueAt] DATETIME2,
    [views] INT NOT NULL CONSTRAINT [KbArticle_views_df] DEFAULT 0,
    [helpful] INT NOT NULL CONSTRAINT [KbArticle_helpful_df] DEFAULT 0,
    [notHelpful] INT NOT NULL CONSTRAINT [KbArticle_notHelpful_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [KbArticle_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [KbArticle_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [KbArticle_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[KbArticleVersion] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [version] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [body] NVARCHAR(max) NOT NULL,
    [createdById] UNIQUEIDENTIFIER,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [KbArticleVersion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [KbArticleVersion_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [KbArticleVersion_articleId_version_key] UNIQUE NONCLUSTERED ([articleId],[version])
);

-- CreateTable
CREATE TABLE [dbo].[KbFeedback] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [articleId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER,
    [helpful] BIT NOT NULL,
    [comment] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [KbFeedback_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [KbFeedback_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EventSource] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [EventSource_isActive_df] DEFAULT 1,
    CONSTRAINT [EventSource_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [EventSource_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[EventRecord] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sourceId] UNIQUEIDENTIFIER NOT NULL,
    [externalId] NVARCHAR(1000),
    [severity] NVARCHAR(1000) NOT NULL CONSTRAINT [EventRecord_severity_df] DEFAULT 'info',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [EventRecord_status_df] DEFAULT 'open',
    [message] NVARCHAR(max) NOT NULL,
    [payload] NVARCHAR(max),
    [ciId] UNIQUEIDENTIFIER,
    [correlationKey] NVARCHAR(1000),
    [incidentId] UNIQUEIDENTIFIER,
    [occurredAt] DATETIME2 NOT NULL CONSTRAINT [EventRecord_occurredAt_df] DEFAULT CURRENT_TIMESTAMP,
    [acknowledgedAt] DATETIME2,
    [closedAt] DATETIME2,
    CONSTRAINT [EventRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EventRule] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sourceId] UNIQUEIDENTIFIER,
    [name] NVARCHAR(1000) NOT NULL,
    [matchExpr] NVARCHAR(max) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [EventRule_isActive_df] DEFAULT 1,
    [priority] INT NOT NULL CONSTRAINT [EventRule_priority_df] DEFAULT 100,
    CONSTRAINT [EventRule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AvailabilityPlan] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [serviceKey] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [targetPct] FLOAT(53) NOT NULL,
    [windowDays] INT NOT NULL CONSTRAINT [AvailabilityPlan_windowDays_df] DEFAULT 30,
    [notes] NVARCHAR(max),
    CONSTRAINT [AvailabilityPlan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AvailabilityPlan_serviceKey_key] UNIQUE NONCLUSTERED ([serviceKey])
);

-- CreateTable
CREATE TABLE [dbo].[OutageRecord] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER,
    [serviceKey] NVARCHAR(1000),
    [startedAt] DATETIME2 NOT NULL,
    [endedAt] DATETIME2,
    [type] NVARCHAR(1000) NOT NULL CONSTRAINT [OutageRecord_type_df] DEFAULT 'unplanned',
    [reason] NVARCHAR(max),
    [incidentId] UNIQUEIDENTIFIER,
    CONSTRAINT [OutageRecord_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CapacityPlan] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [serviceKey] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [notes] NVARCHAR(max),
    CONSTRAINT [CapacityPlan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CapacityPlan_serviceKey_key] UNIQUE NONCLUSTERED ([serviceKey])
);

-- CreateTable
CREATE TABLE [dbo].[CapacityMetric] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ciId] UNIQUEIDENTIFIER NOT NULL,
    [metric] NVARCHAR(1000) NOT NULL,
    [value] FLOAT(53) NOT NULL,
    [unit] NVARCHAR(1000),
    [capturedAt] DATETIME2 NOT NULL CONSTRAINT [CapacityMetric_capturedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CapacityMetric_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CapacityThreshold] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [planId] UNIQUEIDENTIFIER NOT NULL,
    [metric] NVARCHAR(1000) NOT NULL,
    [warnAt] FLOAT(53) NOT NULL,
    [critAt] FLOAT(53) NOT NULL,
    CONSTRAINT [CapacityThreshold_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ContinuityPlan] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [serviceKey] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [rtoMinutes] INT NOT NULL,
    [rpoMinutes] INT NOT NULL,
    [strategy] NVARCHAR(max),
    [lastTestedAt] DATETIME2,
    CONSTRAINT [ContinuityPlan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ContinuityPlan_serviceKey_key] UNIQUE NONCLUSTERED ([serviceKey])
);

-- CreateTable
CREATE TABLE [dbo].[DrTest] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [planId] UNIQUEIDENTIFIER NOT NULL,
    [scheduledAt] DATETIME2 NOT NULL,
    [executedAt] DATETIME2,
    [result] NVARCHAR(1000),
    [notes] NVARCHAR(max),
    CONSTRAINT [DrTest_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Supplier] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [contactName] NVARCHAR(1000),
    [contactEmail] NVARCHAR(1000),
    [contactPhone] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Supplier_isActive_df] DEFAULT 1,
    CONSTRAINT [Supplier_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Supplier_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[Contract] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [supplierId] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [startsAt] DATETIME2 NOT NULL,
    [endsAt] DATETIME2 NOT NULL,
    [valueCents] INT,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [Contract_currency_df] DEFAULT 'USD',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Contract_status_df] DEFAULT 'active',
    CONSTRAINT [Contract_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Contract_refNo_key] UNIQUE NONCLUSTERED ([refNo])
);

-- CreateTable
CREATE TABLE [dbo].[ContractObligation] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [contractId] UNIQUEIDENTIFIER NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [dueAt] DATETIME2,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ContractObligation_status_df] DEFAULT 'open',
    CONSTRAINT [ContractObligation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SupplierReview] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [contractId] UNIQUEIDENTIFIER NOT NULL,
    [reviewedAt] DATETIME2 NOT NULL,
    [score] INT NOT NULL,
    [notes] NVARCHAR(max),
    CONSTRAINT [SupplierReview_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Asset] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [refNo] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Asset_status_df] DEFAULT 'in_stock',
    [serialNumber] NVARCHAR(1000),
    [model] NVARCHAR(1000),
    [vendor] NVARCHAR(1000),
    [ownerId] UNIQUEIDENTIFIER,
    [ciId] UNIQUEIDENTIFIER,
    [contractId] UNIQUEIDENTIFIER,
    [purchaseDate] DATETIME2,
    [warrantyEnd] DATETIME2,
    [costCents] INT,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [Asset_currency_df] DEFAULT 'USD',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Asset_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Asset_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Asset_refNo_key] UNIQUE NONCLUSTERED ([refNo]),
    CONSTRAINT [Asset_ciId_key] UNIQUE NONCLUSTERED ([ciId])
);

-- CreateTable
CREATE TABLE [dbo].[AssetLifecycleEvent] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [assetId] UNIQUEIDENTIFIER NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [notes] NVARCHAR(max),
    [occurredAt] DATETIME2 NOT NULL CONSTRAINT [AssetLifecycleEvent_occurredAt_df] DEFAULT CURRENT_TIMESTAMP,
    [actorId] UNIQUEIDENTIFIER,
    CONSTRAINT [AssetLifecycleEvent_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SoftwareLicense] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [assetId] UNIQUEIDENTIFIER,
    [product] NVARCHAR(1000) NOT NULL,
    [vendor] NVARCHAR(1000),
    [licenseKey] NVARCHAR(1000),
    [seats] INT NOT NULL CONSTRAINT [SoftwareLicense_seats_df] DEFAULT 1,
    [seatsUsed] INT NOT NULL CONSTRAINT [SoftwareLicense_seatsUsed_df] DEFAULT 0,
    [expiresAt] DATETIME2,
    CONSTRAINT [SoftwareLicense_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CostCenter] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CostCenter_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CostCenter_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[CostModel] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [formula] NVARCHAR(max) NOT NULL,
    CONSTRAINT [CostModel_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CostModel_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[Budget] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [costCenterId] UNIQUEIDENTIFIER NOT NULL,
    [fiscalYear] INT NOT NULL,
    [amountCents] INT NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [Budget_currency_df] DEFAULT 'USD',
    CONSTRAINT [Budget_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Budget_costCenterId_fiscalYear_key] UNIQUE NONCLUSTERED ([costCenterId],[fiscalYear])
);

-- CreateTable
CREATE TABLE [dbo].[Charge] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [costCenterId] UNIQUEIDENTIFIER NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [amountCents] INT NOT NULL,
    [currency] NVARCHAR(1000) NOT NULL CONSTRAINT [Charge_currency_df] DEFAULT 'USD',
    [entityType] NVARCHAR(1000),
    [entityId] NVARCHAR(1000),
    [occurredAt] DATETIME2 NOT NULL CONSTRAINT [Charge_occurredAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Charge_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SavedView] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ownerId] UNIQUEIDENTIFIER,
    [module] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [isShared] BIT NOT NULL CONSTRAINT [SavedView_isShared_df] DEFAULT 0,
    [filter] NVARCHAR(max) NOT NULL,
    [columns] NVARCHAR(max),
    [sort] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SavedView_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SavedView_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationTemplate] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [channel] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [body] NVARCHAR(max) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [NotificationTemplate_isActive_df] DEFAULT 1,
    CONSTRAINT [NotificationTemplate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [NotificationTemplate_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[Counter] (
    [key] NVARCHAR(1000) NOT NULL,
    [value] INT NOT NULL CONSTRAINT [Counter_value_df] DEFAULT 0,
    CONSTRAINT [Counter_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditEvent_entityType_entityId_idx] ON [dbo].[AuditEvent]([entityType], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditEvent_actorId_idx] ON [dbo].[AuditEvent]([actorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AuditEvent_occurredAt_idx] ON [dbo].[AuditEvent]([occurredAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Attachment_entityType_entityId_idx] ON [dbo].[Attachment]([entityType], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Worklog_entityType_entityId_idx] ON [dbo].[Worklog]([entityType], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Notification_recipientId_status_idx] ON [dbo].[Notification]([recipientId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Approval_entityType_entityId_idx] ON [dbo].[Approval]([entityType], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Approval_approverId_status_idx] ON [dbo].[Approval]([approverId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SlaTimer_entityType_entityId_idx] ON [dbo].[SlaTimer]([entityType], [entityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SlaTimer_dueAt_metAt_idx] ON [dbo].[SlaTimer]([dueAt], [metAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_status_idx] ON [dbo].[Incident]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_assigneeId_idx] ON [dbo].[Incident]([assigneeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Incident_supportGroupId_idx] ON [dbo].[Incident]([supportGroupId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EventRecord_severity_status_idx] ON [dbo].[EventRecord]([severity], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [EventRecord_correlationKey_idx] ON [dbo].[EventRecord]([correlationKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [CapacityMetric_ciId_metric_capturedAt_idx] ON [dbo].[CapacityMetric]([ciId], [metric], [capturedAt]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_managerId_fkey] FOREIGN KEY ([managerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermission] ADD CONSTRAINT [RolePermission_permissionId_fkey] FOREIGN KEY ([permissionId]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[GroupMembership] ADD CONSTRAINT [GroupMembership_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[GroupMembership] ADD CONSTRAINT [GroupMembership_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Group]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AuditEvent] ADD CONSTRAINT [AuditEvent_actorId_fkey] FOREIGN KEY ([actorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Worklog] ADD CONSTRAINT [Worklog_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_recipientId_fkey] FOREIGN KEY ([recipientId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Approval] ADD CONSTRAINT [Approval_approverId_fkey] FOREIGN KEY ([approverId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Holiday] ADD CONSTRAINT [Holiday_serviceHoursId_fkey] FOREIGN KEY ([serviceHoursId]) REFERENCES [dbo].[ServiceHours]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Sla] ADD CONSTRAINT [Sla_serviceHoursId_fkey] FOREIGN KEY ([serviceHoursId]) REFERENCES [dbo].[ServiceHours]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Sla] ADD CONSTRAINT [Sla_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[Supplier]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SlaTimer] ADD CONSTRAINT [SlaTimer_slaId_fkey] FOREIGN KEY ([slaId]) REFERENCES [dbo].[Sla]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CiType] ADD CONSTRAINT [CiType_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[CiType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ConfigurationItem] ADD CONSTRAINT [ConfigurationItem_ciTypeId_fkey] FOREIGN KEY ([ciTypeId]) REFERENCES [dbo].[CiType]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CiRelationship] ADD CONSTRAINT [CiRelationship_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CiRelationship] ADD CONSTRAINT [CiRelationship_targetId_fkey] FOREIGN KEY ([targetId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CiBaseline] ADD CONSTRAINT [CiBaseline_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Category] ADD CONSTRAINT [Category_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_requesterId_fkey] FOREIGN KEY ([requesterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_supportGroupId_fkey] FOREIGN KEY ([supportGroupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Incident] ADD CONSTRAINT [Incident_problemId_fkey] FOREIGN KEY ([problemId]) REFERENCES [dbo].[Problem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[IncidentCi] ADD CONSTRAINT [IncidentCi_incidentId_fkey] FOREIGN KEY ([incidentId]) REFERENCES [dbo].[Incident]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[IncidentCi] ADD CONSTRAINT [IncidentCi_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceCatalogCategory] ADD CONSTRAINT [ServiceCatalogCategory_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[ServiceCatalogCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CatalogItem] ADD CONSTRAINT [CatalogItem_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[ServiceCatalogCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceRequest] ADD CONSTRAINT [ServiceRequest_catalogItemId_fkey] FOREIGN KEY ([catalogItemId]) REFERENCES [dbo].[CatalogItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceRequest] ADD CONSTRAINT [ServiceRequest_requesterId_fkey] FOREIGN KEY ([requesterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceRequest] ADD CONSTRAINT [ServiceRequest_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ServiceRequest] ADD CONSTRAINT [ServiceRequest_supportGroupId_fkey] FOREIGN KEY ([supportGroupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FulfilmentTask] ADD CONSTRAINT [FulfilmentTask_requestId_fkey] FOREIGN KEY ([requestId]) REFERENCES [dbo].[ServiceRequest]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Problem] ADD CONSTRAINT [Problem_raisedById_fkey] FOREIGN KEY ([raisedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Problem] ADD CONSTRAINT [Problem_assigneeId_fkey] FOREIGN KEY ([assigneeId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Problem] ADD CONSTRAINT [Problem_supportGroupId_fkey] FOREIGN KEY ([supportGroupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProblemCi] ADD CONSTRAINT [ProblemCi_problemId_fkey] FOREIGN KEY ([problemId]) REFERENCES [dbo].[Problem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProblemCi] ADD CONSTRAINT [ProblemCi_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[KnownError] ADD CONSTRAINT [KnownError_problemId_fkey] FOREIGN KEY ([problemId]) REFERENCES [dbo].[Problem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChangeRequest] ADD CONSTRAINT [ChangeRequest_raisedById_fkey] FOREIGN KEY ([raisedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChangeRequest] ADD CONSTRAINT [ChangeRequest_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChangeRequest] ADD CONSTRAINT [ChangeRequest_supportGroupId_fkey] FOREIGN KEY ([supportGroupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChangeRequest] ADD CONSTRAINT [ChangeRequest_releaseId_fkey] FOREIGN KEY ([releaseId]) REFERENCES [dbo].[Release]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ChangeCi] ADD CONSTRAINT [ChangeCi_changeId_fkey] FOREIGN KEY ([changeId]) REFERENCES [dbo].[ChangeRequest]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChangeCi] ADD CONSTRAINT [ChangeCi_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Release] ADD CONSTRAINT [Release_managerId_fkey] FOREIGN KEY ([managerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ReleaseTask] ADD CONSTRAINT [ReleaseTask_releaseId_fkey] FOREIGN KEY ([releaseId]) REFERENCES [dbo].[Release]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ReleaseCi] ADD CONSTRAINT [ReleaseCi_releaseId_fkey] FOREIGN KEY ([releaseId]) REFERENCES [dbo].[Release]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ReleaseCi] ADD CONSTRAINT [ReleaseCi_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[KbArticle] ADD CONSTRAINT [KbArticle_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[KbArticleVersion] ADD CONSTRAINT [KbArticleVersion_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[KbArticle]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[KbFeedback] ADD CONSTRAINT [KbFeedback_articleId_fkey] FOREIGN KEY ([articleId]) REFERENCES [dbo].[KbArticle]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[EventRecord] ADD CONSTRAINT [EventRecord_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[EventSource]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EventRecord] ADD CONSTRAINT [EventRecord_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[EventRule] ADD CONSTRAINT [EventRule_sourceId_fkey] FOREIGN KEY ([sourceId]) REFERENCES [dbo].[EventSource]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OutageRecord] ADD CONSTRAINT [OutageRecord_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CapacityMetric] ADD CONSTRAINT [CapacityMetric_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CapacityThreshold] ADD CONSTRAINT [CapacityThreshold_planId_fkey] FOREIGN KEY ([planId]) REFERENCES [dbo].[CapacityPlan]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DrTest] ADD CONSTRAINT [DrTest_planId_fkey] FOREIGN KEY ([planId]) REFERENCES [dbo].[ContinuityPlan]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Contract] ADD CONSTRAINT [Contract_supplierId_fkey] FOREIGN KEY ([supplierId]) REFERENCES [dbo].[Supplier]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ContractObligation] ADD CONSTRAINT [ContractObligation_contractId_fkey] FOREIGN KEY ([contractId]) REFERENCES [dbo].[Contract]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SupplierReview] ADD CONSTRAINT [SupplierReview_contractId_fkey] FOREIGN KEY ([contractId]) REFERENCES [dbo].[Contract]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Asset] ADD CONSTRAINT [Asset_ownerId_fkey] FOREIGN KEY ([ownerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asset] ADD CONSTRAINT [Asset_ciId_fkey] FOREIGN KEY ([ciId]) REFERENCES [dbo].[ConfigurationItem]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asset] ADD CONSTRAINT [Asset_contractId_fkey] FOREIGN KEY ([contractId]) REFERENCES [dbo].[Contract]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[AssetLifecycleEvent] ADD CONSTRAINT [AssetLifecycleEvent_assetId_fkey] FOREIGN KEY ([assetId]) REFERENCES [dbo].[Asset]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SoftwareLicense] ADD CONSTRAINT [SoftwareLicense_assetId_fkey] FOREIGN KEY ([assetId]) REFERENCES [dbo].[Asset]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Budget] ADD CONSTRAINT [Budget_costCenterId_fkey] FOREIGN KEY ([costCenterId]) REFERENCES [dbo].[CostCenter]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Charge] ADD CONSTRAINT [Charge_costCenterId_fkey] FOREIGN KEY ([costCenterId]) REFERENCES [dbo].[CostCenter]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
