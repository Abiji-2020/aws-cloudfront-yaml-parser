import cloneDeep from 'clone-deep';
import * as definitions from './definitions';
import * as manageCFResources from './manageCFResources';
import updateReferences from './updateReferences';
import { parsePermissionsFromFunctionOrStateMachine } from './permission';
import deepEqual from 'deep-equal';
import * as query from './query';
import { serverlessCFId, serverlessPhysicalName } from './resource';
import Facet from './facet';
import deleteFacet from './deleteFacet';
import isComputeResource from '../utils/isComputeResource';
import dispatch, {
  UpdateResourceSettingAction,
  AddFacetAction,
  DeleteFacetAction,
} from './dispatch';
import { injectContext } from './manageCFResources';
import State from '.';
import transformations from './transformations';

export default function updateResourceSetting(
  this: any,
  resourceId: any,
  settingName: any,
  value: any,
) {
  let resource = this.resources[resourceId];
  let resourceType = resource.Type;
  let definition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[
      resourceType
    ];

  const settingSchemas = definition.Settings;

  if (!(settingName === 'Name' || settingName in settingSchemas)) {
    throw new Error(
      `Failed to update setting ${settingName} for resource ${resourceId}: Setting does not exist in ${resourceType} schema`,
    );
  }

  const settingSchema = settingSchemas[settingName];

  const currentValue = resource.Settings[settingName];
  const context: any = {
    resourceId,
    currentValue,
  };

  // If this setting depends on another and the dependency isn't met, bail
  if (settingSchema && 'DependsOn' in settingSchema) {
    const dependencySettings = Object.keys(settingSchema.DependsOn);

    for (const dependencySetting of dependencySettings) {
      if (
        resource.Settings[dependencySetting] !==
        settingSchema.DependsOn[dependencySetting]
      ) {
        /* Make sure the setting is set to the default value as we could be called
         * through recursion when the DependsOn setting is changed. */
        resource.Settings[settingName] = injectContext(
          cloneDeep(settingSchema.Default),
          context,
        );
        return;
      }
    }
  }

  if ('ExplicitType' in definition) {
    // Convert from implicit to explicit
    this.addResource(definition.ExplicitType, resourceId);

    resource = this.resources[resourceId];
    resourceType = resource.Type;
    definition =
      definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[
        definition.ExplicitType
      ];
  }

  this.reparseRequired = this.reparseRequired || settingSchema.ReparseRequired;

  if (settingName === 'Name') {
    updateName(this, resource, resourceId, definition, value);
    return;
  }

  if (settingName === 'LogicalId') {
    updateLogicalId(this, definition, resourceId, value);
    return;
  }

  if (settingName === 'CloudFormation') {
    updateCloudFormation(this, resource, value);
    return;
  }

  const valueType = settingSchemas[settingName].ValueType;
  /*  if scalar string convert to number if it's supposed to be number
      if scalar number convert to string if it's supposed to be string */
  if (valueType && typeof value !== 'object') {
    if (typeof value === 'string' && valueType === 'number') {
      value = Number(value);
      if (Number.isNaN(value)) {
        throw new Error(
          `Failed to update setting ${settingName} for resource ${resourceId}: Setting value ${value} is not of the correct valueType ${valueType}`,
        );
      }
    } else if (typeof value === 'number' && valueType === 'string') {
      value = String(value);
    } else if (typeof value === 'string' && valueType === 'boolean') {
      value = value === 'true';
    }
  }

  let cfValue = cloneDeep(value);
  cfValue = manageCFResources.updateParameterValues(cfValue, this, true);

  this.resources[resourceId].Settings[settingName] = value;

  for (const settingName in resource.Settings) {
    context[`SETTING:${settingName}`] = resource.Settings[settingName];
  }

  if (value !== currentValue) {
    const dependentSettingNames = Object.keys(definition.Settings).filter(
      (dependentSettingName) => {
        const settingSchema = definition.Settings[dependentSettingName];

        if (
          !('DependsOn' in settingSchema) ||
          !(settingName in settingSchema.DependsOn)
        ) {
          return false;
        }

        if (
          (cfValue === null || cfValue === undefined) &&
          'GlobalPath' in settingSchema
        ) {
          value = query.value(
            settingSchema.GlobalPath,
            this.template,
            undefined,
            context,
          );
        }

        return settingSchema.DependsOn[settingName] === cfValue;
      },
    );

    for (const settingName of dependentSettingNames) {
      let value;

      if ('Default' in definition.Settings[settingName]) {
        value = injectContext(
          cloneDeep(definition.Settings[settingName].Default),
          context,
        );
      }

      context[`SETTING:${settingName}`] = value;
      this.resources[resourceId].Settings[settingName] = value;
    }
  }

  if (definition.IsVirtualEventTarget) {
    let virtualEventTargetResourceId;

    const integrations = this.integrations.filter(
      (integration: any) => integration.Target.ResourceId === resource.Id,
    );

    for (const integration of integrations) {
      // Find the correct integration resource to update settings on
      virtualEventTargetResourceId = integration.VirtualEventTargetResourceId;

      const action = new UpdateResourceSettingAction(
        this.format,
        this.template,
        resource,
        settingName,
        cfValue,
        currentValue,
        { virtualEventTargetResourceId },
      );

      dispatch(action, this.template);
    }
  } else if (
    !definition.IsVirtualEventSource ||
    resource.VirtualEventSourceFunctionId
  ) {
    let integrationId;
    let serverlessFunctionId;

    if (definition.IsVirtualEventSource) {
      const integration = this.integrations.find(
        (integration: any) => integration.Source.ResourceId === resourceId,
      );
      integrationId = integration.IntegrationId;

      if (this.format === 'serverless') {
        serverlessFunctionId = integration.Target.ServerlessFunctionName;
      }
    }

    const inVpc = resource.Id in this.virtualNetworkPlacements;

    const action = new UpdateResourceSettingAction(
      this.format,
      this.template,
      resource,
      settingName,
      cfValue,
      currentValue,
      { integrationId, serverlessFunctionId, inVpc },
    );

    dispatch(action, this.template);
  }

  if (settingSchema.FacetTransformations) {
    let facetsInfos = cloneDeep(value);
    let currentFacetsInfos = cloneDeep(currentValue);

    for (const transformation of settingSchema.FacetTransformations) {
      if (!(transformation in transformations)) {
        throw new Error(`Invalid facet transformation '${transformation}'`);
      }
      facetsInfos = (transformations as any)[transformation](facetsInfos);
      currentFacetsInfos = (transformations as any)[transformation](
        currentFacetsInfos,
      );
    }
    const newFacetsInfos = facetsInfos.filter((newFacet: any) =>
      currentFacetsInfos.every(
        (currentFacet: any) => !deepEqual(newFacet.props, currentFacet.props),
      ),
    );
    const deletedFacetsInfos = currentFacetsInfos.filter((currentFacet: any) =>
      facetsInfos.every(
        (newFacet: any) => !deepEqual(newFacet.props, currentFacet.props),
      ),
    );

    for (const newFacetInfo of newFacetsInfos) {
      const action = new AddFacetAction(
        this.format,
        resource,
        settingSchema.FacetType,
        newFacetInfo.props,
      );

      const results = dispatch(action, this.template);

      const facet = new Facet(
        this.format,
        resource,
        settingSchema.FacetType,
        this.template,
        newFacetInfo.props,
      );

      manageCFResources.updateOwnership(this, facet, results);

      resource.Facets[settingSchema.FacetType].push(facet);
    }

    for (const integration of [...this.integrations]) {
      if (
        integration.Source.ResourceId !== resource.Id ||
        integration.FacetType !== settingSchema.FacetType
      ) {
        continue;
      }

      const facet = resource.Facets[settingSchema.FacetType].find(
        (facet: any) => facet.Id === integration.FacetId,
      );

      const deletedFacet = deletedFacetsInfos.find((deletedFacet: any) =>
        deepEqual(deletedFacet.props, facet.Properties),
      );

      if (deletedFacet) {
        this.deleteIntegration(
          integration.Source.ResourceId,
          integration.Target.ResourceId,
          settingSchema.FacetType,
          facet.Id,
        );
      }
    }

    for (const facetInfo of deletedFacetsInfos) {
      const action = new DeleteFacetAction(
        this.format,
        resource,
        settingSchema.FacetType,
        facetInfo.props,
      );

      dispatch(action, this.template);

      const facet = resource.Facets[settingSchema.FacetType].find(
        (facetObject: any) =>
          deepEqual(facetObject.Properties, facetInfo.props),
      );

      deleteFacet(this, resourceId, settingSchema.FacetType, facet.Id);
    }
  } else if (settingSchema.FacetType) {
    const newFacetsProps = value.filter((newFacet: any) =>
      currentValue.every(
        (currentFacet: any) => !deepEqual(newFacet, currentFacet),
      ),
    );
    const deletedFacetsProps = currentValue.filter((currentFacet: any) =>
      value.every((newFacet: any) => !deepEqual(newFacet, currentFacet)),
    );

    for (const facetProps of newFacetsProps) {
      const action = new AddFacetAction(
        this.format,
        resource,
        settingSchema.FacetType,
        facetProps,
      );

      const results = dispatch(action, this.template);

      const facet = new Facet(
        this.format,
        resource,
        settingSchema.FacetType,
        this.template,
        facetProps,
      );

      manageCFResources.updateOwnership(this, facet, results);

      resource.Facets[settingSchema.FacetType].push(facet);
    }

    for (const integration of [...this.integrations]) {
      if (
        integration.Source.ResourceId !== resource.Id ||
        integration.FacetType !== settingSchema.FacetType
      ) {
        continue;
      }

      const facet = resource.Facets[settingSchema.FacetType].find(
        (facet: any) => facet.Id === integration.FacetId,
      );

      const deletedFacet = deletedFacetsProps.find((deletedFacet: any) =>
        deepEqual(deletedFacet, facet.Properties),
      );
      if (deletedFacet) {
        this.deleteIntegration(
          integration.Source.ResourceId,
          integration.Target.ResourceId,
          settingSchema.FacetType,
          facet.Id,
        );
      }
    }

    for (const facetProps of deletedFacetsProps) {
      const action = new DeleteFacetAction(
        this.format,
        resource,
        settingSchema.FacetType,
        facetProps,
      );

      dispatch(action, this.template);

      const facet = resource.Facets[settingSchema.FacetType].find(
        (facetObject: any) => deepEqual(facetObject.Properties, facetProps),
      );

      deleteFacet(this, resourceId, settingSchema.FacetType, facet.Id);
    }
  }

  manageCFResources.updateParameterValues(currentValue, this, false);

  if (settingName === 'Environment') {
    updateReferences(
      resourceId,
      this.template,
      this.resources,
      this.references,
    );
  }

  if (settingName === 'ServerlessPerRolePermissions' && value === false) {
    const globalStatements =
      (this.template.provider && this.template.provider.iamRoleStatements) ||
      [];

    for (const statement of resource.Settings.Permissions || []) {
      if (
        globalStatements.every(
          (globalStatement: any) => !deepEqual(globalStatement, statement),
        )
      ) {
        globalStatements.push(statement);
      }
    }

    this.template.provider = {
      ...this.template.provider,
      iamRoleStatements: globalStatements,
    };
  }

  if (settingName === 'Permissions') {
    if (this.format === 'SAM' && resource.Type === 'function') {
      const permissions = parsePermissionsFromFunctionOrStateMachine(
        this.template.Resources[resourceId],
        this.template,
        this.resources,
      );
      if (permissions) {
        this.permissions[resourceId] = permissions;
      } else {
        delete this.permissions[resourceId];
      }
    }
  }

  for (const otherSettingName in definition.Settings) {
    const otherSettingSchema = definition.Settings[otherSettingName];

    if (
      'DependsOn' in otherSettingSchema &&
      Object.keys(otherSettingSchema.DependsOn).includes(settingName)
    ) {
      for (const [dependencySetting, dependencySettingValue] of Object.entries(
        otherSettingSchema.DependsOn || {},
      )) {
        let dependencyValue = resource.Settings[dependencySetting];

        if (
          (dependencyValue === null || dependencyValue === undefined) &&
          'GlobalPath' in settingSchema
        ) {
          dependencyValue = query.value(
            settingSchema.GlobalPath,
            this.template,
            undefined,
            {},
          );
        }

        if (
          dependencyValue !== dependencySettingValue &&
          resource.Settings[otherSettingName] !== otherSettingSchema.Default
        ) {
          this.updateResourceSetting(
            resourceId,
            otherSettingName,
            injectContext(cloneDeep(otherSettingSchema.Default), context),
          );
          break;
        }
      }
    }
  }

  if (settingName === 'UseExistingResource' && value !== currentValue) {
    if (value) {
      this.cfTemplate().Conditions = {
        ...(this.cfTemplate().Conditions || {}),

        [`${resource.Id}CreateNewResource`]: {
          'Fn::Equals': ['false', resource.Settings.ExistingResourceData],
        },

        [`${resource.Id}UseExistingResource`]: {
          'Fn::Not': [{ Condition: `${resource.Id}CreateNewResource` }],
        },
      };

      this.cfTemplate().Resources[`${resource.Id}ExistingResource`] = {
        Type: 'Custom::cfnExistingResource',
        Properties: {
          ServiceToken: {
            'Fn::Sub':
              this.format === 'serverless'
                ? 'arn:aws:lambda:#{AWS::Region}:#{AWS::AccountId}:function:cfn-agent-commander'
                : 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander', // eslint-disable-line no-template-curly-in-string
          },
          Type: resource.Type,
          Data: resource.Settings.ExistingResourceData,
        },
        Condition: `${resource.Id}UseExistingResource`,
      };
    } else {
      delete this.cfTemplate().Conditions[`${resource.Id}CreateNewResource`];
      delete this.cfTemplate().Conditions[`${resource.Id}UseExistingResource`];

      if (Object.keys(this.cfTemplate().Conditions).length === 0) {
        delete this.cfTemplate().Conditions;
      }

      delete this.cfTemplate().Resources[`${resource.Id}ExistingResource`];
    }

    for (const resourceId in this.cfTemplate().Resources) {
      if (resourceId === `${resource.Id}ExistingResource`) {
        continue;
      }

      const cfResource = this.cfTemplate().Resources[resourceId];

      if (resource.TemplatePartial.Resources.includes(resourceId)) {
        if (value) {
          cfResource.Condition = `${resource.Id}CreateNewResource`;
        } else {
          delete cfResource.Condition;
        }
      } else {
        this.cfTemplate().Resources[resourceId] =
          manageCFResources.updateExistingResourceConditions(
            cfResource,
            resource,
            value,
          );
      }
    }
  }

  manageCFResources.updateOwnership(this, resource, undefined);

  /* Update references/permissions/integrations/virtualNetworkPlacements
   * for existing resources */
  if (settingName === 'UseExistingResource' && value !== currentValue) {
    for (const computeResource of Object.values(this.resources)) {
      if (
        'Environment' in (computeResource as any).Settings &&
        (computeResource as any).Settings.Environment
      ) {
        const newEnvironment =
          manageCFResources.updateExistingResourceConditions(
            (computeResource as any).Settings.Environment,
            resource,
            value,
          );

        this.updateResourceSetting(
          (computeResource as any).Id,
          'Environment',
          newEnvironment,
        );
      }

      if (
        'Permissions' in (computeResource as any).Settings &&
        (computeResource as any).Settings.Permissions
      ) {
        const newPermissions =
          manageCFResources.updateExistingResourceConditions(
            (computeResource as any).Settings.Permissions,
            resource,
            value,
          );

        this.updateResourceSetting(
          (computeResource as any).Id,
          'Permissions',
          newPermissions,
        );
      }
    }

    for (const section of ['integrations', 'virtualNetworkPlacements']) {
      this[section] = manageCFResources.updateExistingResourceConditions(
        this[section],
        resource,
        value,
      );
    }
  }

  manageCFResources.updateDefaultParameters(this.template);
  manageCFResources.cleanupTemplate(this);
}

const updateName = (
  state: any,
  resourceObj: any,
  resourceId: any,
  definition: any,
  value: any,
) => {
  // Adding virtual resources to an empty stack could result in the Resources key
  // not yet being defined
  if (definition.IsVirtualEventSource && !state.cfTemplate().Resources) {
    return;
  }

  let resource;

  if (state.format === 'serverless' && resourceObj.Type === 'function') {
    if (!value) {
      throw new Error('Serverless functions must have a name');
    }

    if (value === resourceObj.Settings.Name) {
      return;
    }

    state.template.functions[value] =
      state.template.functions[resourceObj.Settings.Name];
    delete state.template.functions[resourceObj.Settings.Name];

    resource = state.template.functions[value];
  } else {
    resource = state.cfTemplate().Resources[resourceId];
  }

  const oldName = resourceObj.Settings.Name;
  resourceObj.Settings.Name = value;

  const updatecfnNameMetadata = (resource: any, value: any) => {
    if (value) {
      resource.Metadata = resource.Metadata || {};
      resource.Metadata.cfnName = value;
    } else {
      if ('Metadata' in resource) {
        delete resource.Metadata.cfnName;

        if (Object.keys(resource.Metadata).length === 0) {
          delete resource.Metadata;
        }
      }
    }
  };

  if (definition.IsVirtualEventSource) {
    const integration = state.integrations.find(
      (integration: any) => integration.Source.ResourceId === resourceId,
    );

    if (integration) {
      const targetId = integration.Target.ResourceId;
      const cfResource =
        state.cfTemplate().Resources[targetId].Properties.Events[
          integration.IntegrationId
        ];

      updatecfnNameMetadata(cfResource, value);
    }
  } else {
    if (resourceId in (state.cfTemplate().Resources || {})) {
      updatecfnNameMetadata(resource, value);
    }
  }

  const action = new UpdateResourceSettingAction(
    state.format,
    state.template,
    resourceObj,
    'Name',
    value || resourceId,
    null,
  );

  dispatch(action, state.template);

  if (state.format === 'serverless' && resourceObj.Type === 'function') {
    const newResourceId = serverlessCFId('function', value);
    state.resources[newResourceId] = resourceObj;
    delete state.resources[resourceId];

    const oldPhysicalName = resourceObj.PhysicalName;

    resourceObj.Id = newResourceId;
    resourceObj.PhysicalName = serverlessPhysicalName(resourceObj);
    resourceObj.TemplatePartial.Resources =
      resourceObj.TemplatePartial.Resources.map((ownedResourceId: any) => {
        return ownedResourceId === resourceId ? newResourceId : ownedResourceId;
      });

    // Update integrations to refer to the function's new resource id
    for (const integration of state.integrations) {
      if (integration.Source.ResourceId === resourceId) {
        integration.Source.ResourceId = newResourceId;
        integration.Source.ServerlessFunctionName = value;
        integration.Id = `${integration.FacetId || integration.Source.ResourceId}To${integration.Target.ResourceId}`;
      } else if (integration.Target.ResourceId === resourceId) {
        integration.Target.ResourceId = newResourceId;
        integration.Target.ServerlessFunctionName = value;
        integration.Id = `${integration.FacetId || integration.Source.ResourceId}To${integration.Target.ResourceId}`;
      }
    }

    const oldFunctionId = serverlessCFId('function', oldName);
    const newFunctionId = serverlessCFId('function', value);

    // Update virtual event source function IDs
    for (const resourceName in state.resources) {
      const resource = state.resources[resourceName];
      if (resource.VirtualEventSourceFunctionId === oldName) {
        resource.VirtualEventSourceFunctionId = value;
      }
    }

    // Update references from this function
    if (resourceId in state.references) {
      state.references[newResourceId] = state.references[resourceId];
      delete state.references[resourceId];
    }

    // Update references from other resources to this function
    for (const [resourceId, _resource] of Object.entries(state.resources)) {
      const resource: any = _resource;
      if (!isComputeResource(resource.Type) || !resource.Settings.Environment) {
        continue;
      }

      const env = cloneDeep(resource.Settings.Environment);

      let updated = false;
      for (const [envVar, _value] of Object.entries(env)) {
        const value: any = _value;
        if (typeof value !== 'object') {
          continue;
        }

        if (value.Ref === oldFunctionId) {
          env[envVar].Ref = newFunctionId;
          updated = true;
        } else if (
          value['Fn::GetAtt'] &&
          value['Fn::GetAtt'][0] === oldFunctionId
        ) {
          env[envVar]['Fn::GetAtt'][0] = newFunctionId;
          updated = true;
        }
      }

      if (updated) {
        state.updateResourceSetting(resourceId, 'Environment', env);
      }
    }

    updateServerlessFunctionReferences(state.cfTemplate(), oldName, value);

    // Update resources in TemplatePartials
    for (const resource of Object.values(state.resources)) {
      (resource as any).TemplatePartial.Resources = (
        resource as any
      ).TemplatePartial.Resources.map((resourceId: any) => {
        return resourceId
          .replace(oldFunctionId, newFunctionId)
          .replace(oldName, value);
      });
    }

    // Update permissions to interact with this function
    for (const statement of state.template.provider.iamRoleStatements || []) {
      let resources = statement.Resource;

      if (!Array.isArray(resources)) {
        resources = [resources];
      }

      for (const resource of resources) {
        if (typeof resource !== 'object') {
          continue;
        }

        if (resource.Ref === oldFunctionId) {
          resource.Ref = newFunctionId;
        } else if (
          resource['Fn::GetAtt'] &&
          resource['Fn::GetAtt'][0] === oldFunctionId
        ) {
          resource['Fn::GetAtt'][0] = newFunctionId;
        } else if (resource['Fn::Sub']) {
          const sub = resource['Fn::Sub'];

          if (typeof sub === 'string') {
            resource['Fn::Sub'] = sub.replace(
              oldPhysicalName,
              resourceObj.PhysicalName,
            );
          } else {
            for (const param in sub[1]) {
              if (typeof sub[1][param] === 'string') {
                sub[1][param] = sub[1][param].replace(
                  oldPhysicalName,
                  resourceObj.PhysicalName,
                );
              }
            }
          }
        }
      }

      if (Array.isArray(statement.Resource)) {
        statement.Resource = resources;
      } else {
        statement.Resource = resources[0];
      }
    }

    manageCFResources.cleanupTemplate(state);
  }
};

const updateServerlessFunctionReferences = (
  cfTemplate: any,
  oldFunctionName: any,
  newFunctionName: any,
) => {
  const oldFunctionId = serverlessCFId('function', oldFunctionName);
  const newFunctionId = serverlessCFId('function', newFunctionName);

  if (typeof cfTemplate === 'string') {
    return cfTemplate
      .replace(oldFunctionId, newFunctionId)
      .replace(oldFunctionName, newFunctionName);
  }

  if (typeof cfTemplate === 'object') {
    for (const key in cfTemplate) {
      const newKey = key
        .replace(oldFunctionId, newFunctionId)
        .replace(oldFunctionName, newFunctionName);

      cfTemplate[newKey] = updateServerlessFunctionReferences(
        cfTemplate[key],
        oldFunctionName,
        newFunctionName,
      );

      if (newKey !== key) {
        delete cfTemplate[key];
      }
    }
  }

  return cfTemplate;
};

const updateCloudFormation = (state: any, resource: any, value: any) => {
  const invalidSections = Object.keys(value || {}).filter(
    (key) => !['Conditions', 'Resources'].includes(key),
  );
  if (invalidSections.length > 0) {
    throw new Error(
      `Invalid custom CloudFormation section(s) ${invalidSections.join(', ')}`,
    );
  }

  for (const type of ['Conditions', 'Resources']) {
    for (const logicalId of resource.TemplatePartial[type]) {
      delete state.cfTemplate()[type][logicalId];
    }

    if (!value || !(type in value)) {
      continue;
    }

    for (const logicalId in value[type]) {
      state.cfTemplate()[type] = {
        ...(state.cfTemplate()[type] || {}),

        [logicalId]: value[type][logicalId],
      };
    }
  }

  resource.Settings.CloudFormation = value;

  manageCFResources.updateOwnership(state, resource, null);

  manageCFResources.updateDefaultParameters(state.template);
  manageCFResources.cleanupTemplate(state);

  // TODO: Update customResourceReferences
};

const updateLogicalId = (
  state: any,
  definition: any,
  originalId: any,
  newId: any,
) => {
  if (originalId === newId) {
    return;
  }

  updateResourceIdResourceName(
    state.cfTemplate(),
    definition,
    originalId,
    newId,
  );

  const logicalIdMap = logicalIDsToRename(state, originalId, newId);

  for (const [originalId, newId] of Object.entries(logicalIdMap.Conditions)) {
    updateConditionLogicalId(state, originalId, newId);
  }

  for (const [originalId, newId] of Object.entries(logicalIdMap.Resources)) {
    updateResourceLogicalId(state, originalId, newId);
  }

  // Easier for us to reparse the state, than to update all the state data due to the Logical ID change
  const newState: any = new State(state.template, state.format);

  for (const key in newState) {
    state[key] = newState[key];
  }
};

const MAX_NAME_LENGTHS: any = {
  'AWS::S3::Bucket': 63,
  'AWS::IAM::Role': 64,
  'AWS::Serverless::Function': 64,
  'Custom::cfnEdgeFunction': 64,
  'AWS::SQS::Queue': 80,
  'AWS::Kinesis::Stream': 128,
  'AWS::Cognito::UserPool': 128,
  'AWS::DynamoDB::Table': 255,
  'AWS::SNS::Topic': 256,
  'AWS::SecretsManager::Secret': 512,
  'AWS::Logs::LogStream': 512,
};

const SERVICE_TO_RESOURCE_TYPE: any = {
  'cognito-idp': 'AWS::Cognito::UserPool',
  dynamodb: 'AWS::DynamoDB::Table',
  iam: 'AWS::IAM::Role',
  kinesis: 'AWS::Kinesis::Stream',
  lambda: 'AWS::Serverless::Function',
  'log-stream': 'AWS::Logs::LogStream',
  s3: 'AWS::S3::Bucket',

  sns: 'AWS::SNS::Topic',
  sqs: 'AWS::SQS::Queue',
};

const maxNameLengthOfService = (service: any) => {
  if (service in SERVICE_TO_RESOURCE_TYPE) {
    const resourceType = SERVICE_TO_RESOURCE_TYPE[service];
    return MAX_NAME_LENGTHS[resourceType];
  }
  return -1;
};

/* Update physical resource names, knowing that names have length limits and the
 * stack name can be up to 40 characters long. This function looks for parts of
 * the original ID in physical resource name settings, then swaps it out with
 * the new ID up to the maximum length possible with a full 40 character stack
 * name. */
const SECRET_NAME_PREFIX_RE =
  /^\/\${(cfn)?EnvironmentTagName}\/\${(cfn)?StackTagName}\//;
const updateResourceIdResourceName = (
  template: any,
  definition: any,
  originalId: any,
  newId: any,
) => {
  for (const _resource of Object.values(template.Resources)) {
    const resource: any = _resource;
    const maxNameLength = MAX_NAME_LENGTHS[resource.Type];
    if (!maxNameLength) {
      continue;
    }

    for (const [property, _value] of Object.entries(
      resource.Properties || {},
    )) {
      const value: any = _value;
      if (
        property.endsWith('Name') &&
        Object.keys(value).length === 1 &&
        'Fn::Sub' in value &&
        typeof value['Fn::Sub'] === 'string' &&
        (value['Fn::Sub'].startsWith('${AWS::StackName}-') || // eslint-disable-line no-template-curly-in-string
          SECRET_NAME_PREFIX_RE.test(value['Fn::Sub']))
      ) {
        value['Fn::Sub'] = updateShortenedResourceName(
          value['Fn::Sub'],
          originalId,
          newId,
          resource.Type,
        );
      }
    }
  }
};

const logicalIDsToRename = (state: any, originalId: any, newId: any) => {
  const conditions = Array.from(
    state.resources[originalId].TemplatePartial.Conditions,
  );
  const resources = Array.from(
    state.resources[originalId].TemplatePartial.Resources,
  );

  for (const integration of state.integrations) {
    if (
      integration.Source.ResourceId === originalId ||
      integration.Target.ResourceId === originalId
    ) {
      Array.prototype.push.apply(
        conditions,
        integration.TemplatePartial.Conditions,
      );
      Array.prototype.push.apply(
        resources,
        integration.TemplatePartial.Resources,
      );
    }
  }

  for (const resource_ of Object.values(state.resources)) {
    const resource: any = resource_;
    for (const facetType in resource.Facets) {
      for (const facet of resource.Facets[facetType]) {
        Array.prototype.push.apply(
          conditions,
          facet.TemplatePartial.Conditions,
        );
        Array.prototype.push.apply(resources, facet.TemplatePartial.Resources);
      }
    }
  }

  const logicalIdMap: any = {
    Conditions: {},
    Resources: {},
  };
  for (const logicalId_ of conditions) {
    const logicalId: any = logicalId_;
    if (logicalId.includes(originalId)) {
      const newConditionId = logicalId.replace(originalId, newId);
      logicalIdMap.Conditions[logicalId] = newConditionId;
    }
  }
  for (const logicalId_ of resources) {
    const logicalId: any = logicalId_;
    if (logicalId.includes(originalId)) {
      const newResourceId = logicalId.replace(originalId, newId);
      logicalIdMap.Resources[logicalId] = newResourceId;
    }
  }
  return logicalIdMap;
};

const updateConditionLogicalId = (state: any, originalId: any, newId: any) => {
  state.cfTemplate().Conditions[newId] =
    state.cfTemplate().Conditions[originalId];
  delete state.cfTemplate().Conditions[originalId];
  updateConditionIdReferences(state.template, originalId, newId);
};

const updateResourceLogicalId = (state: any, originalId: any, newId: any) => {
  state.cfTemplate().Resources[newId] =
    state.cfTemplate().Resources[originalId];
  delete state.cfTemplate().Resources[originalId];

  updateResourceIdReferences(state.template, originalId, newId);
};

const updateResourceIdReferences = (
  object: any,
  originalId: any,
  newId: any,
) => {
  if (object && typeof object === 'object') {
    if ('Events' in object && !Array.isArray(object.Events)) {
      updateResourceEvents(object.Events, originalId, newId);
    }
    if (Object.keys(object).length === 1 && 'Ref' in object) {
      if (object.Ref === originalId) {
        object.Ref = newId;
      }
    } else if (Object.keys(object).length === 1 && 'Fn::GetAtt' in object) {
      if (object['Fn::GetAtt'][0] === originalId) {
        object['Fn::GetAtt'][0] = newId;
      }
    } else if (Object.keys(object).length === 1 && 'Fn::Sub' in object) {
      let sub = object['Fn::Sub'];
      const originalIdRE = new RegExp(`([$#]\\{)${originalId}([.}])`, 'g');

      if (Array.isArray(sub)) {
        for (const varName in sub[1]) {
          updateResourceIdReferences(sub[1][varName], originalId, newId);

          /* cfn-specific heuristic, we use ResourceId and ResourceName
           * as !Sub parameters to substitute in the logical ID in things like
           * resource description properties. */
          if (
            (varName === 'ResourceId' || varName === 'ResourceName') &&
            sub[1][varName] === originalId
          ) {
            sub[1][varName] = newId;
          }
        }

        sub = sub[0];

        object['Fn::Sub'][0] = sub.replace(originalIdRE, `$1${newId}$2`);
      } else {
        if (sub.startsWith('arn')) {
          sub = updateShortenedResourceName(sub, originalId, newId, null);
        }
        object['Fn::Sub'] = sub.replace(originalIdRE, `$1${newId}$2`);
      }
    } else {
      for (const [key, value_] of Object.entries(object)) {
        const value: any = value_;
        // Modify access policies for state machine targets.
        if (key === 'PolicyName' && value === `Access${originalId}`) {
          object[key] = `Access${newId}`;
          continue;
        }
        const stateDefinitionKeys = [
          'FunctionName',
          'TableName',
          'TaskDefinition',
          'TopicArn',
          'QueueUrl',
          'StateMachineArn',
          'ApiEndpoint',
          'Stage',
          'Subnets.$',
        ];
        if (stateDefinitionKeys.includes(key) && typeof value === 'string') {
          const re = new RegExp(
            `\\$\\{${originalId}(Arn|Name|Url|Endpoint|Stage|VpcSubnets)\\}`,
          );
          if (re.test(object[key])) {
            object[key] = object[key].replace(originalId, newId);
            continue;
          }
        }
        if (key === 'DefinitionSubstitutions' && typeof value === 'object') {
          for (const k of Object.keys(value)) {
            const keys = [
              `${originalId}Arn`,
              `${originalId}Name`,
              `${originalId}Url`,
              `${originalId}Endpoint`,
              `${originalId}Stage`,
              `${originalId}VpcSubnets`,
            ];
            if (keys.includes(k)) {
              const newTag = k.replace(originalId, newId);
              value[newTag] = value[k];
              delete value[k];
            }
          }
        }

        if (key !== 'cfnName') {
          if (key === 'DependsOn' && Array.isArray(value)) {
            object[key] = value.map((e) => (e === originalId ? newId : e));
          } else if (
            (key === 'DependsOn' ||
              key === 'Name' ||
              key === 'cfnIntegrationSourceId') &&
            value === originalId
          ) {
            object[key] = newId;
          }
          if (key === 'DependsOn' && Array.isArray(value)) {
            object.DependsOn = object.DependsOn.map((resourceId: any) =>
              resourceId === originalId ? newId : resourceId,
            );
          }
          if (key.endsWith('Name') || key.endsWith('Description')) {
            if (
              value &&
              typeof value === 'object' &&
              Object.keys(value).length === 1 &&
              'Fn::Sub' in value
            ) {
              const sub = value['Fn::Sub'];
              if (!Array.isArray(sub)) {
                const logicalIdRE = new RegExp(
                  `(^|[^a-zA-Z0-9])${originalId}([^a-zA-Z0-9]|$)`,
                );
                if (logicalIdRE.test(sub)) {
                  value['Fn::Sub'] = sub.replace(
                    new RegExp(originalId, 'g'),
                    newId,
                  );
                }
              }
            }
          } else if (key === 'OriginAccessIdentity') {
            // This is intended to update OriginAccessIdentity for cdn->objectStore
            const sub = value['Fn::Sub'];
            if (Array.isArray(sub)) {
              for (const subEntry of sub) {
                if (typeof subEntry === 'object') {
                  for (const key in subEntry) {
                    if (
                      typeof subEntry[key] === 'string' &&
                      subEntry[key].startsWith(originalId)
                    ) {
                      subEntry[key] = subEntry[key].replace(originalId, newId);
                    }
                  }
                }
              }
            }
          }
          updateResourceIdReferences(object[key], originalId, newId);
        }
      }
    }
  }
};

// Update function event triggers from api
const updateResourceEvents = (object: any, originalId: any, newId: any) => {
  for (const key of Object.keys(object)) {
    // Object store events are named with just the ID
    if (key === originalId) {
      // We're modifying the object being iterated over, but the references to original keys
      // were already collected by Object.keys().
      object[newId] = object[key];
      delete object[key];
      continue;
    }

    const methods = ['HEAD', 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'ANY'];
    for (const method of methods) {
      const oldEvent = `${originalId}${method}`;
      if (key.startsWith(oldEvent)) {
        const suffix = key.substring(oldEvent.length);
        const newEvent = `${newId}${method}${suffix}`;

        object[newEvent] = object[key];
        delete object[key];
      }
    }
  }
};

const updateConditionIdReferences = (
  object: any,
  originalId: any,
  newId: any,
) => {
  if (object && typeof object === 'object') {
    if (
      Object.keys(object).length === 1 &&
      'Fn::If' in object &&
      object['Fn::If'][0] === originalId
    ) {
      object['Fn::If'][0] = newId;
    } else {
      for (const key in object) {
        if (key === 'Condition' && object[key] === originalId) {
          object[key] = newId;
        }
        updateConditionIdReferences(object[key], originalId, newId);
      }
    }
  }
};

const updateShortenedResourceName = (
  str: any,
  originalId: any,
  newId: any,
  type: any,
) => {
  /* If the resource type is not given, we hope that the input string is an
   * arn, and we can determine the resource type by examining the arn. */
  let downcase;
  let maxNameLength = -1;
  if (type) {
    downcase = type === 'AWS::S3::Bucket';
    maxNameLength = MAX_NAME_LENGTHS[type];
  } else if (str.startsWith('arn:')) {
    /* An ARN may include parameter substitutions like ${AWS::StackName}, which makes
     * determining the service more difficult.  Remove them. */
    const parameterRegex = new RegExp('\\${[^}]+}', 'g'); // eslint-disable-line no-template-curly-in-string
    const splits = str.replace(parameterRegex, '').split(':');

    let service = 'unknown';
    if (splits.length === 6) {
      service = splits[2];
    } else if (splits.length === 9) {
      // arns for log streams may have 9 components; in that case extract 'log-stream'
      service = splits[7];
    }

    downcase = service === 's3';
    maxNameLength = maxNameLengthOfService(service);
  }
  if (maxNameLength === -1) {
    return str;
  }

  /* We look for at least the first 9 characters of the original ID, that's
   * the minimum we insert into the template for any given resource addition
   * reaction. Up to 9 characters of the logical ID are inserted for GraphQL
   * access roles when integrating resolvers to resources. */
  const originalIdRegex = new RegExp(
    `[-/](${originalId.substring(0, 9)}[a-zA-Z0-9]*)`,
    'i',
  );
  const match = originalIdRegex.exec(str);

  if (!match) {
    return str;
  }

  const originalIdPosition = match.index + 1;
  const originalIdLength = match[1].length;

  /* Check that matched original ID string is a true substring of the
   * original ID. */
  if (
    !originalId.toLowerCase().startsWith(match[0].substring(1).toLowerCase())
  ) {
    return str;
  }

  // When computing the acceptable resource length, we disregard the aws region, service, etc.
  let strLength = str.length;
  if (str.startsWith('arn:')) {
    const index = str.indexOf('${AWS::StackName}'); // eslint-disable-line no-template-curly-in-string
    if (index === -1) {
      // This input isn't what we expected
      return str;
    }
    strLength = str.length - index;
  }

  const maxLengthWithoutResourceId =
    strLength +
    // Swap out length of ${AWS::StackName} string with max length of the stack name
    (40 - '${AWS::StackName}'.length) + // eslint-disable-line no-template-curly-in-string
    (str.endsWith('${AWS::AccountId}') ? 12 - '${AWS::AccountId}'.length : 0) - // eslint-disable-line no-template-curly-in-string
    originalIdLength;

  const maxNewResourceIdLength = maxNameLength - maxLengthWithoutResourceId;
  const newNamePart = downcase ? newId.toLowerCase() : newId;

  return (
    str.substring(0, originalIdPosition) +
    newNamePart.substring(0, maxNewResourceIdLength) +
    str.substring(originalIdPosition + originalIdLength)
  );
};
