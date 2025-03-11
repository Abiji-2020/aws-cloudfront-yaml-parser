import {
  cleanupTemplate,
  updateOwnership,
  isResourceOwned,
} from './manageCFResources';
import * as definitions from './definitions';
import dispatch, { DeleteIntegrationAction } from './dispatch';
import { deleteReferencePermissions } from './deleteReference';

export default function deleteIntegration(
  this: any,
  sourceResourceId: any,
  targetResourceId: any,
  facetType: any,
  facetId: any,
) {
  const integration = this.integrations.find(
    (integration: any) =>
      integration.Source.ResourceId === sourceResourceId &&
      integration.Target.ResourceId === targetResourceId &&
      integration.FacetType === facetType &&
      (!facetType || facetId === integration.FacetId),
  );

  if (!integration) {
    throw new Error(
      `Failed to delete integration from ${sourceResourceId} to ${targetResourceId}: Integration does not exist in state`,
    );
  }

  const source = this.resources[sourceResourceId];
  const target = this.resources[targetResourceId];

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
      `Failed to delete integration from ${sourceResourceId} to ${targetResourceId}: Integration definition does not exist`,
    );
  }

  this.reparseRequired = definition.ReparseRequired;

  const sourceDefinition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[source.Type];
  const targetDefinition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[target.Type];

  const action = new DeleteIntegrationAction(
    this.format,
    source,
    target,
    integration,
  );

  const dispatchResults = dispatch(action, this.template);

  if (sourceDefinition.IsVirtualEventSource) {
    delete source.VirtualEventSourceFunctionId;
  }

  if (sourceDefinition.IsVirtualEventSource) {
    delete source.VirtualEventSourceFunctionId;
  }

  if (
    'IntegrationId' in integration &&
    Number.isInteger(integration.IntegrationId)
  ) {
    for (const otherIntegration of this.integrations) {
      if (target.Type === 'function') {
        if (
          otherIntegration.Target.ResourceId === targetResourceId &&
          otherIntegration.IntegrationId > integration.IntegrationId
        ) {
          otherIntegration.IntegrationId--;
        }
      } else {
        if (
          otherIntegration.Source.ResourceId === sourceResourceId &&
          otherIntegration.IntegrationId > integration.IntegrationId
        ) {
          otherIntegration.IntegrationId--;
        }
      }
    }
  }

  this.integrations.splice(this.integrations.indexOf(integration), 1);

  const facet = facetId
    ? source.Facets[facetType].find((facet: any) => facet.Id === facetId)
    : undefined;

  for (const resourceType in integration.TemplatePartial) {
    for (const ownedResourceId of integration.TemplatePartial[resourceType]) {
      if (!isResourceOwned(this, ownedResourceId)) {
        delete this.cfTemplate()[resourceType][ownedResourceId];
      }
    }
  }

  if (source.Type === 'stateMachine' && targetDefinition.DefaultPermissions) {
    const deletePolicy = targetDefinition.DefaultPermissions.SAMCapable
      ? targetDefinition.DefaultPermissions.SAMCapable[0].PolicyName
      : targetDefinition.DefaultPermissions.IAMCapable[0].Actions[0];
    deleteReferencePermissions.call(
      this,
      sourceResourceId,
      targetResourceId,
      deletePolicy,
    );
  }

  updateOwnership(this, facet || source, dispatchResults);

  cleanupTemplate(this);
}
