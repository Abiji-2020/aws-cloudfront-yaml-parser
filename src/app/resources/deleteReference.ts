import cloneDeep from 'clone-deep';
import * as definitions from './definitions';
import Id from './id';
import { types as permissionTypes } from './permission';
import isComputeResource from '../utils/isComputeResource';

export default function deleteReference(
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

  // Virtual reference resources have references that persist due to a
  // permission, without a matching environment entry, and this permission must
  // be deleted.  Other environment variables from DefaultReferences are deleted
  // if present.
  let deletePolicy;
  let deleteEnvironmentVariables = [];
  const targetDefinition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[target.Type];
  if (targetDefinition.IsVirtualReferenceResource) {
    const references = this.references[sourceId];
    // Functions are SAMCapable but docker tasks are not; permissions related to the target
    // are cleared correspondingly.
    if (source.Type === 'function') {
      deletePolicy =
        targetDefinition.DefaultPermissions.SAMCapable[0].PolicyName;
    } else {
      deletePolicy =
        targetDefinition.DefaultPermissions.IAMCapable[0].Actions[0];
    }
    deleteEnvironmentVariables = targetDefinition.DefaultReferences;

    for (const [referenceName, reference] of Object.entries(references)) {
      if (
        (reference as any).IsVirtualReferenceResource &&
        (reference as any).ResourceId === targetId
      ) {
        delete references[referenceName];
      }
      if (Object.keys(this.references[sourceId]).length === 0) {
        delete this.references[sourceId];
      }
    }
  }

  let environment = cloneDeep(source.Settings.Environment);

  for (const variable in environment) {
    if (
      deleteEnvironmentVariables.some(
        (variableObj: any) => variable in variableObj,
      )
    ) {
      delete environment[variable];
      continue;
    }
    const value = environment[variable];
    if (
      (typeof value === 'object' || typeof value === 'string') &&
      value !== null
    ) {
      const resource = new Id(
        environment[variable],
        this.template,
        this.resources,
      );

      for (const targetResourceId of target.TemplatePartial.Resources) {
        if (resource.isLogicalId(targetResourceId)) {
          delete environment[variable];
        }
      }
    }
  }

  if (environment && Object.keys(environment).length === 0) {
    environment = null;
  }

  this.updateResourceSetting(sourceId, 'Environment', environment);

  if (this.format === 'SAM' || source.Type !== 'function') {
    deleteReferencePermissions.call(this, sourceId, targetId, deletePolicy);
  }
}

export function deleteReferencePermissions(
  this: any,
  sourceId: any,
  targetId: any,
  deletePolicy: any,
) {
  const target = this.resources[targetId];
  const targetDefinition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[target.Type];
  const currentPermissions = [...(this.permissions[sourceId] || [])];
  currentPermissions.forEach((permission) => {
    if (!('Target' in permission)) {
      return;
    }
    // Match only simple iam statements
    const iamStatementMatches =
      permission.PermissionType === permissionTypes.IAM_STATEMENT &&
      permission.Actions.length === 1 &&
      permission.Actions[0] === deletePolicy;
    const samStatementMatches =
      permission.PermissionType === permissionTypes.SAM_POLICY &&
      permission.PolicyName === deletePolicy;
    if (
      (iamStatementMatches || samStatementMatches) &&
      // Is the permission target the same as the reference target?
      (permission.Target.isLogicalId(targetId) ||
        // Or, is the reference target virtual and the target is non-local? (This is a heuristic that should be correct)
        (!permission.Target.isLocalResource() &&
          targetDefinition.IsVirtualReferenceResource))
    ) {
      this.deletePermission(sourceId, permission);
      return;
    }

    const resource = new Id(
      { Ref: permission.Target.ResourceId },
      this.template,
      this.resources,
    );
    if (resource.isLogicalId(targetId)) {
      this.deletePermission(sourceId, permission);
    }
  });
}
