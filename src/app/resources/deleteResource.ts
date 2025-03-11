import { cleanupTemplate, updateDefaultParameters } from './manageCFResources';
import deleteFacet from './deleteFacet';
import Id from './id';

export default function deleteResource(this: any, resourceId: any) {
  const resource = this.resources[resourceId];

  if (!resource) {
    throw new Error(
      `Failed to delete resource ${resourceId}: Resource does not exist in state`,
    );
  }

  const integrations = [...this.integrations];
  for (const integration of integrations) {
    if (
      (integration.Source.Local === true &&
        integration.Source.ResourceId === resourceId) ||
      (integration.Target.Local === true &&
        integration.Target.ResourceId === resourceId)
    ) {
      this.deleteIntegration(
        integration.Source.ResourceId,
        integration.Target.ResourceId,
        integration.FacetType,
        integration.FacetId,
      );
    }
  }

  // Clean up references from deleted resource
  for (const reference of Object.keys(this.references[resourceId] || {})) {
    const sourceReferences = this.references[resourceId] || {};
    if (reference in sourceReferences) {
      this.deleteReference(resourceId, sourceReferences[reference].ResourceId);
    }
  }

  // Clean up references to deleted resource
  for (const referenceSourceId in this.references) {
    const references = this.references[referenceSourceId];

    for (const envVarName in references) {
      const reference = references[envVarName];

      if (reference.ResourceId === resourceId) {
        this.deleteReference(referenceSourceId, resourceId);
        break;
      }
    }
  }

  if (resource.Type === 'virtualNetwork') {
    for (const placementResourceId in this.virtualNetworkPlacements) {
      const placement = this.virtualNetworkPlacements[placementResourceId];

      if (
        placement.VirtualNetworkId.isLocalResource() &&
        placement.VirtualNetworkId.ResourceId === resourceId
      ) {
        this.deleteVirtualNetworkPlacement(placementResourceId);
      }
    }
  }

  if (resourceId in this.virtualNetworkPlacements) {
    this.deleteVirtualNetworkPlacement(resourceId);
  }

  if (resourceId in this.permissions) {
    delete this.permissions[resourceId];
  }

  if (this.format === 'serverless' && resource.Type === 'function') {
    delete this.template.functions[resource.Settings.Name];
  }

  if (this.format === 'serverless') {
    deleteServerlessPermissions(resourceId, this.template, this.resources);
  }

  for (const resourceType in resource.TemplatePartial) {
    for (const ownedResourceId of resource.TemplatePartial[resourceType]) {
      if (this.cfTemplate()[resourceType]) {
        delete this.cfTemplate()[resourceType][ownedResourceId];
      }
    }
  }

  for (const facetType in resource.Facets || {}) {
    for (const facet of resource.Facets[facetType]) {
      deleteFacet(this, resourceId, facetType, facet.Id);
    }
  }

  updateDefaultParameters(this.template);

  delete this.resources[resourceId];

  cleanupTemplate(this);
}

const deleteServerlessPermissions = (
  resourceId: any,
  template: any,
  resources: any,
) => {
  if (!('iamRoleStatements' in template.provider)) {
    return;
  }

  for (const statement of template.provider.iamRoleStatements) {
    const statementResources = Array.isArray(statement.Resource)
      ? statement.Resource
      : [statement.Resource];

    const filteredStatementResources = statementResources.filter(
      (resource: any) => {
        const id = new Id(resource, template, resources);

        return id.ResourceId !== resourceId;
      },
    );

    if (filteredStatementResources.length === 0) {
      delete statement.Resource;
    } else if (filteredStatementResources.length === 1) {
      statement.Resource = filteredStatementResources[0];
    } else {
      statement.Resource = filteredStatementResources;
    }
  }

  template.provider.iamRoleStatements =
    template.provider.iamRoleStatements.filter(
      (statement: any) => statement.Resource,
    );

  if (template.provider.iamRoleStatements.length === 0) {
    delete template.provider.iamRoleStatements;
  }
};
