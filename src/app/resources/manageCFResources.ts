import * as query from './query';
import transformations from './transformations';
import deepEqual from 'deep-equal';
import Parameter from './parameter';

export const ERROR_CODES = {
  UNDEFINED_CONTEXT_KEY: 'undefinedContextKey',
};
const SUB_VARS_RE = /[$#]\{(?!AWS::)[^.}]+\}/g;

export const intrinsicFunctionType = (value: any) => {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 1) {
    return null;
  }
  const [key] = Object.keys(value);
  if (key === 'Ref' || key.startsWith('Fn::')) {
    return key;
  }
  return null;
};

export const injectContext = (template: any, context: any) => {
  if (typeof template === 'string') {
    return contextReplace(template, context);
  }
};

const NATIVE_VALUE_CONTEXT_RE = /^%\{([^}]+)\}$/;
const CONTEXT_RE = /%\{([^}]+)\}/g;

const contextReplace = (string: string, context: any) => {
  const nativeMatch = string.match(NATIVE_VALUE_CONTEXT_RE);
  if (nativeMatch) {
    return transform(nativeMatch[1], context);
  } else {
    return string.replace(CONTEXT_RE, (_, spec) => transform(spec, context));
  }
};

const transform = (spec: string, context: any) => {
  const contextTransformations = spec.split('|');
  const key = contextTransformations.shift() as string;

  let queryPath = '$';

  for (const part of key.split('.')) {
    if (part.includes(':')) {
      queryPath += `["${part}"]`;
    } else {
      queryPath += `.${part}`;
    }
  }
  let value = query.value(queryPath, context, undefined, {});
  for (const transformation of contextTransformations) {
    let [_, transformationName, args] = (transformation.match(
      /^([^(]+)(?:\((.*)\))?$/,
    ) || []) as [string, string, any];
    args = args ? args.split(',').map((arg: any) => arg.trim()) : [];

    value = transformations[transformationName as keyof typeof transformations](
      value,
      context,
      args,
    );
    return value;
  }
};

export const DEFAULT_PARAMETERS = {
  StackTagName: {
    Type: 'String',
    Description: 'Stack Name (injected by AWS at deployment time)',
  },
  EnvironmentTagName: {
    Type: 'String',
    Description: 'Environment Name (injected by AWS at deployment time)',
  },
  EnvironmentAPIGatewayStageName: {
    Type: 'String',
    Description:
      'Environment name used for API Gateway Stage names (injected by AWS at deployment time)',
  },
  DeploymentNamespace: {
    Type: 'String',
    Description: 'Deployment Namespace (injected by AWS at deployment time)',
  },
  DeploymentTimestamp: {
    Type: 'Number',
    Description:
      'Deployment preparation timestamp in milliseconds Since Epoch (injected by AWS at deployment time)',
  },
  DefaultVPCId: {
    Type: 'AWS::EC2::VPC::Id',
    Description:
      'AWS account-specific default VPC ID (injected by AWS at deployment time)',
  },
  DefaultVPCSubnets: {
    Type: 'List<AWS::EC2::Subnet::Id>',
    Description:
      'AWS account-specific default VPC subnets (injected by AWS at deployment time)',
  },
  AmazonLinux2ImageId: {
    Type: 'AWS::EC2::Image::Id',
    Description:
      'Latest Amazon Linux 2 AMI ID (injected by AWS at deployment time)',
  },
  SourceLocation: {
    Type: 'String',
    Description:
      'Location of source code for deployment (injected by AWS at deployment time)',
  },
  SourceVersion: {
    Type: 'String',
    Description:
      'Source version for deployment (injected by AWS at deployment time)',
  },
};
(DEFAULT_PARAMETERS as any)['CfnStackTagName'] =
  DEFAULT_PARAMETERS.StackTagName;
(DEFAULT_PARAMETERS as any).CfnEnvironmentTagName =
  DEFAULT_PARAMETERS.EnvironmentTagName;
(DEFAULT_PARAMETERS as any).CfnEnvironmentAPIGatewayStageName =
  DEFAULT_PARAMETERS.EnvironmentAPIGatewayStageName;
(DEFAULT_PARAMETERS as any).CfnDeploymentNamespace =
  DEFAULT_PARAMETERS.DeploymentNamespace;
(DEFAULT_PARAMETERS as any).CfnDeploymentTimestamp =
  DEFAULT_PARAMETERS.DeploymentTimestamp;

export const findOwnerResourceId = (resourceId: any, resources: any): any => {
  for (const otherResourceId in resources) {
    const otherResource = resources[otherResourceId];

    if (otherResource.TemplatePartial.Resources.includes(resourceId)) {
      return otherResourceId;
    }
  }
};

export const updateDefaultParameters = (template: any) => {
  const referencedDefaultParameters = new Set();
  const defaultParameterIds = Object.keys(DEFAULT_PARAMETERS);

  /* If this is a serverless template, look under the functions key, then
   * manipulate template.resources as that's where custom CF logic lives. */
  if ('service' in template) {
    findReferencedParameters(
      template.functions,
      defaultParameterIds,
      referencedDefaultParameters,
    );

    template.resources = template.resources || {};
    template = template.resources;
  }

  findReferencedParameters(
    template.Conditions,
    defaultParameterIds,
    referencedDefaultParameters,
  );
  findReferencedParameters(
    template.Resources,
    defaultParameterIds,
    referencedDefaultParameters,
  );

  for (const parameter in DEFAULT_PARAMETERS) {
    if (referencedDefaultParameters.has(parameter)) {
      template.Parameters = template.Parameters || {};
      template.Parameters[parameter] = (DEFAULT_PARAMETERS as any)[parameter];
    } else if ('Parameters' in template) {
      delete template.Parameters[parameter];
    }
  }

  if (
    'Parameters' in template &&
    Object.keys(template.Parameters).length === 0
  ) {
    delete template.Parameters;
  }
};

const findReferencedParameters = (
  object: any,
  parameterList: any,
  referencedParameters: any,
) => {
  if (object && typeof object === 'object') {
    if (Object.keys(object).length === 1 && 'Ref' in object) {
      const ref = object.Ref;

      if (parameterList.includes(ref)) {
        referencedParameters.add(ref);
      }
    } else if (Object.keys(object).length === 1 && 'Fn::Sub' in object) {
      let sub = object['Fn::Sub'];
      let providedVars: any = [];

      if (Array.isArray(sub)) {
        for (const varName in sub[1]) {
          findReferencedParameters(
            sub[1][varName],
            parameterList,
            referencedParameters,
          );
        }

        providedVars = Object.keys(sub[1]);
        sub = sub[0];
      }

      /* Find all substitution variables, filter out those provided in Fn::Sub
       * already, and add the rest to the set */
      (sub.match(SUB_VARS_RE) || [])
        .map((subVar: any) => subVar.replace(/^[$#]\{/, '').replace(/\}$/, ''))
        .filter(
          (subVar: any) =>
            !providedVars.includes(subVar) && parameterList.includes(subVar),
        )
        .forEach((subVar: any) => referencedParameters.add(subVar));
    } else {
      for (const key in object) {
        findReferencedParameters(
          object[key],
          parameterList,
          referencedParameters,
        );
      }
    }
  }
};

export const cleanupTemplate = (state: any) => {
  const cfTemplate = state.cfTemplate();

  /* We need to add serverless-cf-vars plugin to make Fn::Subs work due to
   * conflicts between serverless and Fn::Sub variable syntax. */
  if (state.format === 'serverless') {
    if (hasFnSubs(state.template)) {
      if (Array.isArray(state.template.plugins)) {
        if (!state.template.plugins.includes('serverless-cf-vars')) {
          state.template.plugins.push('serverless-cf-vars');
        }
      } else {
        state.template.plugins = ['serverless-cf-vars'];
      }
    }
  }

  const parameterIds = Object.keys(cfTemplate.Parameters || {});
  const foundParameters = new Set();

  if (parameterIds.length > 0) {
    findReferencedParameters(
      cfTemplate.Conditions,
      parameterIds,
      foundParameters,
    );
    findReferencedParameters(
      cfTemplate.Resources,
      parameterIds,
      foundParameters,
    );
    findReferencedParameters(cfTemplate.Globals, parameterIds, foundParameters);

    if (state.format === 'serverless') {
      findReferencedParameters(
        state.template.functions,
        parameterIds,
        foundParameters,
      );
    }
  }

  for (const parameterId of parameterIds) {
    if (!foundParameters.has(parameterId)) {
      delete cfTemplate.Parameters[parameterId];
      delete state.parameters[parameterId];

      if ('Metadata' in cfTemplate) {
        if ('cfnEnvConfigParameters' in cfTemplate.Metadata) {
          delete cfTemplate.Metadata.cfnEnvConfigParameters[parameterId];
        }
        if ('EnvConfigParameters' in cfTemplate.Metadata) {
          delete cfTemplate.Metadata.EnvConfigParameters[parameterId];
        }
      }
    } else if (state.format === 'serverless') {
      // Add default values for some parameters that serverless doesn't set values for.
      switch (parameterId) {
        case 'StackTagName':
          cfTemplate.Parameters.StackTagName.Default = state.template.service;
          break;
        case 'cfnStackTagName':
          cfTemplate.Parameters.cfnStackTagName.Default =
            state.template.service;
          break;
        case 'EnvironmentTagName':
          cfTemplate.Parameters.EnvironmentTagName.Default = 'dev';
          break;
        case 'cfnEnvironmentTagName':
          cfTemplate.Parameters.cfnEnvironmentTagName.Default = 'dev';
          break;
        default:
          break;
      }
    }
  }

  for (const resource of Object.values(cfTemplate.Resources || {})) {
    if (
      'Metadata' in (resource as any) &&
      Object.keys((resource as any).Metadata).length === 0
    ) {
      delete (resource as any).Metadata;
    }
  }

  if (
    'Metadata' in cfTemplate &&
    'cfnEnvConfigParameters' in cfTemplate.Metadata &&
    Object.keys(cfTemplate.Metadata.cfnEnvConfigParameters).length === 0
  ) {
    delete cfTemplate.Metadata.cfnEnvConfigParameters;
  }
  if (
    'Metadata' in cfTemplate &&
    'EnvConfigParameters' in cfTemplate.Metadata &&
    Object.keys(cfTemplate.Metadata.EnvConfigParameters).length === 0
  ) {
    delete cfTemplate.Metadata.EnvConfigParameters;
  }

  if (
    'Metadata' in cfTemplate &&
    'cfnErrorsTargets' in cfTemplate.Metadata &&
    Object.keys(cfTemplate.Metadata.cfnErrorsTargets).length === 0
  ) {
    delete cfTemplate.Metadata.cfnErrorsTargets;
  }

  if (
    'Metadata' in cfTemplate &&
    Object.keys(cfTemplate.Metadata).length === 0
  ) {
    delete cfTemplate.Metadata;
  }

  if (
    'Parameters' in cfTemplate &&
    Object.keys(cfTemplate.Parameters).length === 0
  ) {
    delete cfTemplate.Parameters;
  }

  if (
    'Conditions' in cfTemplate &&
    Object.keys(cfTemplate.Conditions).length === 0
  ) {
    delete cfTemplate.Conditions;
  }

  if (
    'Resources' in cfTemplate &&
    Object.keys(cfTemplate.Resources).length === 0
  ) {
    delete cfTemplate.Resources;
  }

  if (state.format === 'serverless') {
    if (
      state.template.functions &&
      Object.keys(state.template.functions).length === 0
    ) {
      delete state.template.functions;
    }

    if (
      state.template.resources &&
      Object.keys(state.template.resources).length === 0
    ) {
      delete state.template.resources;
    }
  }

  if (state.format === 'SAM') {
    // For each function resource, note whether it has an AutoPublishAlias.  Update references
    // to ensure they refer to the right thing.
    const functionAliases = {};
    for (const [resourceId, resource] of Object.entries(
      cfTemplate.Resources || {},
    )) {
      if ((resource as any).Type === 'AWS::Serverless::Function') {
        const alias =
          (resource as any).Properties &&
          (resource as any).Properties.AutoPublishAlias;
        (functionAliases as any)[resourceId] = alias || null;
      }
    }

    for (const [functionId, alias] of Object.entries(functionAliases)) {
      updateFunctionReferences(state.template, functionId, alias);
    }
  }
};

const hasFnSubs = (object: any) => {
  if (object && typeof object === 'object') {
    if (Object.keys(object).length === 1 && 'Fn::Sub' in object) {
      return true;
    } else {
      for (const key in object) {
        if (hasFnSubs(object[key])) {
          return true;
        }
      }
    }
  }

  return false;
};

const updateFunctionReferences = (object: any, resourceId: any, alias: any) => {
  if (!object || typeof object !== 'object') {
    return;
  }
  // This part handles API Gateway endpoint references as well as websocket integrations:
  if (Object.keys(object).length === 1 && 'Fn::Sub' in object) {
    const sub = object['Fn::Sub'];
    if (typeof sub !== 'string') {
      return;
    }
    if (alias) {
      const withAlias = '${' + resourceId + 'Alias' + alias + '}';
      const withoutAlias = new RegExp('\\${' + resourceId + '\\.Arn}', 'g');
      object['Fn::Sub'] = sub.replace(withoutAlias, withAlias);
    } else {
      // Sub for any function alias, whatever it may have been.
      const withAlias = new RegExp('\\${' + resourceId + 'Alias[^}]+}', 'g');
      const withoutAlias = '${' + resourceId + '.Arn}';
      object['Fn::Sub'] = sub.replace(withAlias, withoutAlias);
    }
    return;
  }

  for (const [key, value] of Object.entries(object)) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    // Update things like "!GetAtt Function.Arn"
    if (alias && Object.keys(value).length === 1 && 'Fn::GetAtt' in value) {
      const attrs = value['Fn::GetAtt'];
      if (
        !attrs ||
        !Array.isArray(attrs) ||
        attrs.length < 2 ||
        attrs[1] !== 'Arn'
      ) {
        continue;
      }

      const target = attrs[0];
      if (target === resourceId) {
        object[key] = { Ref: `${resourceId}Alias${alias}` };
      }
      continue;
    }
    if (
      !alias &&
      'Ref' in value &&
      value.Ref === `${resourceId}Alias${alias}`
    ) {
      object[key] = { 'Fn::GetAtt': [resourceId, 'Arn'] };
      continue;
    }
    updateFunctionReferences(object[key], resourceId, alias);
  }
};

export const updateExistingSubnetIdReferences = (
  template: any,
  virtualNetworkId: any,
  existingVPCSubnetsSpec: any = null,
) => {
  if (!template || typeof template !== 'object') {
    return;
  }

  if (!existingVPCSubnetsSpec) {
    existingVPCSubnetsSpec = {
      'Fn::Join': [
        ',',
        [
          {
            'Fn::If': [
              `${virtualNetworkId}UseExistingResource`,
              {
                'Fn::GetAtt': [
                  `${virtualNetworkId}ExistingResource`,
                  'PrivateSubnet1',
                ],
              },
              { Ref: `${virtualNetworkId}PrivateSubnet1` },
            ],
          },
          {
            'Fn::If': [
              `${virtualNetworkId}UseExistingResource`,
              {
                'Fn::GetAtt': [
                  `${virtualNetworkId}ExistingResource`,
                  'PrivateSubnet2',
                ],
              },
              { Ref: `${virtualNetworkId}PrivateSubnet2` },
            ],
          },
        ],
      ],
    };
  }

  for (const [key, value] of Object.entries(template)) {
    if (typeof value !== 'object') {
      continue;
    }

    if (deepEqual(value, defaultVPCSubnetsSpec)) {
      template[key] = existingVPCSubnetsSpec;
    } else {
      updateExistingSubnetIdReferences(
        template[key],
        virtualNetworkId,
        existingVPCSubnetsSpec,
      );
    }
  }
};

const defaultVPCSubnetsSpec = {
  'Fn::Join': [',', { Ref: 'DefaultVPCSubnets' }],
};

export const updateExistingResourceConditions = (
  template: any,
  resource: any,
  useExistingResource: any,
) => {
  const type = intrinsicFunctionType(template);

  let logicalId;
  if (useExistingResource) {
    if (type === 'Ref') {
      logicalId = template.Ref;
    } else if (type === 'Fn::GetAtt') {
      logicalId = template['Fn::GetAtt'][0];
    } else if (
      type === 'Fn::Sub' &&
      template['Fn::Sub'].includes(`\${${resource.Id}`)
    ) {
      const existingResourceRegex = new RegExp(
        `(?!\\$\\{${resource.Id}[^}.]*Existing)\\$\\{(${resource.Id}[^}.]*)`,
        'g',
      );

      return {
        'Fn::If': [
          `${resource.Id}UseExistingResource`,
          {
            'Fn::Sub': template['Fn::Sub'].replace(
              existingResourceRegex,
              '${$1ExistingResource',
            ),
          },
          {
            'Fn::Sub': template['Fn::Sub'].replace(/ExistingResource\}/g, '}'),
          },
        ],
      };
    } else if (
      type === 'Fn::If' &&
      template[type][0] === `${resource.Id}UseExistingResource`
    ) {
      // This reference is already converted to a conditional reference
      return template;
    }
  } else {
    if (
      type === 'Fn::If' &&
      template[type][0] === `${resource.Id}UseExistingResource`
    ) {
      logicalId = resource.Id;
    }
  }

  if (!logicalId) {
    if (template && typeof template === 'object') {
      for (const key in template) {
        template[key] = updateExistingResourceConditions(
          template[key],
          resource,
          useExistingResource,
        );
      }
    }

    return template;
  }

  if (!resource.TemplatePartial.Resources.includes(logicalId)) {
    return template;
  }

  if (useExistingResource) {
    if (type === 'Ref') {
      const customRef =
        logicalId === resource.Id
          ? { Ref: `${resource.Id}ExistingResource` }
          : {
              'Fn::GetAtt': [
                `${resource.Id}ExistingResource`,
                `${logicalId.replace(resource.Id, '')}`,
              ],
            };

      return {
        'Fn::If': [`${resource.Id}UseExistingResource`, customRef, template],
      };
    } else {
      const attributePrefix =
        logicalId === resource.Id
          ? ''
          : `${logicalId.replace(resource.Id, '')}.`;

      return {
        'Fn::If': [
          `${resource.Id}UseExistingResource`,
          {
            'Fn::GetAtt': [
              `${resource.Id}ExistingResource`,
              `${attributePrefix}${template['Fn::GetAtt'][1]}`,
            ],
          },
          template,
        ],
      };
    }
  } else {
    return template['Fn::If'][2];
  }
};

export const updateOwnership = (
  state: any,
  resource: any,
  dispatchResults: any,
) => {
  const conditions = state.cfTemplate().Conditions || {};
  const resources = state.cfTemplate().Resources || {};

  for (const type of ['Conditions', 'Resources']) {
    const section = state.cfTemplate()[type] || {};
    const newIds = Object.keys(section).filter((id) => {
      for (const resourceId in state.resources) {
        const resource = state.resources[resourceId];

        if (resource.TemplatePartial[type].includes(id)) {
          return false;
        }

        if (resource.Facets) {
          for (const facetType in resource.Facets) {
            for (const facet of resource.Facets[facetType]) {
              if (facet.TemplatePartial[type].includes(id)) {
                return false;
              }
            }
          }
        }
      }

      for (const integration of state.integrations) {
        if (integration.TemplatePartial[type].includes(id)) {
          return false;
        }
      }

      return true;
    });

    Array.prototype.push.apply(resource.TemplatePartial[type], newIds);

    /* Remove all deleted resources and conditions from existing resource
     * template partials */
    for (const resourceId in state.resources) {
      state.resources[resourceId].TemplatePartial[type] = state.resources[
        resourceId
      ].TemplatePartial[type].filter(
        (id: any) =>
          id in conditions ||
          id in resources ||
          (state.format === 'serverless' &&
            state.resources[resourceId].Type === 'function' &&
            id === resourceId),
      );
    }

    /* Remove all deleted resources and conditions from existing integration
     * template partials */
    for (const integration of state.integrations) {
      integration.TemplatePartial[type] = integration.TemplatePartial[
        type
      ].filter((id: any) => id in conditions || id in resources);
    }
  }

  // Mark ownership of shared resources we may not have re-generated
  for (const dispatchResult of dispatchResults || []) {
    if (dispatchResult.type === 'Upsert' && dispatchResult.path) {
      if (dispatchResult.path.length === 3) {
        if (
          dispatchResult.path[1] === 'Resources' &&
          !resource.TemplatePartial.Resources.includes(dispatchResult.path[2])
        ) {
          resource.TemplatePartial.Resources.push(dispatchResult.path[2]);
        } else if (
          dispatchResult.path[1] === 'Conditions' &&
          !resource.TemplatePartial.Conditions.includes(dispatchResult.path[2])
        ) {
          resource.TemplatePartial.Conditions.push(dispatchResult.path[2]);
        }
      }
    }
  }
};

export const isResourceOwned = (state: any, logicalId: any) => {
  for (const resourceId in state.resources) {
    const resource = state.resources[resourceId];

    if (resource.TemplatePartial.Resources.includes(logicalId)) {
      return true;
    }

    if (resource.Facets) {
      for (const facetType in resource.Facets) {
        for (const facet of resource.Facets[facetType]) {
          if (facet.TemplatePartial.Resources.includes(logicalId)) {
            return true;
          }
        }
      }
    }
  }

  for (const integration of state.integrations) {
    if (integration.TemplatePartial.Resources.includes(logicalId)) {
      return true;
    }
  }

  return false;
};

export const updateParameterValues = (
  value: any,
  state: any,
  isAdding: any,
) => {
  if (value instanceof Parameter) {
    if (isAdding) {
      value.insertIntoTemplate(state);
      return value.reference();
    }
  } else if (value !== null && typeof value === 'object') {
    for (const key in value) {
      value[key] = updateParameterValues(value[key], state, isAdding);
    }
  }

  return value;
};
