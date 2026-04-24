param name string
param location string
param planId string
param nodeVersion string = 'NODE|20-lts'
param tags object = {}
param appSettings array = []
resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  tags: tags
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: planId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: nodeVersion
      alwaysOn: true
      appSettings: appSettings
    }
  }
}
output defaultHostname string = app.properties.defaultHostName
output principalId string = app.identity.principalId
