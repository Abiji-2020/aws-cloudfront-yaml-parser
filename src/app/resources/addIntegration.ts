import cloneDeep from 'clone-deep';
import jp from 'jsonpath';
import * as definitions from './definitions';
import * as manageCFResources from './manageCFResources';
import Integration from './integration';
import * as query from './query';
import dispatch, { AddIntegrationAction } from './dispatch';
import { addReferencePermissions } from './addReference';

export default function addIntegration(
  this: any,
  sourceResourceId: any,
  targetResourceId: any,
  facetType: any,
  facetId: any,
) {
  const { error } = canAddIntegration(
    this,
    sourceResourceId,
    targetResourceId,
    facetType,
    facetId,
  );
  if (error) {
    throw error;
  }

  const source = this.resources[sourceResourceId];
  const target = this.resources[targetResourceId];
  const integrationResourceId = getIntegrationId(source.Id, target.Id, null);

  const definition = definitions[
    this.format as 'SAM' | 'serverless'
  ].IntegrationTypes.find((definition: any) => {
    return (
      definition.SourceType === source.Type &&
      definition.TargetType === target.Type &&
      definition.FacetType === facetType
    );
  });

  if (!definition) {
    throw new Error(
      `Failed to add integration from ${sourceResourceId} to ${targetResourceId}: Integration definition does not exist`,
    );
  }

  this.reparseRequired = definition.ReparseRequired;

  const context: any = {
    integrationId: integrationResourceId,
    sourceId: sourceResourceId,
    sourcePhysicalName:
      source.PhysicalName && source.PhysicalName['Fn::Sub']
        ? source.PhysicalName['Fn::Sub']
        : source.PhysicalName,
    targetId: targetResourceId,
  };

  if (this.format === 'serverless' && target.Type === 'function') {
    context.serverlessFunctionId = target.Settings.Name;
  }

  for (const settingName in definition.Settings) {
    context[`SETTING:${settingName}`] = cloneDeep(
      definition.Settings[settingName].Default,
    );
  }

  let facet;
  if (facetId) {
    facet = source.Facets[facetType].find((facet: any) => facet.Id === facetId);

    const facetProperties = facet.Properties;

    for (const key in facetProperties) {
      context[`FACET:${key}`] = facetProperties[key];
    }
  }

  const sourceDefinition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[source.Type];
  for (const settingName in sourceDefinition.Settings) {
    context[`SOURCESETTING:${settingName}`] =
      source.Settings[settingName] ||
      cloneDeep(sourceDefinition.Settings[settingName].Default);
  }

  const targetDefinition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[target.Type];
  for (const settingName in targetDefinition.Settings) {
    context[`TARGETSETTING:${settingName}`] =
      target.Settings[settingName] ||
      cloneDeep(targetDefinition.Settings[settingName].Default);
  }

  if (sourceDefinition.IsVirtualEventSource) {
    if (source.VirtualEventSourceFunctionId) {
      throw new Error(
        `Failed to add integration from ${sourceResourceId} to ${targetResourceId}: Virtual source resource already used as source for another resource already exists`,
      );
    }

    source.VirtualEventSourceFunctionId = targetResourceId;
  }

  let path;

  if ('ExclusiveResources' in definition) {
    for (const path of definition.ExclusiveResources) {
      const nodes = query.nodes(path, this.template, null, context);

      for (const node of nodes) {
        const logicalId = node.value;

        for (const resource of [source, facet, target]) {
          if (resource.TemplatePartial.Resources.includes(logicalId)) {
            resource.TemplatePartial.Resources.splice(
              resource.TemplatePartial.Resources.indexOf(logicalId),
              1,
            );
          }
        }

        if (!manageCFResources.isResourceOwned(this, logicalId)) {
          delete this.cfTemplate().Resources[logicalId];
        }
      }
    }
  }

  const action = new AddIntegrationAction(
    this.format,
    this.template,
    source,
    target,
    { facetType, facetId },
  );

  const dispatchResults: any = dispatch(action, this.template);

  if (source.Settings.UseExistingResource) {
    manageCFResources.updateExistingResourceConditions(
      this.template,
      source,
      true,
    );
  }

  const integration = new Integration(
    this.format,
    definition,
    this.template,
    this.resources,
    { source, target, path, facetId, object: dispatchResults[0].object },
  );

  if (dispatchResults[0].integrationId !== undefined) {
    integration.IntegrationId = dispatchResults[0].integrationId;
  }

  this.integrations.push(integration);

  manageCFResources.updateOwnership(this, integration, dispatchResults);
  manageCFResources.cleanupTemplate(this);

  if (sourceDefinition.IsVirtualEventSource) {
    /* Update name bindings for virtual event sources now that the integration
     * exists */
    if (source.Settings.Name) {
      this.updateResourceSetting(
        sourceResourceId,
        'Name',
        source.Settings.Name,
      );
    }

    for (const settingValue of Object.values(source.Settings)) {
      const cfValue = cloneDeep(settingValue);
      manageCFResources.updateParameterValues(cfValue, this, true);
    }
  }

  if (targetDefinition.IsVirtualEventTarget) {
    const nodes = jp.nodes(this.template, targetDefinition.Locator);

    for (const node of nodes) {
      const resourceId = node.path[node.path.length - 1];

      if (integration.TemplatePartial.Resources.includes(resourceId)) {
        (integration as any).VirtualEventTargetResourceId = resourceId;
        break;
      }
    }
  }

  if (source.Type === 'stateMachine') {
    addReferencePermissions.call(this, sourceResourceId, targetResourceId);
  }

  manageCFResources.updateDefaultParameters(this.template);
}

export function canBeginIntegrationFrom(
  state: any,
  resourceId: any,
  facetType: any,
  facetId: any,
) {
  if (!(resourceId in state.resources)) {
    return {
      isValidIntegration: false,
      error: new Error(
        `Failed to begin integration from ${resourceId}: ${resourceId} does not exist in state`,
      ),
    };
  }

  const resource = state.resources[resourceId];

  const existingIntegrationCount = state.integrations.filter(
    (integration: any) =>
      integration.Source.ResourceId === resourceId &&
      (!facetId || integration.FacetId === facetId),
  ).length;

  if (facetId && existingIntegrationCount > 0) {
    return {
      isValidIntegration: false,
      error: new Error('Facets cannot be connected to more than one resource'),
    };
  }

  const maximumFromSource =
    definitions[state.format as 'SAM' | 'serverless'].ResourceTypes[
      resource.Type
    ].MaximumFromSource || Infinity;

  if (existingIntegrationCount >= maximumFromSource) {
    return {
      isValidIntegration: false,
      error: new Error(
        `${resource.Type} cannot be connected to more than ${maximumFromSource} resource(s)`,
      ),
    };
  }

  return { isValidIntegration: true };
}

export function canAddIntegration(
  state: any,
  sourceResourceId: any,
  targetResourceId: any,
  facetType: any,
  facetId: any,
) {
  if (!(sourceResourceId in state.resources)) {
    return {
      isValidIntegration: false,
      error: new Error(
        `Failed to add integration from ${sourceResourceId} to ${targetResourceId}: ${sourceResourceId} does not exist in state`,
      ),
    };
  }

  if (!(targetResourceId in state.resources)) {
    return {
      isValidIntegration: false,
      error: new Error(
        `Failed to add integration from ${sourceResourceId} to ${targetResourceId}: ${targetResourceId} does not exist in state`,
      ),
    };
  }

  const source = state.resources[sourceResourceId];
  const target = state.resources[targetResourceId];

  const definition = definitions[
    state.format as 'SAM' | 'serverless'
  ].IntegrationTypes.find((definition: any) => {
    return (
      definition.SourceType === source.Type &&
      definition.TargetType === target.Type &&
      definition.FacetType === facetType
    );
  });

  if (!definition) {
    return {
      isValidIntegration: false,
      error: new Error(
        `Failed to add integration from ${sourceResourceId} to ${targetResourceId}: No integration definition found from ${source.Type} types to ${target.Type} types with facet type ${facetType}`,
      ),
    };
  }

  const integrationResourceId = getIntegrationId(source.Id, target.Id, facetId);

  if (integrationResourceId in state.resources) {
    return {
      isValidIntegration: false,
      error: new Error(
        `Failed to add integration from ${sourceResourceId} to ${targetResourceId}: Integration resource ${integrationResourceId} already exists`,
      ),
    };
  }

  const existingIntegrations = state.integrations.filter(
    (integration: any) =>
      integration.Source.ResourceId === source.Id &&
      (!facetId || integration.FacetId === facetId),
  );

  if (facetId && existingIntegrations.length > 0) {
    return {
      isValidIntegration: false,
      error: new Error('Facets cannot be connected to more than one resource'),
    };
  }

  const maximumFromSource =
    definitions[state.format as 'SAM' | 'serverless'].ResourceTypes[source.Type]
      .MaximumFromSource || Infinity;

  if (existingIntegrations.length >= maximumFromSource) {
    return {
      isValidIntegration: false,
      error: new Error(
        `${source.Type} cannot be connected to more than ${maximumFromSource} ${target.Type}`,
      ),
    };
  }

  return { isValidIntegration: true };
}

const getIntegrationId = (sourceId: any, targetId: any, facetId: any) =>
  `${facetId || sourceId}To${targetId}`;
