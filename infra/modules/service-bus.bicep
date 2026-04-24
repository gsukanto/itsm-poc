param namespaceName string
param location string
param tags object = {}
resource ns 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: namespaceName
  location: location
  tags: tags
  sku: { name: 'Standard', tier: 'Standard' }
}
resource notif 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = { parent: ns, name: 'notifications' }
resource sla 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = { parent: ns, name: 'sla' }
resource events 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = { parent: ns, name: 'events' }
resource rule 'Microsoft.ServiceBus/namespaces/AuthorizationRules@2022-10-01-preview' existing = {
  parent: ns
  name: 'RootManageSharedAccessKey'
}
output primaryConnectionString string = rule.listKeys().primaryConnectionString
