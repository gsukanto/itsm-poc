// ITSM platform - main Bicep template
// Provisions: Resource Group resources for App Service (api+web), SQL,
// Storage (blob), Service Bus, App Insights, Key Vault.

targetScope = 'resourceGroup'

@description('Base name used for all resources, e.g. itsm-prod')
param baseName string

@description('Location for all resources')
param location string = resourceGroup().location

@description('SQL admin login')
param sqlAdminLogin string

@secure()
@description('SQL admin password')
param sqlAdminPassword string

@description('Microsoft Entra ID tenant ID for the API audience')
param entraTenantId string

@description('App Service SKU')
param appServiceSku string = 'B1'

var tags = { project: 'itsm', env: baseName }

module law 'modules/log-analytics.bicep' = {
  name: 'law'
  params: { name: '${baseName}-law', location: location, tags: tags }
}

module ai 'modules/app-insights.bicep' = {
  name: 'ai'
  params: { name: '${baseName}-ai', location: location, workspaceId: law.outputs.id, tags: tags }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: { name: replace('${baseName}sa', '-', ''), location: location, tags: tags }
}

module sb 'modules/service-bus.bicep' = {
  name: 'sb'
  params: { namespaceName: '${baseName}-sb', location: location, tags: tags }
}

module sql 'modules/sql.bicep' = {
  name: 'sql'
  params: {
    serverName: '${baseName}-sql'
    dbName: 'itsm'
    location: location
    adminLogin: sqlAdminLogin
    adminPassword: sqlAdminPassword
    tags: tags
  }
}

module kv 'modules/key-vault.bicep' = {
  name: 'kv'
  params: { name: '${baseName}-kv', location: location, tenantId: entraTenantId, tags: tags }
}

module plan 'modules/app-service-plan.bicep' = {
  name: 'plan'
  params: { name: '${baseName}-plan', location: location, sku: appServiceSku, tags: tags }
}

module apiApp 'modules/web-app.bicep' = {
  name: 'apiApp'
  params: {
    name: '${baseName}-api'
    location: location
    planId: plan.outputs.id
    nodeVersion: 'NODE|20-lts'
    tags: tags
    appSettings: [
      { name: 'NODE_ENV', value: 'production' }
      { name: 'API_PORT', value: '8080' }
      { name: 'WEBSITES_PORT', value: '8080' }
      { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: ai.outputs.connectionString }
      { name: 'AZURE_STORAGE_CONNECTION_STRING', value: storage.outputs.primaryConnectionString }
      { name: 'AZURE_STORAGE_CONTAINER', value: 'attachments' }
      { name: 'SERVICE_BUS_CONNECTION_STRING', value: sb.outputs.primaryConnectionString }
      { name: 'DATABASE_URL', value: 'sqlserver://${sql.outputs.serverFqdn}:1433;database=itsm;user=${sqlAdminLogin};password=${sqlAdminPassword};encrypt=true;trustServerCertificate=false' }
      { name: 'ENTRA_TENANT_ID', value: entraTenantId }
      { name: 'ENTRA_AUDIENCE', value: 'api://itsm' }
    ]
  }
}

module webApp 'modules/web-app.bicep' = {
  name: 'webApp'
  params: {
    name: '${baseName}-web'
    location: location
    planId: plan.outputs.id
    nodeVersion: 'NODE|20-lts'
    tags: tags
    appSettings: [
      { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: ai.outputs.connectionString }
    ]
  }
}

output apiUrl string = apiApp.outputs.defaultHostname
output webUrl string = webApp.outputs.defaultHostname
output sqlServer string = sql.outputs.serverFqdn
