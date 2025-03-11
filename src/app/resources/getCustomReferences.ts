import Id from './id';
import { isAllowedToChain, log } from './parse';

export default (
  customResourceId: any,
  resources: any,
  owners: any,
  integrations: any,
  references: any,
  template: any,
  format: 'SAM' | 'serverless',
) => {
  const customResource = resources[customResourceId];

  if (customResource.Type !== 'custom') {
    return;
  }

  if (!('CloudFormation' in customResource.Settings)) {
    return;
  }

  let targets: any = [];
  for (const resourceId in customResource.Settings.CloudFormation.Resources) {
    const resource =
      customResource.Settings.CloudFormation.Resources[resourceId];

    if (!resource.Properties) {
      continue;
    }

    let resourceTargets: any = [];
    for (const property in resource.Properties) {
      getTargets(
        resource.Properties[property],
        template,
        resources,
        resourceTargets,
      );
    }

    resourceTargets.forEach((target: any) => {
      // Skip 'weakly linked' targets, ie, rules which prevent chaining
      // resourceReferences[target.ResourceId] = target;

      if (target.Type === 'virtual' || resourceId === target.ResourceId) {
        return;
      }

      if (
        isAllowedToChain(
          resourceId,
          target.ResourceId,
          owners,
          integrations,
          template,
          format,
          true,
        )
      ) {
        targets.push(target);
        log(
          `getCustomReferences: ${customResourceId}: Adding a reference from ${resourceId} to ${target.ResourceId}`,
        );
      } else {
        log(
          `getCustomReferences: ${customResourceId}: Not adding a reference from ${resourceId} to ${target.ResourceId} because it is a weak link`,
        );
      }
    });
  }

  let resourceReferences = references[customResourceId] || {};
  targets.forEach((target: any) => {
    const targetOwner = owners[target.ResourceId];
    if (
      targetOwner.resourceId !== customResourceId &&
      resources[targetOwner.resourceId]
    ) {
      // Update target to point to the owner
      target.ResourceId = targetOwner.resourceId;
      resourceReferences[target.ResourceId] = target;
    }
  });

  if (Object.keys(resourceReferences).length > 0) {
    references[customResourceId] = resourceReferences;
  }
  return references;
};

const getTargets = (
  value: any,
  template: any,
  resources: any,
  targets: any,
) => {
  if (typeof value !== 'object' || value === null) {
    return;
  }

  const target = new Id(value, template, resources, false);

  if (target.isLocalResource()) {
    targets.push(target);
    return;
  }

  for (const name in value) {
    getTargets(value[name], template, resources, targets);
  }
};
