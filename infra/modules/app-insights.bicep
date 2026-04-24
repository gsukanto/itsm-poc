param name string
param location string
param workspaceId string
param tags object = {}
resource ai 'Microsoft.Insights/components@2020-02-02' = {
  name: name
  location: location
  tags: tags
  kind: 'web'
  properties: { Application_Type: 'web', WorkspaceResourceId: workspaceId }
}
output connectionString string = ai.properties.ConnectionString
