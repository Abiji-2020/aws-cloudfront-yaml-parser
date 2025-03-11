import cloneDeep from 'clone-deep';
import deepEqual from 'deep-equal';
import * as definitions from './definitions';
import {
  injectContext,
  updateExistingResourceConditions,
} from './manageCFResources';
import Permission, { types as permissionTypes } from './permission';
import * as query from './query';
import isComputeResource from '../utils/isComputeResource';

export default function addPermission(
  this: any,
  resourceId: any,
  options: any,
) {
  if (!(resourceId in this.resources)) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: ${resourceId} does not exist in state`,
    );
  }

  const resource = this.resources[resourceId];

  if (!isComputeResource(resource.Type)) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: ${resource.Type} resource types do not support permissions`,
    );
  }

  let statement;

  switch (options.PermissionType) {
    case permissionTypes.SAM_POLICY:
      if (resource.Type !== 'function' && resource.Type !== 'stateMachine') {
        throw new Error(
          `Failed to add permission to resource ${resourceId}: ${resource.Type} resource types do not support SAM policies`,
        );
      }

      if ('Parameters' in options) {
        statement = { [options.PolicyName]: cloneDeep(options.Parameters) };
      } else {
        statement = addSAMPermission(this, resourceId, options);
      }
      break;

    case permissionTypes.IAM_STATEMENT:
      if ('TargetId' in options) {
        statement = addTargetIAMStatementsPermission(this, resourceId, options);
      } else {
        statement = {
          Effect: 'Allow',
          Action: options.Actions,
          Resource: options.Resources,
        };

        if (options.UseExistingResourceTarget) {
          updateExistingResourceConditions(
            statement.Resource,
            options.UseExistingResourceTarget,
            true,
          );
        }
      }
      break;

    case permissionTypes.IAM_POLICY:
      statement = options.PolicyName;
      break;

    default:
      throw new Error(
        `Failed to add permission to resource ${resourceId}: Unsupported permission type ${options.PermissionType}`,
      );
  }

  let templateStatement = statement;
  if (
    this.format === 'SAM' &&
    (resource.Type === 'function' || resource.Type === 'stateMachine')
  ) {
    // functions require nested Statements
    if (
      options.PermissionType === permissionTypes.IAM_STATEMENT &&
      typeof statement !== 'string'
    ) {
      templateStatement = {
        Statement: [statement],
      };
    }

    const cfResource = this.template.Resources[resourceId];

    if (!('Properties' in cfResource)) {
      cfResource.Properties = {};
    }

    if (!('Policies' in cfResource.Properties)) {
      cfResource.Properties.Policies = [];
    }

    if (!Array.isArray(cfResource.Properties.Policies)) {
      if (typeof cfResource.Properties.Policies === 'object') {
        throw new Error(
          `Failed to add permission to resource ${resourceId}: Existing Policies IAM document format is not supported and must be converted to an array of statements first`,
        );
      }

      cfResource.Properties.Policies = [cfResource.Properties.Policies];
    }

    const policies = cfResource.Properties.Policies;

    if ('InsertBefore' in options) {
      policies.splice(options.InsertBefore, 0, templateStatement);
    } else {
      policies.push(templateStatement);
    }

    resource.Settings.Permissions = policies;
  } else if (this.format === 'serverless' && resource.Type === 'function') {
    if (resource.Settings.ServerlessPerRolePermissions) {
      if (options.PermissionType === permissionTypes.IAM_STATEMENT) {
        const statements =
          this.template.functions[resource.ServerlessFunctionName]
            .iamRoleStatements || [];

        if (
          statements.every(
            (existingStatement: any) =>
              !deepEqual(statement, existingStatement),
          )
        ) {
          if ('InsertBefore' in options) {
            statements.splice(options.InsertBefore, 0, statement);
          } else {
            statements.push(statement);
          }

          this.template.functions[
            resource.ServerlessFunctionName
          ].iamRoleStatements = statements;

          resource.Settings.Permissions = statements;
        }
      } else {
        // TODO: Handle IAM managed policies somehow?
      }
    } else {
      if (options.PermissionType === permissionTypes.IAM_STATEMENT) {
        const statements =
          query.value(
            '$.provider.iamRoleStatements',
            this.template,
            null,
            {},
          ) || [];

        if (
          statements.every(
            (existingStatement: any) =>
              !deepEqual(statement, existingStatement),
          )
        ) {
          statements.push(statement);

          query.update(
            '$.provider.iamRoleStatements',
            this.template,
            null,
            statements,
          );
        }
      } else {
        const policies =
          query.value(
            '$.provider.iamManagedPolicies',
            this.template,
            null,
            {},
          ) || [];

        if (!policies.includes(statement)) {
          policies.push(statement);

          query.update(
            '$.provider.iamManagedPolicies',
            this.template,
            null,
            policies,
          );
        }
      }
    }
  } else {
    const cfResource = this.cfTemplate().Resources[resourceId];
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
        `Failed to add permission to resource ${resourceId}: Could not locate existing IAM role`,
      );
      return;
    }

    const iamRoleProps =
      this.cfTemplate().Resources[iamRoleResourceId].Properties;

    if (typeof statement === 'string') {
      iamRoleProps.ManagedPolicies = [
        ...(iamRoleProps.ManagedPolicies || []),
        statement,
      ];
    } else {
      let policyName = options.TargetId
        ? `Access${options.TargetId}`
        : 'ResourcePolicy';

      // Add an incrementing suffix to the policy name, if necessary, to ensure uniqueness.
      let suffix = 0;
      const addSuffix = (str: string) => (suffix ? `${str}${suffix + 1}` : str);
      const comparePolicyName = (e: any) =>
        e.PolicyName === addSuffix(policyName);
      while ((iamRoleProps.Policies || []).find(comparePolicyName)) {
        ++suffix;
      }
      policyName = addSuffix(policyName);

      iamRoleProps.Policies = [
        ...(iamRoleProps.Policies || []),
        {
          PolicyName: policyName,
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [statement],
          },
        },
      ];
    }

    resource.Settings.Permissions = iamRoleProps.Policies;
  }

  if (!(resourceId in this.permissions)) {
    this.permissions[resourceId] = [];
  }

  const permission = new Permission(
    templateStatement,
    this.template,
    this.resources,
  );

  if ('InsertBefore' in options) {
    this.permissions[resourceId].splice(options.InsertBefore, 0, permission);
  } else {
    this.permissions[resourceId].push(permission);
  }
}

const addSAMPermission = (
  state: any,
  resourceId: any,
  { PolicyName, TargetId, WithDependency, UseExistingResourceTarget }: any,
) => {
  if (WithDependency === undefined) {
    WithDependency = true;
  }

  if (!(TargetId in state.resources)) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} does not exist in state`,
    );
  }

  const target = state.resources[TargetId];

  if (!(target.Type in definitions.SAM.PermissionTypes)) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} does not support permissions`,
    );
  }

  if (!('SAM' in definitions.SAM.PermissionTypes[target.Type])) {
    throw new Error(
      `Failed to add permissons to resource ${resourceId}: Target resource ${TargetId} does not support SAM policies`,
    );
  }

  const targetSAMPolicies = definitions.SAM.PermissionTypes[target.Type].SAM;

  if (!(PolicyName in targetSAMPolicies)) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} does not support SAM policy ${PolicyName}`,
    );
  }

  const policyParametersTemplate = cloneDeep(targetSAMPolicies[PolicyName]);
  const policyParameters = {};

  const context: any = {
    resourceId: TargetId,
  };

  if (!WithDependency) {
    if (!('PhysicalName' in state.resources[TargetId])) {
      throw new Error(
        `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} cannot be addded without a dependency because it lacks a physical resource name`,
      );
    }

    context.physicalName = state.resources[TargetId].PhysicalName;
  }

  for (const parameter in policyParametersTemplate) {
    if (WithDependency) {
      (policyParameters as any)[parameter] = injectContext(
        policyParametersTemplate[parameter].WithDependency,
        context,
      );
    } else {
      if (!('WithoutDependency' in policyParametersTemplate[parameter])) {
        throw new Error(
          `Failed to add permission to resource ${resourceId}: SAM policy ${PolicyName} cannot be added without a dependency`,
        );
      }

      (policyParameters as any)[parameter] = injectContext(
        policyParametersTemplate[parameter].WithoutDependency,
        context,
      );
    }
  }

  if (UseExistingResourceTarget) {
    updateExistingResourceConditions(
      policyParameters,
      UseExistingResourceTarget,
      true,
    );
  }

  return { [PolicyName]: policyParameters };
};

const addTargetIAMStatementsPermission = (
  state: any,
  resourceId: any,
  { Actions, TargetId, WithDependency, UseExistingResourceTarget }: any,
) => {
  if (WithDependency === undefined) {
    WithDependency = true;
  }

  if (!(TargetId in state.resources)) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} does not exist in state`,
    );
  }

  const target = state.resources[TargetId];

  if (
    !(
      target.Type in
      definitions[state.format as 'SAM' | 'serverless'].PermissionTypes
    )
  ) {
    throw new Error(
      `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} does not support permissions`,
    );
  }

  if (
    !(
      'Custom' in
      definitions[state.format as 'SAM' | 'serverless'].PermissionTypes[
        target.Type
      ]
    )
  ) {
    throw new Error(
      `Failed to add permissons to resource ${resourceId}: Target resource ${TargetId} does not support custom IAM statements`,
    );
  }

  const targetIAMStatements = cloneDeep(
    definitions[state.format as 'SAM' | 'serverless'].PermissionTypes[
      target.Type
    ].Custom,
  );

  const context: any = {
    resourceId: TargetId,
  };

  if (!WithDependency) {
    if (!('PhysicalName' in state.resources[TargetId])) {
      throw new Error(
        `Failed to add permission to resource ${resourceId}: Target resource ${TargetId} cannot be addded without a dependency because it lacks a physical resource name`,
      );
    }

    context.physicalName = state.resources[TargetId].PhysicalName;
  }

  let resources = WithDependency
    ? targetIAMStatements.Resources.WithDependency
    : targetIAMStatements.Resources.WithoutDependency;

  resources = injectContext(resources, context);

  if (UseExistingResourceTarget) {
    updateExistingResourceConditions(
      resources,
      UseExistingResourceTarget,
      true,
    );
  }

  return {
    Effect: 'Allow',
    Action: Actions,
    Resource: resources,
  };
};
