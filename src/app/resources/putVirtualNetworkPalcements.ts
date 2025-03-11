import * as definitions from './definitions';
import * as manageCFResources from './manageCFResources';
import VirtualNetworkPlacement from './virtualNetworkPlacement';
import dispatch, { PutVirtualNetworkPlacementAction } from './dispatch';

export default function putVirtualNetworkPlacement(
  this: any,
  resourceId: any,
  virtualNetworkId: any,
) {
  if (!(resourceId in this.resources)) {
    throw new Error(
      `Failed to put virtual network placement for ${resourceId}: ${resourceId} does not exist in state`,
    );
  }

  if (!(virtualNetworkId in this.resources)) {
    throw new Error(
      `Failed to put virtual network placement for ${resourceId}: ${virtualNetworkId} does not exist in state`,
    );
  }

  const resource = this.resources[resourceId];
  const virtualNetwork = this.resources[virtualNetworkId];

  if (
    !(
      resource.Type in
      definitions[this.format as 'SAM' | 'serverless'].VirtualNetworkPlacements
    )
  ) {
    throw new Error(
      `Failed to put virtual network placement for ${resourceId}: Resource type ${resource.Type} does not have a VirtualNetworkPlacement definition`,
    );
  }

  const definition =
    definitions[this.format as 'SAM' | 'serverless'].VirtualNetworkPlacements[
      resource.Type
    ];

  let resourceObj = this.cfTemplate().Resources[resourceId];
  if (this.format === 'serverless' && resource.Type === 'function') {
    resourceObj = this.template.functions[resource.Settings.Name];
  }

  const action = new PutVirtualNetworkPlacementAction(
    this.format,
    this.cfTemplate(),
    resource,
    virtualNetwork,
  );

  dispatch(action, this.template);

  if ('Permissions' in definition) {
    for (const permission of definition.Permissions) {
      this.addPermission(resourceId, permission);
    }
  }

  manageCFResources.updateExistingSubnetIdReferences(
    this.template,
    virtualNetworkId,
  );
  manageCFResources.updateExistingSubnetIdReferences(
    this.resources,
    virtualNetworkId,
  );

  manageCFResources.updateDefaultParameters(this.template);

  this.virtualNetworkPlacements[resourceId] = new VirtualNetworkPlacement(
    this.format,
    definition,
    this.template,
    this.resources,
    resourceObj,
  );
}
