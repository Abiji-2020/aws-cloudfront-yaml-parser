import deepEqual from 'deep-equal';
import * as query from './query';
import { types as permissionTypes } from './permission';

export default function deletePermission(
  this: any,
  resourceId: any,
  options: any,
) {
  if (!(resourceId in this.permissions)) {
    console.warn(
      `Failed to delete permission for resource ${resourceId}: ${resourceId} does not have any permissions`,
    );
    return;
  }

  const permissions = this.permissions[resourceId];

  let permissionIndex;
  if ('PermissionIndex' in options) {
    if (options.PermissionIndex >= permissions.length) {
      console.warn(
        `Failed to delete permission for resource ${resourceId}: Permission index ${options.PermissionIndex} is beyond the length of existing permissions`,
      );
      return;
    }

    permissionIndex = options.PermissionIndex;
  } else {
    permissionIndex = permissions.findIndex((permission: any) =>
      deepEqual(permission, options),
    );

    if (permissionIndex < 0) {
      console.warn(
        `Failed to delete permission for resource ${resourceId}: Permission ${JSON.stringify(options)} does not exist`,
      );
      return;
    }
  }

  const [deletedPermission] = permissions.splice(permissionIndex, 1);
  const cfResource = this.template.Resources[resourceId];
  const resource = this.resources[resourceId];

  if (permissions.length > 0) {
    if (
      cfResource.Type === 'AWS::Serverless::Function' ||
      cfResource.Type === 'AWS::Serverless::StateMachine'
    ) {
      cfResource.Properties.Policies.splice(permissionIndex, 1);
      resource.Settings.Permissions = cfResource.Properties.Policies;
    } else {
      const iamRoleResourceId =
        resource.Type === 'edgeFunction'
          ? query.value(
              "$.Properties.Role['Fn::GetAtt'][0]",
              cfResource,
              null,
              {},
            )
          : query.value(
              "$.Properties.TaskRoleArn['Fn::GetAtt'][0]",
              cfResource,
              null,
              {},
            );

      if (!iamRoleResourceId) {
        console.warn(
          `Failed to delete permission from resource ${resourceId}: Could not locate existing IAM role`,
        );
        return;
      }

      const iamRoleProps =
        this.template.Resources[iamRoleResourceId].Properties;

      if (deletedPermission.PermissionType === permissionTypes.IAM_POLICY) {
        iamRoleProps.ManagedPolicies = iamRoleProps.ManagedPolicies.filter(
          (policyName: any) => policyName !== deletedPermission.PolicyName,
        );
        if (iamRoleProps.ManagedPolicies.length === 0) {
          delete iamRoleProps.ManagedPolicies;
        }
      } else {
        for (const policy of iamRoleProps.Policies) {
          policy.PolicyDocument.Statement =
            policy.PolicyDocument.Statement.filter(
              (statement: any) =>
                !deepEqual(statement, deletedPermission.Statement),
            );
        }

        iamRoleProps.Policies = iamRoleProps.Policies.filter(
          (policy: any) => policy.PolicyDocument.Statement.length > 0,
        );

        if (iamRoleProps.Policies.length === 0) {
          delete iamRoleProps.Policies;
        }
      }

      resource.Settings.Permissions = iamRoleProps.Policies;
    }
  } else {
    if (cfResource.Type === 'AWS::Serverless::Function') {
      delete this.template.Resources[resourceId].Properties.Policies;
      resource.Settings.Permissions = null;
    } else {
      const iamRoleResourceId =
        resource.Type === 'edgeFunction'
          ? query.value(
              "$.Properties.Role['Fn::GetAtt'][0]",
              cfResource,
              null,
              {},
            )
          : query.value(
              "$.Properties.TaskRoleArn['Fn::GetAtt'][0]",
              cfResource,
              null,
              {},
            );

      if (!iamRoleResourceId) {
        console.warn(
          `Failed to delete permission from resource ${resourceId}: Could not locate existing IAM role`,
        );
        return;
      }

      const iamRoleProps =
        this.template.Resources[iamRoleResourceId].Properties;

      delete iamRoleProps.ManagedPolicies;
      delete iamRoleProps.Policies;

      resource.Settings.Permissions = null;
    }

    delete this.permissions[resourceId];
  }
}
