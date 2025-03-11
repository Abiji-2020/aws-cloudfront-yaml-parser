import cloneDeep from 'clone-deep';
import * as definitions from './definitions';
import {
  injectContext,
  updateDefaultParameters,
  updateExistingResourceConditions,
} from './manageCFResources';
import { types as permissionTypes } from './permission';
import isComputeResource from '../utils/isComputeResource';

export default function addDefaultReferences(
  this: any,
  sourceId: any,
  targetId: any,
) {
  const source = this.resources[sourceId];
  if (!source) {
    throw new Error(
      `Failed to add reference: Source resource '${sourceId}' not found`,
    );
  }

  if (!isComputeResource(source.Type)) {
    throw new Error(
      `Failed to add reference: Source '${sourceId}' (${source.Type}) is not a valid source - source must be a compute resource`,
    );
  }

  const target = this.resources[targetId];
  if (!target) {
    throw new Error(
      `Failed to add reference: Target resource '${targetId}' not found`,
    );
  }

  const resourceTypes =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes;

  if (resourceTypes[target.Type].DefaultReferences) {
    resourceTypes[target.Type].DefaultReferences.forEach((_reference: any) => {
      const reference = cloneDeep(_reference);
      const environment = source.Settings.Environment || {};

      const context: any = {
        resourceId: targetId,
      };

      if (targetId in this.virtualNetworkPlacements) {
        const placement = this.virtualNetworkPlacements[targetId];

        context['VPC:SubnetIds'] = {
          'Fn::Join': [
            ',',
            placement.SubnetIds.map((id: any) => ({ Ref: id.ResourceId })),
          ],
        };
      } else {
        context['VPC:SubnetIds'] = {
          'Fn::Join': [',', { Ref: 'DefaultVPCSubnets' }],
        };
      }

      for (const key in reference) {
        reference[key] = injectContext(reference[key], context);

        let index: any = '';
        let indexedKey = index ? key + '_' + index.toString() : key;

        while (environment[indexedKey]) {
          index = index ? index + 1 : 2;
          indexedKey = key + '_' + index.toString();
        }

        environment[indexedKey] = reference[key];
      }

      if (target.Settings.UseExistingResource) {
        updateExistingResourceConditions(environment, target, true);
      }

      this.updateResourceSetting(sourceId, 'Environment', environment);
    });
  }

  if (
    resourceTypes[target.Type].DefaultPermissions &&
    source.Type !== 'website'
  ) {
    addReferencePermissions.call(this, sourceId, targetId);
  }

  updateDefaultParameters(this.template);
}

export function addReferencePermissions(
  this: any,
  sourceId: any,
  targetId: any,
) {
  const resourceTypes =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes;
  const source = this.resources[sourceId];
  const target = this.resources[targetId];

  if (!resourceTypes[target.Type].DefaultPermissions) {
    return;
  }

  let defaultPermissions;

  if (
    this.format === 'SAM' &&
    (source.Type === 'function' || source.Type === 'stateMachine') &&
    resourceTypes[target.Type].DefaultPermissions.SAMCapable
  ) {
    defaultPermissions =
      resourceTypes[target.Type].DefaultPermissions.SAMCapable;
  } else {
    defaultPermissions =
      resourceTypes[target.Type].DefaultPermissions.IAMCapable;
  }

  for (const permission of defaultPermissions) {
    if ('PolicyName' in permission) {
      const options: any = {
        PermissionType: permissionTypes.SAM_POLICY,
        PolicyName: permission.PolicyName,
        TargetId: targetId,
      };

      if (target.Settings.UseExistingResource) {
        options.UseExistingResourceTarget = target;
      }

      this.addPermission(sourceId, options);
    } else if ('Actions' in permission) {
      const options: any = {
        PermissionType: permissionTypes.IAM_STATEMENT,
        Actions: permission.Actions,
      };

      if (target.Settings.UseExistingResource) {
        options.UseExistingResourceTarget = target;
      }

      if (permission.Resources) {
        let resources = cloneDeep(permission.Resources);
        resources = injectContext(resources, { resourceId: targetId });
        options.Resources = resources;
      } else {
        options.TargetId = targetId;
      }

      /* Serverless function permissions are a singular global set of
       * statements. Circular dependencies are possible when functions need
       * permissions to call other functions as both functions use the same
       * permissions. A circular dependency is also possible with S3 buckets
       * because functions receiving events must be created before the buckets
       * themselves. Other resource types don't have this issue. */
      if (
        this.format === 'serverless' &&
        source.Type === 'function' &&
        (target.Type === 'function' || target.Type === 'objectStore')
      ) {
        options.WithDependency = false;
      }

      this.addPermission(sourceId, options);
    } else {
      throw new Error(
        `Invalid permission type, missing PolicyName or Actions properties: ${permission}`,
      );
    }
  }
}
