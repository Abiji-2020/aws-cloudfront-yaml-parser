import cloneDeep from 'clone-deep';
import * as query from './query';

export default function updatePermission(
  this: any,
  resourceId: any,
  permissionIndex: any,
  options: any,
) {
  if (!(resourceId in this.permissions)) {
    throw new Error(
      `Failed to update permission for resource ${resourceId}: ${resourceId} does not have any permissions`,
    );
  }

  const origPermissions = cloneDeep(this.permissions[resourceId]);

  if (permissionIndex >= origPermissions.length) {
    throw new Error(
      `Failed to update permission for resource ${resourceId}: Permission index ${permissionIndex} is beyond the length of existing permissions`,
    );
  }

  let props;
  let origPolicies;
  let origManagedPolicies;
  if (this.resources[resourceId].Type === 'function') {
    props = this.template.Resources[resourceId].Properties;
    origPolicies = cloneDeep(props.Policies);
  } else {
    const iamRoleResourceId =
      this.resources[resourceId].Type === 'edgeFunction'
        ? query.value(
            "$.Properties.Role['Fn::GetAtt'][0]",
            this.template.Resources[resourceId],
            null,
            {},
          )
        : query.value(
            "$.Properties.TaskRoleArn['Fn::GetAtt'][0]",
            this.template.Resources[resourceId],
            null,
            {},
          );

    if (!iamRoleResourceId) {
      console.warn(
        `Failed to delete permission from resource ${resourceId}: Could not locate existing IAM role`,
      );
      return;
    }

    props = this.template.Resources[iamRoleResourceId].Properties;

    origPolicies = cloneDeep(props.Policies);
    origManagedPolicies = cloneDeep(props.ManagedPolicies);
  }

  try {
    this.deletePermission(resourceId, { PermissionIndex: permissionIndex });

    options.InsertBefore = permissionIndex;

    this.addPermission(resourceId, options);
  } catch (err) {
    this.permissions[resourceId] = origPermissions;
    props.Policies = origPolicies;

    if (origManagedPolicies) {
      props.ManagedPolicies = origManagedPolicies;
    }

    throw err;
  }
}
