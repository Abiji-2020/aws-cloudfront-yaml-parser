import * as definitions from './definitions';
import { updateDefaultParameters, cleanupTemplate } from './manageCFResources';
import dispatch, { DeleteVirtualNetworkPlacementAction } from './dispatch';

export default function deleteVirtualNetworkPlacement(
  this: any,
  resourceId: any,
) {
  if (!(resourceId in this.virtualNetworkPlacements)) {
    throw new Error(
      `Failed to delete virtual network placement for resource ${resourceId}: Resource is not placed in a virtual network`,
    );
  }

  const resource = this.resources[resourceId];
  const definition =
    definitions[this.format as 'SAM' | 'serverless'].VirtualNetworkPlacements[
      resource.Type
    ];

  /* We don't delete serverless function permissions as other functions may need
   * them */
  if (
    (this.format !== 'serverless' || resource.Type !== 'function') &&
    'Permissions' in definition
  ) {
    for (const permission of definition.Permissions) {
      this.deletePermission(resourceId, permission);
    }
  }

  const action = new DeleteVirtualNetworkPlacementAction(this.format, resource);

  dispatch(action, this.template);

  /* Compute resources spawning Docker Tasks require the subnet IDs the tasks
   * will run in. We add this to compute resources referencing the Docker Task
   * as the DOCKER_TASK_SUBNETS env var.
   *
   * Here, we try to find the DOCKER_TASK_SUBNETS env var (which could be
   * suffixed if there are multiple) by looking for the DOCKER_TASK_ARN env var
   * and doing a string replacement. If we find it, then we drop back to using
   * the default VPC subnets. */
  if (resource.Type === 'dockerTask') {
    for (const [referenceResourceId, references] of Object.entries(
      this.references,
    )) {
      for (const [referenceId, reference] of Object.entries(
        references as any,
      )) {
        if ((reference as any).isLogicalId(resourceId)) {
          const subnetIDsReferenceId = referenceId.replace('_ARN', '_SUBNETS');
          const environment =
            this.resources[referenceResourceId].Settings.Environment;

          if (subnetIDsReferenceId in environment) {
            environment[subnetIDsReferenceId] = {
              'Fn::Join': [',', { Ref: 'DefaultVPCSubnets' }],
            };

            this.updateResourceSetting(
              referenceResourceId,
              'Environment',
              environment,
            );
          }
        }
      }
    }
  }

  updateDefaultParameters(this.template);

  delete this.virtualNetworkPlacements[resourceId];

  cleanupTemplate(this);
}
