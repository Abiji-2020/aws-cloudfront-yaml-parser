import cloneDeep from 'clone-deep';
import jp from 'jsonpath';
import deepEqual from 'deep-equal';
import * as definitions from './definitions';
import { ERROR_CODES, injectContext } from './manageCFResources';
import * as query from './query';
import resolveSubBindings from './resolveSubBindings';
import transformations from './transformations';

export default function dispatch(action: any, template: any) {
  const results = [];

  for (const reactionDefinition of definitions[
    action.properties.Format as 'SAM' | 'serverless'
  ].Reactions) {
    if (matches(action, reactionDefinition)) {
      try {
        /* Some reactions are empty because they are not valid in this
         * template's format. */
        for (const reaction of reactionDefinition.Reactions.filter(
          (reaction: any) => reaction,
        )) {
          switch (reaction.Type) {
            case 'Upsert':
              results.push(upsert(action, reaction, template));
              break;

            case 'Append':
              results.push(append(action, reaction, template));
              break;

            case 'RenameKey':
              results.push(renameKey(action, reaction, template));
              break;

            case 'Delete':
              results.push(del(action, reaction, template));
              break;

            default:
              console.warn(`Invalid reaction type ${reaction.Type}`);
              console.warn(`Action: ${JSON.stringify(action, null, 2)}`);
              console.warn(`Reaction: ${JSON.stringify(reaction, null, 2)}`);
              break;
          }
        }
      } catch (err: any) {
        if (err.code !== ERROR_CODES.UNDEFINED_CONTEXT_KEY) {
          throw err;
        }
      }
    }
  }

  return results;
}

class Action {
  action?: any;
  properties?: any;
  context?: any;
  resourceSettings?: any;
  FacetType?: any;
  FacetId?: any;
  constructor(format: 'serverless' | 'SAM', actionType: any) {
    this.action = actionType;

    this.properties = {
      Format: format,
    };

    this.context = {};
  }
}

export class AddResourceAction extends Action {
  constructor(
    format: 'SAM' | 'serverless',
    resourceType: any,
    resourceId: any,
    { serverlessFunctionName }: any,
  ) {
    super(format, 'AddResource');

    this.properties.ResourceType = resourceType;

    const definition = definitions[format].ResourceTypes[resourceType];
    const settingSchemas = definition.Settings;

    this.context = {
      resourceId,
    };

    for (const settingName in settingSchemas) {
      const defaultValue = injectContext(
        cloneDeep(settingSchemas[settingName].Default),
        this.context,
      );
      this.context[`SETTING:${settingName}`] = defaultValue;
    }

    if (format === 'serverless' && resourceType === 'function') {
      this.context['SETTING:Name'] = serverlessFunctionName;
    }
  }
}

export class UpdateResourceSettingAction extends Action {
  constructor(
    format: 'serverless' | 'SAM',
    template: any,
    resource: any,
    settingName: any,
    value: any,
    currentValue: any,
    options: any = {},
  ) {
    super(format, 'UpdateResourceSetting');

    this.properties = {
      ...this.properties,
      ResourceType: resource.Type,
      Setting: settingName,
      Value: value,
      CurrentValue: currentValue,
    };

    this.resourceSettings = resource.Settings;

    const definition = definitions[format].ResourceTypes[resource.Type];
    const settingSchemas = definition.Settings;

    for (const settingName in settingSchemas) {
      if (resource.Settings[settingName] == null) {
        const defaultValue = injectContext(
          cloneDeep(settingSchemas[settingName].Default),
          this.context,
        );
        this.context[`SETTING:${settingName}`] = defaultValue;
      } else {
        this.context[`SETTING:${settingName}`] = resource.Settings[settingName];
      }
    }

    this.context = {
      ...this.context,
      resourceId: options.virtualEventTargetResourceId || resource.Id,
      currentValue,
      currentTemplate: template,
      INVPC: options.inVpc,
    };

    if ('VirtualEventSourceFunctionId' in resource) {
      this.context.virtualEventSourceFunctionId =
        resource.VirtualEventSourceFunctionId;
    }

    if (options.serverlessFunctionId) {
      this.context.serverlessFunctionId = options.serverlessFunctionId;
    }

    if ('integrationId' in options) {
      this.context.integrationId = options.integrationId;
    }
  }
}

class FacetAction extends Action {
  constructor(
    format: 'SAM' | 'serverless',
    resource: any,
    facetType: any,
    facetProps: any,
    actionType: any,
  ) {
    super(format, actionType);

    this.properties = {
      ...this.properties,
      ResourceType: resource.Type,
      FacetType: facetType,
    };

    this.context = {
      ...this.context,
      resourceId: resource.Id,
    };

    const definition = definitions[format].ResourceTypes[resource.Type];

    const settingSchemas = definition.Settings;

    for (const settingName in settingSchemas) {
      if (resource.Settings[settingName] == null) {
        const defaultValue = injectContext(
          cloneDeep(settingSchemas[settingName].Default),
          this.context,
        );
        this.context[`SETTING:${settingName}`] = defaultValue;
      } else {
        this.context[`SETTING:${settingName}`] = resource.Settings[settingName];
      }
    }

    const facetSettingSchemas =
      'FacetSettings' in definition ? definition.FacetSettings[facetType] : {};

    for (const settingName in facetSettingSchemas) {
      const defaultValue = injectContext(
        cloneDeep(facetSettingSchemas[settingName].Default),
        this.context,
      );
      this.context[`FACETSETTING:${settingName}`] = defaultValue;
    }

    for (const [prop, value] of Object.entries(facetProps)) {
      this.context[`FACET:${prop}`] = value;
    }
  }
}

export class AddFacetAction extends FacetAction {
  constructor(
    format: 'serverless' | 'SAM',
    resource: any,
    facetType: any,
    facetProps: any,
  ) {
    super(format, resource, facetType, facetProps, 'AddFacet');
  }
}

export class DeleteFacetAction extends FacetAction {
  constructor(
    format: 'serverless' | 'SAM',
    resource: any,
    facetType: any,
    facetProps: any,
  ) {
    super(format, resource, facetType, facetProps, 'DeleteFacet');

    const facets = resource.Facets[facetType];
    const facet = facets.find((facet: any) =>
      Object.keys(facetProps).every(
        (prop) => facetProps[prop] === facet.Properties[prop],
      ),
    );

    if (facet.Properties.ResourceId) {
      this.context['FACET:ResourceId'] = facet.Properties.ResourceId;
    }
  }
}

export class UpdateFacetSettingAction extends FacetAction {
  constructor(
    format: 'SAM' | 'serverless',
    resource: any,
    facetType: any,
    facetProps: any,
    settingName: any,
    value: any,
    currentValue: any,
  ) {
    super(format, resource, facetType, facetProps, 'UpdateFacetSetting');

    this.properties = {
      ...this.properties,
      Setting: settingName,
      Value: value,
    };

    this.context[`FACETSETTING:${settingName}`] = value;
    this.context.currentValue = currentValue;
  }
}

class IntegrationAction extends Action {
  constructor(
    format: 'SAM' | 'serverless',
    template: any,
    source: any,
    target: any,
    { facetType, facetId }: any = {},
    actionType: any,
  ) {
    super(format, actionType);

    this.properties = {
      ...this.properties,
      SourceType: source.Type,
      TargetType: target.Type,
    };

    if (facetType) {
      this.properties.FacetType = facetType;
    }

    this.context = {
      ...this.context,
      sourceId: source.Id,
      targetId: target.Id,
    };

    if (source.PhysicalName) {
      this.context.sourcePhysicalName = source.PhysicalName['Fn::Sub']
        ? source.PhysicalName['Fn::Sub']
        : source.PhysicalName;
    }

    if (template && target.Type === 'dockerTask') {
      const targetTemplate = template.Resources[target.Id];
      if (
        targetTemplate.Metadata &&
        targetTemplate.Metadata.cfnVirtualNetworkData
      ) {
        this.context.targetVpcConfig = cloneDeep(
          targetTemplate.Metadata.cfnVirtualNetworkData,
        );
      } else {
        this.context.targetVpcConfig = 'default';
      }
    }

    if (source.VirtualEventSourceFunctionId) {
      this.context.virtualEventSourceFunctionId =
        source.VirtualEventSourceFunctionId;
    }

    if (this.properties.Format === 'serverless' && target.Type === 'function') {
      this.context.serverlessFunctionId = target.Settings.Name;
    }

    const definition = definitions[format].IntegrationTypes.find(
      (definition: any) =>
        definition.SourceType === source.Type &&
        definition.TargetType === target.Type &&
        definition.FacetType === facetType,
    );

    if (!definition) {
      throw new Error(
        `Failed to add integration from ${source.Id} to ${target.Id}: Integration definition does not exist`,
      );
    }

    const sourceDefinition = definitions[format].ResourceTypes[source.Type];
    for (const settingName in sourceDefinition.Settings) {
      this.context[`SOURCESETTING:${settingName}`] =
        source.Settings[settingName] ||
        cloneDeep(sourceDefinition.Settings[settingName].Default);
    }

    const targetDefinition = definitions[format].ResourceTypes[target.Type];
    for (const settingName in targetDefinition.Settings) {
      this.context[`TARGETSETTING:${settingName}`] =
        target.Settings[settingName] ||
        cloneDeep(targetDefinition.Settings[settingName].Default);
    }

    for (const settingName in definition.Settings) {
      this.context[`SETTING:${settingName}`] = cloneDeep(
        definition.Settings[settingName].Default,
      );
    }

    if (facetId) {
      this.FacetType = facetType;
      this.FacetId = facetId;

      const facet = source.Facets[facetType].find(
        (facet: any) => facet.Id === facetId,
      );

      const facetSettingSchemas =
        'FacetSettings' in sourceDefinition
          ? sourceDefinition.FacetSettings[facetType]
          : {};

      for (const settingName in facetSettingSchemas) {
        if (facet.Settings[settingName] == null) {
          const defaultValue = injectContext(
            cloneDeep(facetSettingSchemas[settingName].Default),
            this.context,
          );
          this.context[`FACETSETTING:${settingName}`] = defaultValue;
        } else {
          this.context[`FACETSETTING:${settingName}`] =
            facet.Settings[settingName];
        }
      }

      for (const [property, value] of Object.entries(facet.Properties)) {
        this.context[`FACET:${property}`] = value;
      }
    }
  }
}

export class AddIntegrationAction extends IntegrationAction {
  constructor(
    format: 'SAM' | 'serverless',
    template: any,
    source: any,
    target: any,
    options: any,
  ) {
    super(format, template, source, target, options, 'AddIntegration');
  }
}

export class UpdateIntegrationSettingAction extends IntegrationAction {
  constructor(
    format: 'serverless' | 'SAM',
    source: any,
    target: any,
    integration: any,
    settingName: any,
    value: any,
    currentValue: any,
  ) {
    const options = {
      facetType: integration.FacetType,
      facetId: integration.FacetId,
    };

    super(format, null, source, target, options, 'UpdateIntegrationSetting');

    this.properties = {
      ...this.properties,
      Setting: settingName,
      Value: value,
    };

    this.context[`SETTING:${settingName}`] = value;
    this.context.currentValue = currentValue;

    if ('IntegrationId' in integration) {
      this.context.integrationId = integration.IntegrationId;
    }
  }
}

export class DeleteIntegrationAction extends IntegrationAction {
  constructor(
    format: 'SAM' | 'serverless',
    source: any,
    target: any,
    integration: any,
  ) {
    const options = {
      facetType: integration.FacetType,
      facetId: integration.FacetId,
    };

    super(format, null, source, target, options, 'DeleteIntegration');

    if ('IntegrationId' in integration) {
      this.context.integrationId = integration.IntegrationId;
    }
  }
}

export class PutVirtualNetworkPlacementAction extends Action {
  constructor(
    format: 'serverless' | 'SAM',
    cfTemplate: any,
    resource: any,
    virtualNetwork: any,
  ) {
    super(format, 'PutVirtualNetworkPlacement');

    this.properties.ResourceType = resource.Type;

    const definition =
      definitions[format].VirtualNetworkPlacements[resource.Type];

    let subnetIds = virtualNetwork.TemplatePartial.Resources.filter(
      (resourceId: any) => {
        const resource = cfTemplate.Resources[resourceId];

        if (resource.Type !== 'AWS::EC2::Subnet') {
          return false;
        }

        if (
          (definition.DefaultSubnetTypes === 'public' &&
            resource.Properties.MapPublicIpOnLaunch) ||
          (definition.DefaultSubnetTypes === 'private' &&
            !resource.Properties.MapPublicIpOnLaunch)
        ) {
          return true;
        }

        return false;
      },
    ).map((resourceId: any) => ({ Ref: resourceId }));

    let defaultSecurityGroupId: any = {
      'Fn::GetAtt': [virtualNetwork.Id, 'DefaultSecurityGroup'],
    };

    let vpcId: any = {
      Ref: virtualNetwork.Id,
    };

    if (virtualNetwork.Settings.UseExistingResource) {
      subnetIds = subnetIds.map((subnetId: any) => {
        const subnetIdType = subnetId.Ref.replace(
          /^.*((Public|Private)Subnet\d)$/,
          '$1',
        );

        return {
          'Fn::If': [
            `${virtualNetwork.Id}UseExistingResource`,
            {
              'Fn::GetAtt': [
                `${virtualNetwork.Id}ExistingResource`,
                subnetIdType,
              ],
            },
            subnetId,
          ],
        };
      });

      defaultSecurityGroupId = {
        'Fn::If': [
          `${virtualNetwork.Id}UseExistingResource`,
          {
            'Fn::GetAtt': [
              `${virtualNetwork.Id}ExistingResource`,
              'DefaultSecurityGroup',
            ],
          },
          defaultSecurityGroupId,
        ],
      };

      vpcId = {
        'Fn::If': [
          `${virtualNetwork.Id}UseExistingResource`,
          {
            Ref: `${virtualNetwork.Id}ExistingResource`,
          },
          vpcId,
        ],
      };
    }

    this.context = {
      resourceId: resource.Id,
      vpcResourceId: virtualNetwork.Id,
      vpcId,
      subnetIds,
      defaultSecurityGroupId,
    };

    const resourceDefinition = definitions[format].ResourceTypes[resource.Type];
    const settingSchemas = resourceDefinition.Settings;

    for (const settingName in settingSchemas) {
      if (resource.Settings[settingName] == null) {
        const defaultValue = injectContext(
          cloneDeep(settingSchemas[settingName].Default),
          this.context,
        );
        this.context[`SETTING:${settingName}`] = defaultValue;
      } else {
        this.context[`SETTING:${settingName}`] = resource.Settings[settingName];
      }
    }
  }
}

export class DeleteVirtualNetworkPlacementAction extends Action {
  constructor(format: 'SAM' | 'serverless', resource: any) {
    super(format, 'DeleteVirtualNetworkPlacement');

    this.properties.ResourceType = resource.Type;

    this.context = {
      resourceId: resource.Id,
    };

    const resourceDefinition = definitions[format].ResourceTypes[resource.Type];
    const settingSchemas = resourceDefinition.Settings;

    for (const settingName in settingSchemas) {
      if (resource.Settings[settingName] == null) {
        const defaultValue = injectContext(
          cloneDeep(settingSchemas[settingName].Default),
          this.context,
        );
        this.context[`SETTING:${settingName}`] = defaultValue;
      } else {
        this.context[`SETTING:${settingName}`] = resource.Settings[settingName];
      }
    }
  }
}

const matches = (action: any, reaction: any) =>
  action.action === reaction.Action &&
  Object.keys(reaction.Conditions)
    .filter((condition) => condition !== 'ResourceSettingValues')
    .every(
      (conditionKey) =>
        action.properties[conditionKey] === reaction.Conditions[conditionKey],
    ) &&
  Object.keys(reaction.Conditions.ResourceSettingValues || {}).every(
    (setting) =>
      action.resourceSettings[setting] ===
      reaction.Conditions.ResourceSettingValues[setting],
  );

const upsert = (action: any, reaction: any, template: any) => {
  const { finalBinding, contexts } = resolveSubBindings(
    template,
    null,
    reaction,
    action.context,
  );

  let integrationId: any;
  let path: any;
  let content: any;

  for (const context of contexts) {
    content = action.properties.Value;

    if ('Template' in reaction) {
      const definitionTemplate = cloneDeep(reaction.Template);

      content = injectContext(definitionTemplate, context);
    }

    const valueTransformations = reaction.Transformations || [];

    for (const transformation of valueTransformations) {
      if (!(transformation in transformations)) {
        throw new Error(`Invalid transformation '${transformation}'`);
      }

      content = (transformations as any)[transformation](
        content,
        action.context,
      );
    }

    if (content === null) {
      query.delete(finalBinding.Path, template, null, context);
    } else {
      /* If we aren't supposed to create paths leading up to final property,
       * check if the final property exists or bail. */
      if (
        'CreatePath' in reaction &&
        !reaction.CreatePath &&
        query.nodes(finalBinding.Path, template, null, context).length === 0
      ) {
        continue;
      }

      query.update(finalBinding.Path, template, null, content, context);

      const primaryPath = injectContext(finalBinding.Path, context);
      const primaryNode = jp.nodes(template, primaryPath, 1)[0];
      if (primaryNode) {
        integrationId = primaryNode.path[primaryNode.path.length - 1];
        path = primaryNode.path;
      }
    }
  }

  // This only reports the last injected content, integrationId, and path
  return {
    type: reaction.Type,
    object: content,
    integrationId,
    path,
  };
};

const append = (action: any, reaction: any, template: any) => {
  if (
    action.action === 'UpdateResourceSetting' &&
    action.properties.Value === action.context.currentValue
  ) {
    return {
      type: reaction.Type,
      object: null,
      integrationId: undefined,
    };
  }

  const { finalBinding, contexts } = resolveSubBindings(
    template,
    null,
    reaction,
    action.context,
  );

  let content = action.properties.Value;

  if ('Template' in reaction) {
    const definitionTemplate = cloneDeep(reaction.Template);

    content = injectContext(definitionTemplate, action.context);
  }

  let integrationId;

  for (const context of contexts) {
    const currentValue = query.value(
      finalBinding.Path,
      template,
      null,
      context,
    );

    if (Array.isArray(currentValue)) {
      if (
        reaction.IfNotExists &&
        currentValue.some((value) => deepEqual(value, content))
      ) {
        return {
          type: reaction.Type,
          object: null,
          integrationId: undefined,
        };
      }

      integrationId = currentValue.length;
      currentValue.push(content);
    } else {
      integrationId = 0;
      query.update(finalBinding.Path, template, null, [content], context);
    }
  }

  return {
    type: reaction.Type,
    object: content,
    integrationId,
  };
};

const renameKey = (action: any, reaction: any, template: any) => {
  const { finalBinding, contexts } = resolveSubBindings(
    template,
    null,
    reaction,
    action.context,
  );

  for (const context of contexts) {
    const currentValue = query.value(
      finalBinding.Path,
      template,
      null,
      context,
    );

    if (reaction.FromKey in currentValue) {
      currentValue[reaction.ToKey] = currentValue[reaction.FromKey];
      delete currentValue[reaction.FromKey];
    }
  }

  return {
    type: reaction.Type,
  };
};

const del = (action: any, reaction: any, template: any) => {
  const { finalBinding, contexts } = resolveSubBindings(
    template,
    null,
    reaction,
    action.context,
  );

  for (const context of contexts) {
    query.delete(finalBinding.Path, template, null, context);
  }

  return {
    type: reaction.Type,
  };
};
