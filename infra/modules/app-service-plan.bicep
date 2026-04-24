param name string
param location string
param sku string
param tags object = {}
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: name
  location: location
  tags: tags
  sku: { name: sku }
  kind: 'linux'
  properties: { reserved: true }
}
output id string = plan.id
