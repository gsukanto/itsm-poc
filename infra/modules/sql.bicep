param serverName string
param dbName string
param location string
param adminLogin string
@secure() param adminPassword string
param tags object = {}
resource server 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: serverName
  location: location
  tags: tags
  properties: { administratorLogin: adminLogin, administratorLoginPassword: adminPassword, version: '12.0' }
}
resource db 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: server
  name: dbName
  location: location
  sku: { name: 'GP_S_Gen5_2', tier: 'GeneralPurpose', family: 'Gen5', capacity: 2 }
  properties: { autoPauseDelay: 60, minCapacity: json('0.5') }
}
resource fw 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: server
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}
output serverFqdn string = server.properties.fullyQualifiedDomainName
