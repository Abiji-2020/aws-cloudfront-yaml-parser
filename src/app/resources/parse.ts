import * as definitions from './definitions';
import jp from 'jsonpath';
import Resource from './resource';
import deepEqual from 'deep-equal';
import resolveSubBindings from './resolveSubBindings';
import * as query from './query';
import Integration, {
  ERROR_CODES as INTEGRATION_ERROR_CODES,
} from './integration';
import { serverlessCFId } from './resource';
import Id, { isPhysicalNameInIdObject } from './id';
import { DEFAULT_PARAMETERS } from './manageCFResources';
import Parameter from './parameter';
import updateReferences from './updateReferences';
import isComputeResource from '../utils/isComputeResource';
import Permission, {
  parsePermissionsFromFunctionOrStateMachine,
} from './permission';
import getCustomReferences from './getCustomReferences';
import VirtualNetworkPlacement, {
  ERROR_CODES as VPC_ERROR_CODES,
} from './virtualNetworkPlacement';
import getGroupingRules from './getGrouptingRules';
const WEAK_OWNERS = ['AWS::EC2::VPC'];

export default (
  template: any,
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
        } catch (err: any) {
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

    if (
      !(logicalId in owners) &&
      (relationships as any)[logicalId].size === 0
    ) {
      const cfnResource = new Resource(
        format,
        null,
        template,
        logicalId,
        resource,
        undefined,
      );
      resources[cfnResource.Id] = cfnResource;
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

      for (const relationship of (relationships as any)[logicalId]) {
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

      unownedResources.splice(i as any, 1);
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
      customResource.TemplatePartial.Resources.some((resourceId: any) => {
        const resourceReferences = [...(relationships as any)[resourceId]];
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
    delete resources[customResourceDeploymentMarkerTag as any];
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

    nonCustomResource.TemplatePartial.Resources.forEach((resourceId: any) => {
      if (!(relationships as any)[resourceId]) {
        return;
      }
      const resourceReferences = [...(relationships as any)[resourceId]];
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

const calculateRelationships = (
  template: any,
  format: any,
  locatedResources: any,
) => {
  const relationships = {};
  const cfTemplate =
    format === 'serverless' ? template.resources || {} : template;

  let resourceIds =
    (cfTemplate.Resources && Object.keys(cfTemplate.Resources)) || [];
  if (format === 'serverless') {
    for (const fn in template.functions || {}) {
      resourceIds.push(serverlessCFId('function', fn));
    }
  }

  for (const logicalId in cfTemplate.Resources) {
    const _resourceReferences = resourceReferences(
      cfTemplate.Resources[logicalId],
      resourceIds,
      locatedResources,
    );

    (relationships as any)[logicalId] =
      (relationships as any)[logicalId] || new Set();

    for (const relationship of _resourceReferences) {
      (relationships as any)[logicalId].add(relationship);

      (relationships as any)[relationship as any] =
        (relationships as any)[relationship as any] || new Set();
    }
  }

  return relationships;
};

const resourceReferences = (
  object: any,
  resourceIds: any,
  locatedResources: any,
) => {
  const references = new Set();

  /* Look for references based on physical resource names. This is important for
   * things like S3 Bucket integrations that require permissions to be set
   * before the integration is created. That means the permission must not use a
   * hard dependency on the S3 Bucket, it must hard-code the bucket's physical
   * name. */
  for (const resource of Object.values(locatedResources)) {
    if (
      'PhysicalName' in (resource as any) &&
      isPhysicalNameInIdObject(object, (resource as any).PhysicalName)
    ) {
      references.add((resource as any).Id);
    }
  }

  if (typeof object !== 'object' || object === null) {
    return references;
  }

  if ('Ref' in object && resourceIds.includes(object.Ref)) {
    references.add(object.Ref);
  } else if (
    'Fn::GetAtt' in object &&
    resourceIds.includes(object['Fn::GetAtt'][0])
  ) {
    references.add(object['Fn::GetAtt'][0]);
  } else if ('Fn::Sub' in object) {
    const pattern = Array.isArray(object['Fn::Sub'])
      ? object['Fn::Sub'][0]
      : object['Fn::Sub'];
    const varsRE = new RegExp('[$#]\\{([^.}]+)(\\.[^}]+)?\\}', 'g');

    for (
      let match = varsRE.exec(pattern);
      match;
      match = varsRE.exec(pattern)
    ) {
      const varName = match[1];

      if (resourceIds.includes(varName)) {
        references.add(varName);
      }
    }

    if (Array.isArray(object['Fn::Sub'])) {
      for (const reference of resourceReferences(
        object['Fn::Sub'][1],
        resourceIds,
        locatedResources,
      )) {
        references.add(reference);
      }
    }
  } else {
    for (const key in object) {
      /* Filter out DependsOn CF resource properties. These aren't strong enough
       * relationships to group resources together. */
      if (key === 'DependsOn') {
        continue;
      }

      /* Filter out compute environment references to other resources. These
       * should not cause resource grouping. */
      if (key === 'Environment') {
        continue;
      }

      for (const reference of resourceReferences(
        object[key],
        resourceIds,
        locatedResources,
      )) {
        references.add(reference);
      }
    }
  }
  return references;
};

const parseVirtualNetworkPlacements = (
  resources: any,
  template: any,
  format: 'SAM' | 'serverless',
) => {
  const virtualNetworkPlacements = {};

  const formatDefinitions = definitions[format];

  for (const resourceType in formatDefinitions.VirtualNetworkPlacements) {
    const definition = formatDefinitions.VirtualNetworkPlacements[resourceType];
    const nodes = jp.nodes(template, definition.Locator);

    for (const node of nodes) {
      let resourceId;

      if (definition.ResourceIndex) {
        let index = definition.ResourceIndex;

        /* Serverless framework non-functions resources are nested one level
         * under the top-level 'resources' key. */
        if (format === 'serverless' && resourceType !== 'function') {
          index++;
        }

        resourceId = node.path[index];
      } else if (definition.ResourcePath) {
        resourceId = query.value(
          definition.ResourcePath,
          template,
          node.value,
          {},
        );
      } else {
        throw new Error(
          `Bad virtual network placement definition for ${definition.ResourceType}: Locator.ResourceIndex or Locator.ResourcePath must be defined`,
        );
      }

      if (format === 'serverless' && resourceType === 'function') {
        resourceId = serverlessCFId('function', resourceId);
      }

      try {
        (virtualNetworkPlacements as any)[resourceId] =
          new VirtualNetworkPlacement(
            format,
            definition,
            template,
            resources,
            node.value,
          );
      } catch (err) {
        // For default VPC and unknown VPCs simply act like the resource isn't placed inside a VPC
        if (
          (err as any).code !== VPC_ERROR_CODES.DEFAULT_VPC_PLACEMENT &&
          (err as any).code !== VPC_ERROR_CODES.UNKNOWN_VPC_PLACEMENT
        ) {
          throw err;
        }
      }
    }
  }

  return virtualNetworkPlacements;
};

export const log = (msg: string) => {
  if (console.debug) {
    console.debug(msg);
  } else if (true) {
    console.log(msg);
  }
};

const mergeResources = (
  format: 'SAM' | 'serverless',
  template: any,
  resources: any,
  integrations: any,
  logicalId: any,
  owners: any,
  references: any,
) => {
  const cfTemplate = format === 'SAM' ? template : template.resources || {};

  // resourceReferences is the list of resources that reference this resource(logicalId)
  const resourceReferences = [...references[logicalId]];
  log(`\n\nmergeResources: ${logicalId}: Start`);
  log(
    `mergeResources: ${logicalId}: references ${JSON.stringify(resourceReferences)}`,
  );

  const resourceReferencesOwners = resourceReferences
    .filter((resourceId) => resourceId in owners)
    .map((resourceId) => owners[resourceId].resourceId);
  log(
    `mergeResources: ${logicalId}: owner references ${JSON.stringify(resourceReferencesOwners)}`,
  );

  const unownedReferencedResourceIds = resourceReferences.filter(
    (resourceId) => !(resourceId in owners),
  );

  let integrationIds = resourceReferences.filter((resourceId) => {
    const owner = owners[resourceId];
    if (owner && owner.isIntegration) {
      log(
        `mergeResources: ${logicalId}: references ${resourceId} which is owned by an integration: ${owner.isIntegration}: ${JSON.stringify(owner)}`,
      );
    }
    return (
      owner &&
      owner.isIntegration &&
      isAllowedGrouping(
        logicalId,
        resourceId,
        owners,
        integrations,
        resources,
        template,
        format,
      )
    );
  });

  Object.keys(integrations).forEach((integrationId) => {
    const integration = integrations[integrationId];
    log(
      `mergeResources: Checking integration ${integrationId} (Source: ${integration.Source.ResourceId}, Target: ${integration.Target.ResourceId})`,
    );
    if (
      resourceReferencesOwners.includes(integration.Source.ResourceId) &&
      resourceReferencesOwners.includes(integration.Target.ResourceId)
    ) {
      if (
        isAllowedGrouping(
          logicalId,
          integrationId,
          owners,
          integrations,
          resources,
          template,
          format,
        )
      ) {
        integrationIds.push(integrationId);
      }
    }
  });

  let nonCustomReferencedResourceIds = resourceReferences.filter((targetId) => {
    const owner = owners[targetId];
    if (
      owner &&
      !owner.isIntegration &&
      resources[owner.resourceId].Type !== 'custom'
    ) {
      log(
        `mergeResources: ${logicalId}: nonCustomReferencedResource: ${JSON.stringify(owner)}`,
      );
    }
    return (
      owner &&
      !owner.isIntegration &&
      resources[owner.resourceId].Type !== 'custom' &&
      isAllowedGrouping(
        logicalId,
        targetId,
        owners,
        integrations,
        resources,
        template,
        format,
      )
    );
  });

  const customReferencedResourceIds = resourceReferences.filter((targetId) => {
    const owner = owners[targetId];
    if (
      owner &&
      !owner.isIntegration &&
      resources[owner.resourceId].Type === 'custom'
    ) {
      log(
        `mergeResources: ${logicalId}: customReferencedResource: ${JSON.stringify(owner)}`,
      );
    }
    return (
      owner &&
      !owner.isIntegration &&
      resources[owner.resourceId].Type === 'custom' &&
      isAllowedGrouping(
        logicalId,
        targetId,
        owners,
        integrations,
        resources,
        template,
        format,
      )
    );
  });

  log(
    `mergeResources: ${logicalId}: integrationIds: ${JSON.stringify(integrationIds)}`,
  );
  log(
    `mergeResources: ${logicalId}: nonCustomReferencedResourceIds: ${JSON.stringify(nonCustomReferencedResourceIds)}`,
  );
  log(
    `mergeResources: ${logicalId}: customReferencedResourceIds: ${JSON.stringify(customReferencedResourceIds)}`,
  );

  /* Convert to a custom resource if:
   *
   * * No references refer to an already-parsed Cfn resource OR
   * * The only references are to not-parsed-yet CF resources and weak owner
   *   resources (e.g. VPCs)
   *
   * Many of these custom resources will end up being merged back into other
   * non-custom Cfn resources later on.
   */
  if (
    nonCustomReferencedResourceIds.length +
      customReferencedResourceIds.length +
      integrationIds.length ===
      0 ||
    (customReferencedResourceIds.length === 0 &&
      unownedReferencedResourceIds.length > 0 &&
      nonCustomReferencedResourceIds.every((resourceId) =>
        WEAK_OWNERS.includes(cfTemplate.Resources[resourceId].Type),
      ))
  ) {
    const CfnResource = new Resource(
      format,
      null,
      template,
      logicalId,
      cfTemplate.Resources[logicalId],
      undefined,
    );
    resources[CfnResource.Id] = CfnResource;

    log(
      `mergeResources: ${logicalId}: converting ${logicalId} to a custom resorce: ${CfnResource.Id}`,
    );

    owners[CfnResource.Id] = {
      type: 'Resource',
      resourceId: CfnResource.Id,
      isIntegration: false,
    };

    return;
  }

  let mergeIds;
  let source = resources;
  if (integrationIds.length > 0) {
    mergeIds = integrationIds;
    source = integrations;
  } else if (nonCustomReferencedResourceIds.length > 0) {
    mergeIds = nonCustomReferencedResourceIds;
  } else {
    mergeIds = customReferencedResourceIds;
  }
  log(
    `mergeResources: ${logicalId}: merging ${logicalId} into ${JSON.stringify(mergeIds)}`,
  );

  for (const mergeId of mergeIds) {
    log(`mergeResources: ${logicalId}: merging ${logicalId} into ${mergeId}}`);
    const owner = owners[mergeId];
    let mergeResourceOwnerId = owner.isIntegration
      ? owner.integrationId
      : owner.resourceId;

    if (owner.type === 'Facet') {
      log(
        `mergeResources: ${logicalId}: merging ${logicalId} into resource ${owner.resourceId} facet ${owner.facetId}`,
      );
      const facet = resources[owner.resourceId].Facets[owner.facetType].find(
        (facet: any) => facet.Id === owner.facetId,
      );
      facet.addCFResource(
        cfTemplate,
        logicalId,
        'Resource',
        resources[logicalId],
      );
    } else {
      source[mergeResourceOwnerId].addCFResource(
        cfTemplate,
        logicalId,
        'Resource',
        resources[logicalId],
      );
    }
    owners[logicalId] = owner;

    if (
      isAllowedToChain(
        logicalId,
        mergeId,
        owners,
        integrations,
        template,
        format,
      )
    ) {
      log(`mergeResources: ${logicalId}: Allowed to chain resources`);
    } else {
      log(`mergeResources: ${logicalId}: Not able to chain resources!`);
      return;
    }

    for (const resourceId of customReferencedResourceIds.filter(
      (resourceId) => resourceId !== mergeResourceOwnerId,
    )) {
      const mergingResourceOwnerId = owners[resourceId].resourceId;
      for (const ownedResourceId of resources[mergingResourceOwnerId]
        .TemplatePartial.Resources) {
        if (
          !resources[mergeResourceOwnerId] ||
          ownedResourceId === mergeResourceOwnerId
        ) {
          continue;
        }
        log(
          `mergeResources: ${logicalId}: adding ${ownedResourceId} into ${mergeResourceOwnerId}`,
        );
        resources[mergeResourceOwnerId].addCFResource(
          cfTemplate,
          ownedResourceId,
          'Resource',
          resources[ownedResourceId],
        );
        owners[ownedResourceId] = owner;
      }
      delete resources[resourceId];
    }
  }
};

const isAllowedGrouping = (
  sourceId: any,
  targetId: any,
  owners: any,
  integrations: any,
  resources: any,
  template: any,
  format: 'SAM' | 'serverless',
) => {
  log(`isAllowedGrouping: source ${sourceId} - target ${targetId}`);
  const rules = getGroupingRules(format);

  let { sourceType, targetType, integrationSourceType, integrationTargetType } =
    getResourcesTypes(
      sourceId,
      targetId,
      owners,
      integrations,
      template,
      format,
    );

  log(
    `isAllowedGrouping: sourceType: ${sourceType} \t targetType: ${targetType}`,
  );
  return rules.some((rule: any) => {
    if (rule.targetIsIntegration) {
      return testIntegrationRule(
        sourceType,
        integrationSourceType,
        integrationTargetType,
        rule,
      );
    }

    if (testResourceRule(sourceType, targetType, rule)) {
      if (rule.stopChaining) {
        const targetOwner = owners[targetId];
        const targetOwnerId = targetOwner.isIntegration
          ? targetOwner.integrationId
          : targetOwner.resourceId;
        log(
          `isAllowedGrouping: sourceType: ${sourceType} targetType: ${targetType} is allowed to group if rule not allready in use...`,
        );
        return !ruleInUse(
          resources[targetOwnerId].TemplatePartial.Resources,
          rule,
          owners,
          integrations,
          template,
          format,
        );
      }
      return true;
    }
    return false;
  });
};

export const isAllowedToChain = (
  resourceId: any,
  targetId: any,
  owners: any,
  integrations: any,
  template: any,
  format: any,
  waiveError = false,
) => {
  const rules = getGroupingRules(format);
  let { sourceType, targetType, integrationSourceType, integrationTargetType } =
    getResourcesTypes(
      resourceId,
      targetId,
      owners,
      integrations,
      template,
      format,
    );
  let isAllowed = false;
  let chainingAllowed = true;

  rules.forEach((rule: any) => {
    let valid = false;
    if (rule.targetIsIntegration) {
      valid = testIntegrationRule(
        sourceType,
        integrationSourceType,
        integrationTargetType,
        rule,
      );
    } else {
      valid = testResourceRule(sourceType, targetType, rule);
    }

    if (valid) {
      isAllowed = true;
      chainingAllowed = chainingAllowed && !rule.stopChaining;
    }
  });

  if (!isAllowed && !waiveError) {
    throw new Error(`${resourceId} is not allowed to be owned by ${targetId}!`);
  }

  return chainingAllowed;
};

const parseParameters = (template: any) => {
  if (!('Parameters' in template)) {
    return {};
  }

  const parameters = {};

  for (const parameterId in template.Parameters) {
    if (!(parameterId in DEFAULT_PARAMETERS)) {
      (parameters as any)[parameterId] = Parameter.fromParameterId(
        template,
        parameterId,
      );
    }
  }

  return parameters;
};

const updateSettingParameters = (setting: any, template: any) => {
  if (
    !setting ||
    !(typeof setting === 'object') ||
    !('Parameters' in template)
  ) {
    return setting;
  }

  if (Object.keys(setting).length === 1 && 'Ref' in setting) {
    if (setting.Ref in template.Parameters) {
      return Parameter.fromParameterId(template, setting.Ref);
    } else {
      return setting;
    }
  }

  for (const key in setting) {
    setting[key] = updateSettingParameters(setting[key], template);
  }

  return setting;
};

const parseReferences = (resources: any, template: any) => {
  const cfnReferences = {};

  for (const fnId of Object.keys(resources).filter((id) =>
    isComputeResource(resources[id].Type),
  )) {
    updateReferences(fnId, template, resources, cfnReferences);
  }

  return cfnReferences;
};

const parsePermissions = (
  resources: any,
  template: any,
  format: 'SAM' | 'serverless',
  references: any,
) => {
  const cfnPermissions = {};

  if (!template.Resources) {
    return {};
  }

  for (const fnId of Object.keys(template.Resources).filter(
    (id) =>
      template.Resources[id].Type === 'AWS::Serverless::Function' ||
      template.Resources[id].Type === 'AWS::Serverless::StateMachine',
  )) {
    const fn = template.Resources[fnId];
    const permissions = parsePermissionsFromFunctionOrStateMachine(
      fn,
      template,
      resources,
    );

    if (permissions) {
      (cfnPermissions as any)[fnId] = permissions;
    }
  }

  for (const dockerTaskId of Object.keys(template.Resources).filter(
    (id) => template.Resources[id].Type === 'AWS::ECS::TaskDefinition',
  )) {
    const dockerTask = template.Resources[dockerTaskId];

    const iamRoleResourceId = query.value(
      "$.Properties.TaskRoleArn['Fn::GetAtt'][0]",
      dockerTask,
      undefined,
      {},
    );

    if (!iamRoleResourceId) {
      continue;
    }

    const iamRoleProps = template.Resources[iamRoleResourceId].Properties;

    if ('ManagedPolicies' in iamRoleProps) {
      (cfnPermissions as any)[dockerTaskId] =
        (cfnPermissions as any)[dockerTaskId] || [];

      for (const policy of iamRoleProps.ManagedPolicies) {
        (cfnPermissions as any)[dockerTaskId].push(
          new Permission(policy, template, resources),
        );
      }
    }

    if ('Policies' in iamRoleProps) {
      for (const policy of iamRoleProps.Policies) {
        for (const statement of policy.PolicyDocument.Statement) {
          (cfnPermissions as any)[dockerTaskId] =
            (cfnPermissions as any)[dockerTaskId] || [];

          (cfnPermissions as any)[dockerTaskId].push(
            new Permission(statement, template, resources),
          );
        }
      }
    }
  }

  // Handle virtual reference resources, e.g. secrets, which we discover by permissions
  // rather than references.  A reference is added to indicate the use of the resource.
  const formatDefinitions = definitions[format];

  for (const resourceType in formatDefinitions.ResourceTypes) {
    const definition = formatDefinitions.ResourceTypes[resourceType];
    if (!definition.IsVirtualReferenceResource) {
      continue;
    }
    const searchSAMCapable = definition.DefaultPermissions.SAMCapable[0];
    const searchIAMCapable =
      definition.DefaultPermissions.IAMCapable[0].Actions[0];

    for (const [resourceId, permissions] of Object.entries(cfnPermissions)) {
      for (const permission of permissions as any) {
        // If this permission already has a located target, skip
        if ('Target' in permission && permission.Target.isLocalResource()) {
          continue;
        }

        const hasSamPermission =
          permission.PolicyName === searchSAMCapable.PolicyName;
        const hasIamPermission =
          permission.PermissionType === 'iamStatement' &&
          permission.Effect === 'Allow' &&
          permission.Actions.includes(searchIAMCapable);

        if (hasSamPermission || hasIamPermission) {
          // The function or docker task depends on the resource's permission; create the
          // virtual reference resource if necessary and add a reference to it.
          if (!(definition.SingletonId in resources)) {
            resources[definition.SingletonId] = new Resource(
              format,
              resourceType,
              definition.SingletonId,
              null,
              null,
              null,
            );
          }
          for (const reference of definition.DefaultReferences) {
            for (const [referenceKey, referenceValue] of Object.entries(
              reference,
            )) {
              if (
                typeof referenceValue !== 'object' ||
                !(referenceValue && 'Ref' in referenceValue)
              ) {
                // It's not a proper reference without !Ref or similar.
                continue;
              }
              references[resourceId] = references[resourceId] || {};
              references[resourceId][referenceKey] = new Id(
                { Ref: definition.SingletonId },
                template,
                resources,
              );
            }
          }
          break;
        }
      }
    }
  }

  return cfnPermissions;
};

const parseCustomReferences = (
  resources: any,
  owners: any,
  integrations: any,
  template: any,
  format: 'SAM' | 'serverless',
) => {
  let references = {};
  for (const resourceId of Object.keys(resources).filter(
    (id) => resources[id].Type === 'custom',
  )) {
    getCustomReferences(
      resourceId,
      resources,
      owners,
      integrations,
      references,
      template,
      format,
    );
  }
  return references;
};

const getResourcesTypes = (
  sourceId: any,
  targetId: any,
  owners: any,
  integrations: any,
  template: any,
  format: 'SAM' | 'serverless',
) => {
  let sourceType;
  let targetType;
  let integrationSourceType;
  let integrationTargetType;

  if (format === 'SAM') {
    sourceType = template.Resources[sourceId].Type;
    targetType =
      template.Resources[targetId] && template.Resources[targetId].Type;
  } else if (format === 'serverless') {
    const resources = template.resources.Resources;

    sourceType = isServerlessFunction(sourceId, template)
      ? 'AWS::Serverless::Function'
      : resources[sourceId].Type;
    targetType = isServerlessFunction(targetId, template)
      ? 'AWS::Serverless::Function'
      : resources[targetId] && resources[targetId].Type;
  } else {
    throw new Error(`Unknown format: ${format}`);
  }

  if (owners[targetId] && owners[targetId].isIntegration) {
    let integrationId = owners[targetId].integrationId;
    let integrationSourceId = integrations[integrationId].Source.ResourceId;
    let integrationTargetId = integrations[integrationId].Target.ResourceId;

    if (format === 'SAM') {
      integrationSourceType = template.Resources[integrationSourceId].Type;
      integrationTargetType = template.Resources[integrationTargetId].Type;
    } else if (format === 'serverless') {
      const resources = template.resources.Resources;

      integrationSourceType = isServerlessFunction(
        integrationSourceId,
        template,
      )
        ? 'AWS::Serverless::Function'
        : resources[integrationSourceId].Type;
      integrationTargetType = isServerlessFunction(
        integrationTargetId,
        template,
      )
        ? 'AWS::Serverless::Function'
        : resources[integrationTargetId].Type;
    } else {
      throw new Error(`Unknown format: ${format}`);
    }
  }

  return {
    sourceType,
    targetType,
    integrationSourceType,
    integrationTargetType,
  };
};

const isServerlessFunction = (resourceId: any, template: any) => {
  if (!resourceId.endsWith('LambdaFunction')) {
    return false;
  }

  let functionId = resourceId.replace('LambdaFunction', '');
  let functionIdLowerCase = functionId[0].toLowerCase() + functionId.slice(1);
  return (
    template.functions[functionId] || template.functions[functionIdLowerCase]
  );
};

const testIntegrationRule = (
  sourceType: any,
  integrationSourceType: any,
  integrationTargetType: any,
  rule: any,
) => {
  const soureRegex = RegExp(rule.sourceType);
  const integrationSourceRegEx = RegExp(rule.integrationSourceType);
  const integrationTargetRegEx = RegExp(rule.integrationTargetType);

  const allowed =
    soureRegex.test(sourceType) &&
    integrationSourceRegEx.test(integrationSourceType) &&
    integrationTargetRegEx.test(integrationTargetType);
  if (allowed) {
    log(
      `testIntegrationRule: ${sourceType} is allowed to be grouped with an integration from ${integrationSourceType} to ${integrationTargetType}`,
    );
  }

  return allowed;
};

const testResourceRule = (sourceType: any, targetType: any, rule: any) => {
  const targetRegex = RegExp(rule.targetType);
  const sourceRegex = RegExp(rule.sourceType);
  let allowed = targetRegex.test(targetType) && sourceRegex.test(sourceType);
  if (allowed) {
    log(
      `testResourceRule: ${sourceType} is allowed to be grouped with ${targetType} [rule: ${JSON.stringify(rule)}]`,
    );
  }

  return allowed;
};

const ruleInUse = (
  resources: any,
  rule: any,
  owners: any,
  integrations: any,
  template: any,
  format: 'SAM' | 'serverless',
) => {
  if (rule.targetIsIntegration) {
    log(`WARNING: Trying to test if integration rule is in use - not expected`);
    return false;
  }

  for (const sourceId of resources) {
    for (const targetId of resources) {
      if (sourceId === targetId) {
        continue;
      }

      const { sourceType, targetType } = getResourcesTypes(
        sourceId,
        targetId,
        owners,
        integrations,
        template,
        format,
      );
      const inUse = testResourceRule(sourceType, targetType, rule);
      if (inUse) {
        log(`ruleInUse: rule is in use`);
        return true;
      }
    }
  }

  log(`ruleInUse: rule is not in use`);
  return false;
};
