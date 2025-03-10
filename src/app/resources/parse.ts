import * as definitions from './definitions';
import jp from 'jsonpath';
import Resource from './resource';
import deepEqual from 'deep-equal';
import resolveSubBindings from './resolveSubBindings';
import * as query from './query';

const WEAK_OWNERS = ['AWS::EC2::VPC'];

export default (
  template: { [key: string]: any },
  format: 'SAM' | 'serverless',
  isDeployView: boolean,
) => {
  const resources: { [key: string]: any } = {};
  const integrations: { [key: string]: any } = {};
  const owners: { [key: string]: any } = {};
  const formatDefinitions = definitions[format];

  for (const resourceType in formatDefinitions.ResourceTypes) {
    const definition = formatDefinitions.ResourceTypes[resourceType];

    if (!('Locator' in definition)) {
      continue;
    }

    if (definition.DeployViewOnly && !isDeployView) {
      continue;
    }

    const nodes = jp.nodes(template, definition.Locator);

    for (const node of nodes) {
      let resource: any;
      if (definition.IsVirtualEventSource) {
        const prefix = resourceType[0].toUpperCase() + resourceType.slice(1);

        const virtualInfo: {
          VirtualEventSourceFunctionId?: any;
          VirtualEventSourceName?: any;
        } = {};

        let i = 0;
        let resourceId;
        do {
          i++;
          resourceId = i === 1 ? `${prefix}` : `${prefix}${i}`;
        } while (resourceId in resources);

        if (format === 'SAM') {
          virtualInfo.VirtualEventSourceFunctionId = node.path[2];
          virtualInfo.VirtualEventSourceName = node.path[5];
        } else {
          virtualInfo.VirtualEventSourceFunctionId = node.path[2];
          virtualInfo.VirtualEventSourceName = node.path[4].toString();
        }

        resource = new Resource(
          format,
          resourceType,
          template,
          resourceId,
          node.value,
          undefined,
        );
        if (
          Object.values(resources).some((otherResource) =>
            deepEqual((resource as any).Settings, otherResource.Settings),
          )
        ) {
          continue;
        }
      } else {
        resource = new Resource(
          format,
          resourceType,
          template,
          node.path,
          node.value,
          undefined,
        );

        if (definition.IDConstraint) {
          const regex = new RegExp(definition.IDConstraint);

          if (!regex.test(resource.Id)) {
            continue;
          }
        }

        for (const resourceId of resource.TemplatePartial.Resources) {
          owners[resourceId] = {
            type: 'Resource',
            resourceId: resource.Id,
            isIntegration: false,
          };
        }

        for (const facetType in resource.Facets) {
          for (const facet of resource.Facets[facetType]) {
            for (const resourceId of facet.TemplatePartial.Resources) {
              owners[resourceId] = {
                type: 'Facet',
                resourceId: resource.Id,
                facetType: facetType,
                facetId: facet.Id,
                isIntegration: false,
              };
            }
          }
        }

        // Coalesce singleton resource settings (e.g. implicitApi routes)
        if (
          resource.Id in resources &&
          resource.Type === resources[resource.Id].Type
        ) {
          const originalResource = resources[resource.Id];

          for (const settingName in originalResource.Settings) {
            const originalValue = originalResource.Settings[settingName];
            const newValue = resource.Settings[settingName];

            if (Array.isArray(originalValue) && Array.isArray(newValue)) {
              Array.prototype.push.apply(originalValue, newValue);
            }
          }

          for (const facetType in resource.Facets || {}) {
            originalResource.Facets = originalResource.Facets || {};

            originalResource.Facets[facetType] = (
              originalResource.Facets[facetType] || []
            ).concat(resource.Facets[facetType]);
          }

          continue;
        }
      }

      resources[resource.Id] = resource;
    }
  }

  for (const definition of formatDefinitions.IntegrationTypes) {
    const { finalBinding, contexts } = resolveSubBindings(
      template,
      null,
      definition.Locator,
    );

    for (const context of contexts) {
      const nodes = query.nodes(finalBinding.Path, template, null, context);

      for (const node of nodes) {
        try {
          (context as any).key = node.path[node.path.length - 1];
          (context as any).value = node.value;

          const integration = new Integration(
            format,
            definition,
            template,
            resources,
            { path: node.path, object: node.value, context },
          );
          integrations[integration.Id] = integration;

          for (const resourceId of integration.TemplatePartial.Resources) {
            owners[resourceId] = {
              integrationId: integration.Id,
              isIntegration: true,
            };
          }

          owners[integration.Id] = {
            integrationId: integration.Id,
            isIntegration: true,
          };
        } catch (err) {
          if (err.code !== INTEGRATION_ERROR_CODES.integrationTypeInvalid) {
            throw err;
          }
        }
      }
    }
  }

  const cfTemplate =
    format === 'serverless' ? template.resources || {} : template;

  const relationships = calculateRelationships(template, format, resources);

  for (const logicalId in cfTemplate.Resources) {
    const resource = cfTemplate.Resources[logicalId];

    if (!(logicalId in owners) && relationships[logicalId].size === 0) {
      const stackeryResource = new Resource(
        format,
        null,
        template,
        logicalId,
        resource,
      );
      resources[stackeryResource.Id] = stackeryResource;
    }
  }

  const unownedResources = [];
  for (const logicalId in cfTemplate.Resources) {
    if (!(logicalId in owners)) {
      unownedResources.push(logicalId);
    }
  }

  for (
    let forceConversion = false,
      remainingResourceCount = unownedResources.length;
    remainingResourceCount > 0;
    forceConversion = remainingResourceCount === unownedResources.length,
      remainingResourceCount = unownedResources.length
  ) {
    log(
      `\n\n===================================================================`,
    );
    log(
      `parse: remaining unowned resources: ${unownedResources.length}: ${JSON.stringify(unownedResources)}`,
    );
    log(
      `parse: owned resources: ${Object.keys(owners).length}: ${JSON.stringify(Object.keys(owners))}`,
    );
    log(
      `parse: num resources: ${Object.keys(resources).length}: ${JSON.stringify(Object.keys(resources))}`,
    );
    log(`===================================================================`);
    if (forceConversion) {
      const firstLogicalId = unownedResources.shift();

      log(`parse: Forcing Conversion: ${firstLogicalId}`);
      mergeResources(
        format,
        template,
        resources,
        integrations,
        firstLogicalId,
        owners,
        relationships,
      );

      continue;
    }

    for (const i in unownedResources) {
      const logicalId = unownedResources[i];
      const referencedResources = new Set();
      let resolvedAllReferences = true;

      for (const relationship of relationships[logicalId]) {
        if (relationship in owners) {
          referencedResources.add(owners[relationship]);
        } else {
          resolvedAllReferences = false;
          break;
        }
      }

      if (!resolvedAllReferences) {
        continue;
      }

      mergeResources(
        format,
        template,
        resources,
        integrations,
        logicalId,
        owners,
        relationships,
      );

      unownedResources.splice(i, 1);
      break;
    }
  }

  // Since rules are directional, the order in which resources are evaluated can have an impact on grouping
  // Thus, we need to go through all custom resources one more time to see if they can be be grouped with other resources
  let mergeOccured;
  let customResources;
  do {
    mergeOccured = false;
    customResources = Object.keys(resources).filter(
      (resourceId) => resources[resourceId].Type === 'custom',
    );

    customResources.forEach((customResourceId) => {
      // eslint-disable-line no-loop-func
      log(
        `\n\nparse: customResource ${customResourceId}: Checking if this custom resource can be merged with another resource`,
      );
      const customResource = resources[customResourceId];
      log(
        `parse: customResource ${customResourceId}: Contains: ${JSON.stringify(customResource.TemplatePartial.Resources)}`,
      );

      let mergeTargetId;
      customResource.TemplatePartial.Resources.some((resourceId) => {
        const resourceReferences = [...relationships[resourceId]];
        log(
          `parse: customResource ${customResourceId}: resource ${resourceId}: references ${JSON.stringify(resourceReferences)}`,
        );
        mergeTargetId = resourceReferences.find((targetId) => {
          return (
            owners[targetId].resourceId !== customResourceId &&
            isAllowedGrouping(
              resourceId,
              targetId,
              owners,
              integrations,
              resources,
              template,
              format,
            )
          );
        });

        if (mergeTargetId) {
          log(
            `parse: customResource ${customResourceId}: can be merged with ${mergeTargetId} because of ${resourceId}`,
          );
        }
        return !!mergeTargetId;
      });

      if (mergeTargetId) {
        const mergeTargetOwnerId = owners[mergeTargetId].resourceId;
        log(
          `parse: customResource ${customResourceId}: merging into ${mergeTargetOwnerId} (which owns ${mergeTargetId})`,
        );
        for (const ownedResourceId of resources[customResourceId]
          .TemplatePartial.Resources) {
          if (
            !resources[mergeTargetOwnerId] ||
            ownedResourceId === mergeTargetOwnerId
          ) {
            log(
              `\n\nWARNING: parse: customResource ${customResourceId}: Skipping Merge - ${!resources[mergeTargetOwnerId]} ${ownedResourceId === mergeTargetOwnerId}\n\n`,
            );
            continue;
          }
          log(
            `parse: customResource ${customResourceId}: adding ${ownedResourceId} into ${mergeTargetOwnerId}`,
          );
          resources[mergeTargetOwnerId].addCFResource(
            cfTemplate,
            ownedResourceId,
            'Resource',
            resources[ownedResourceId],
          );
          owners[ownedResourceId] = owners[mergeTargetId];
        }
        delete resources[customResourceId];

        mergeOccured = true;
      }
    });
  } while (mergeOccured && customResources.length > 0);

  // Hide Custom Resource for deployment marker - this should only occur for non SAM framework stacks (ie, sls/raw cloudformation)
  const customResourceDeploymentMarkerTag = Object.keys(resources).filter(
    (resourceId) =>
      resources[resourceId].Type === 'custom' &&
      resourceId.startsWith('DeploymentMarkerTag'),
  );
  if (customResourceDeploymentMarkerTag) {
    log(
      `parse: customResource ${customResourceDeploymentMarkerTag} - Found custom resource for Deployment Marker Tag, removing`,
    );
    delete resources[customResourceDeploymentMarkerTag];
  }

  // See if any non-custom resource can group with custom resources
  const nonCustomResources = Object.keys(resources).filter(
    (resourceId) => resources[resourceId].Type !== 'custom',
  );
  nonCustomResources.forEach((nonCustomResourceId) => {
    const nonCustomResource = resources[nonCustomResourceId];
    if (!nonCustomResource) {
      return;
    }
    log(
      `\n\nparse: nonCustomResource ${nonCustomResourceId} (${nonCustomResource.Type}): Checking if this resource can own other custom resources`,
    );

    nonCustomResource.TemplatePartial.Resources.forEach((resourceId) => {
      if (!relationships[resourceId]) {
        return;
      }
      const resourceReferences = [...relationships[resourceId]];
      log(
        `parse: nonCustomResource ${nonCustomResourceId}: resource ${resourceId}: references: ${resourceReferences}`,
      );
      resourceReferences.forEach((targetId) => {
        let targetOwner = owners[targetId];
        let targetOwnerId = targetOwner.resourceId;

        if (
          targetOwnerId &&
          resources[targetOwnerId].Type === 'custom' &&
          isAllowedGrouping(
            resourceId,
            targetId,
            owners,
            integrations,
            resources,
            template,
            format,
          )
        ) {
          // TODO: Refactor
          log(
            `parse: nonCustomResource ${nonCustomResourceId}: resource ${resourceId}: merging custom resource ${targetOwnerId} (which owns ${targetId})`,
          );
          for (const ownedResourceId of resources[targetOwnerId].TemplatePartial
            .Resources) {
            if (
              !resources[targetOwnerId] ||
              ownedResourceId === nonCustomResourceId
            ) {
              log(
                `\n\nWARNING: parse: nonCustomResource ${nonCustomResourceId}: resource ${resourceId}: Skipping Merge - ${!resources[targetOwnerId]} ${ownedResourceId === nonCustomResourceId}\n\n`,
              );
              continue;
            }
            log(
              `parse: nonCustomResource ${nonCustomResourceId}: resource ${resourceId}: adding ${ownedResourceId}`,
            );
            resources[nonCustomResourceId].addCFResource(
              cfTemplate,
              ownedResourceId,
              'Resource',
              resources[ownedResourceId],
            );
            owners[ownedResourceId] = owners[nonCustomResourceId];
          }
          delete resources[targetOwnerId];
        }
      });
    });
  });

  const parameters = parseParameters(cfTemplate);

  for (const resourceId in resources) {
    const resource = resources[resourceId];

    for (const settingName in resource.Settings) {
      resource.Settings[settingName] = updateSettingParameters(
        resource.Settings[settingName],
        cfTemplate,
      );
    }
  }

  /* For integrations to virtual targets, find the resource ID of the target
   * CF resource we would need to update if there are any settings changes. */
  for (const integration of Object.values(integrations)) {
    const targetDefinition =
      definitions[format].ResourceTypes[integration.TargetType];
    if (targetDefinition.IsVirtualEventTarget) {
      const nodes = jp.nodes(template, targetDefinition.Locator);

      for (const node of nodes) {
        const resourceId = node.path[node.path.length - 1];

        if (integration.TemplatePartial.Resources.includes(resourceId)) {
          integration.VirtualEventTargetResourceId = resourceId;
          break;
        }
      }

      if (!integration.VirtualEventTargetResourceId) {
        throw new Error(
          `Failed to find virtual event target resource Id for integration from ${integration.Source.ResourceId} to ${integration.Target.ResourceId}`,
        );
      }
    }
  }

  const references = parseReferences(resources, template);
  const permissions = parsePermissions(
    resources,
    cfTemplate,
    format,
    references,
  );
  const customResourceReferences = parseCustomReferences(
    resources,
    owners,
    integrations,
    template,
    format,
  );
  const virtualNetworkPlacements = parseVirtualNetworkPlacements(
    resources,
    template,
    format,
  );

  return {
    template: template,
    resources: resources,
    integrations: Object.values(integrations) || [],
    virtualNetworkPlacements: virtualNetworkPlacements,
    references,
    permissions,
    parameters: parameters,
    customResourceReferences,
  };
};
