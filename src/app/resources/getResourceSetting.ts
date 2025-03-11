import * as definitions from './definitions';
import resolveBinding from './resolveBinding';
import Parameter from './parameter';

export default function getResourceSetting(
  this: any,
  resourceId: any,
  facetType: any,
  facetId: any,
  settingName: any,
  defaultOnly: any = false,
) {
  let resource = this.resources[resourceId];
  let format = this.format as 'SAM' | 'serverless';
  let template = this.template;

  let globalSetting;
  if (resource.Type !== 'custom') {
    let resourceDefinition = definitions[format].ResourceTypes[resource.Type];

    /* Get setting schemas for explicit resource type if this is an implicit
     * type */
    if (resourceDefinition.ExplicitType) {
      resourceDefinition =
        definitions[format].ResourceTypes[resourceDefinition.ExplicitType];
    }

    const settingSchema = facetType
      ? resourceDefinition.FacetSettings[facetType][settingName]
      : resourceDefinition.Settings[settingName];

    if (settingSchema && settingSchema.GlobalPath) {
      globalSetting = resolveBinding(
        settingSchema.GlobalPath,
        template,
        undefined,
        {},
      );
    }
  }
  if (defaultOnly) {
    return globalSetting;
  }

  if (facetType) {
    const facet = resource.Facets[facetType].find(
      (facet: any) => facet.Id === facetId,
    );

    if (
      facet.Settings[settingName] !== null &&
      facet.Settings[settingName] !== undefined
    ) {
      return facet.Settings[settingName];
    }
  } else {
    let localSetting = resource.Settings[settingName];

    if (localSetting === null || localSetting === undefined) {
      return globalSetting;
    }

    if (
      typeof localSetting === 'object' &&
      !Array.isArray(localSetting) &&
      !(localSetting instanceof Parameter)
    ) {
      globalSetting = globalSetting || {};
      if (typeof globalSetting !== 'object') {
        // type mismatch
        return localSetting;
      }
      // Combine global and local, with local overriding global.
      return { ...globalSetting, ...localSetting };
    }
    return localSetting;
  }
  return globalSetting;
}
