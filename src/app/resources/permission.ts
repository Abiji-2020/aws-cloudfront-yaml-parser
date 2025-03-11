import cloneDeep from 'clone-deep';
import Id from './id';
import * as definitions from './definitions';

export const types = {
  IAM_POLICY: 'iamPolicy',
  SAM_POLICY: 'samPolicy',
  IAM_STATEMENT: 'iamStatement',
};

export default class Permission {
  PermissionType?: any;
  PolicyName?: any;
  Target?: any;
  Statement?: any;
  Effect?: any;
  Actions?: any;
  constructor(statement: any, template: any, resources: any) {
    if (typeof statement === 'string') {
      this.PermissionType = types.IAM_POLICY;
      this.PolicyName = statement;
    } else if (
      statement.Statement &&
      statement.Statement[0] &&
      'Effect' in statement.Statement[0]
    ) {
      this._parseIamStatement(statement.Statement[0], template, resources);
    } else if ('Effect' in statement) {
      this._parseIamStatement(statement, template, resources);
    } else {
      this._parseSamPolicy(statement, template, resources);
    }
  }

  _parseSamPolicy(statement: any, template: any, resources: any) {
    this.PermissionType = types.SAM_POLICY;
    this.PolicyName = Object.keys(statement)[0];

    if (this.PolicyName in samPolicyMappings) {
      const parameters = statement[this.PolicyName];
      const firstParameter = Object.keys(parameters)[0];
      const firstParameterValue = parameters[firstParameter];

      const targetId = new Id(firstParameterValue, template, resources);

      if (targetId.isLocalResource()) {
        for (const [resourceId, resource] of Object.entries(resources)) {
          for (const targetResourceId of (resource as any).TemplatePartial
            .Resources) {
            if (targetId.isLogicalId(targetResourceId)) {
              this.Target = new Id({ Ref: resourceId }, template, resources);
              return;
            }
          }
        }
      }

      this.Target = targetId;
    }
  }

  _parseIamStatement(statement: any, template: any, resources: any) {
    this.PermissionType = types.IAM_STATEMENT;
    this.Statement = statement;
    this.Effect = statement.Effect;
    this.Actions = cloneDeep(statement.Action);

    if (typeof this.Actions === 'string') {
      this.Actions = [this.Actions];
    }

    const firstResource = Array.isArray(statement.Resource)
      ? statement.Resource[0]
      : statement.Resource;

    const targetId = new Id(firstResource, template, resources);

    if (targetId.isLocalResource()) {
      for (const [resourceId, resource] of Object.entries(resources)) {
        for (const targetResourceId of (resource as any).TemplatePartial
          .Resources) {
          if (targetId.isLogicalId(targetResourceId)) {
            this.Target = new Id({ Ref: resourceId }, template, resources);
            return;
          }
        }
      }
    }

    this.Target = targetId;
  }
}

const samPolicyMappings = Object.keys(definitions.SAM.PermissionTypes).reduce(
  (mappings, resourceType) => {
    const permissionDefinitions = definitions.SAM.PermissionTypes[resourceType];

    if (!('SAM' in permissionDefinitions)) {
      return mappings;
    }

    for (const policy in permissionDefinitions.SAM) {
      (mappings as any)[policy] = resourceType;
    }

    return mappings;
  },
  {},
);

export const parsePermissionsFromFunctionOrStateMachine = (
  resource: any,
  template: any,
  resources: any,
) => {
  let statements;
  if ('Properties' in resource && 'Policies' in resource.Properties) {
    statements = resource.Properties.Policies;
  } else if ('iamRoleStatements' in resource) {
    statements = resource.iamRoleStatements;
  } else {
    return;
  }

  if (statements === undefined || statements === null) {
    return;
  }

  // If this is a full policy document, get list of statements within
  if (typeof statements === 'string') {
    statements = [statements];
  } else if (!Array.isArray(statements)) {
    statements = statements.Statement;
  }

  const permissions = [];

  for (const statement of statements) {
    permissions.push(new Permission(statement, template, resources));
  }

  return permissions;
};
