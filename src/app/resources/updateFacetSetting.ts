import cloneDeep from 'clone-deep';
import * as definitions from './definitions';
import * as manageCFResources from './manageCFResources';
import * as query from './query';
import dispatch, { UpdateFacetSettingAction } from './dispatch';

export default function updateFacetSetting(
  this: any,
  resourceId: any,
  facetType: any,
  facetId: any,
  settingName: any,
  value: any,
) {
  if (!(resourceId in this.resources)) {
    throw new Error(
      `Failed to update facet setting ${settingName} for resource ${resourceId} facet ${facetId}: Resource does not exist`,
    );
  }

  const resource = this.resources[resourceId];
  const resourceType = resource.Type;
  const definition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[
      resourceType
    ];

  if (!(facetType in resource.Facets)) {
    throw new Error(
      `Failed to update facet setting ${settingName} for resource ${resourceId} facet ${facetId}: Resource does not have facets of type ${facetType}`,
    );
  }

  const settingSchemas = definition.FacetSettings[facetType];

  if (!(settingName in settingSchemas)) {
    throw new Error(
      `Failed to update facet setting ${settingName} for resource ${resourceId} facet ${facetId}: Facet settings definition does not include setting`,
    );
  }

  const settingSchema = settingSchemas[settingName];

  const facet = resource.Facets[facetType].find(
    (facet: any) => facet.Id === facetId,
  );
  if (!facet) {
    throw new Error(
      `Failed to update facet setting ${settingName} for resource ${resourceId} facet ${facetId}: Facet does not exist`,
    );
  }

  // If this setting depends on another and the dependency isn't met, bail
  if (settingSchema && 'DependsOn' in settingSchema) {
    const dependencySettings = Object.keys(settingSchema.DependsOn);

    for (const dependencySetting of dependencySettings) {
      if (
        facet.Settings[dependencySetting] !==
        settingSchema.DependsOn[dependencySetting]
      ) {
        /* Make sure the setting is set to the default value as we could be called
         * through recursion when the DependsOn setting is changed. */
        facet.Settings[settingName] = settingSchema.Default;
        return;
      }
    }
  }

  this.reparseRequired = this.reparseRequired || settingSchema.ReparseRequired;

  const currentValue = facet.Settings[settingName];

  const valueType = settingSchemas[settingName].ValueType;
  /*  if scalar string convert to number if its supposed to be number
      if scalar number convert to string if its supposed to be string */
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
      value = Boolean(value);
    }
  }

  let cfValue = cloneDeep(value);
  cfValue = manageCFResources.updateParameterValues(cfValue, this, true);

  const action = new UpdateFacetSettingAction(
    this.format,
    resource,
    facetType,
    facet.Properties,
    settingName,
    cfValue,
    currentValue,
  );

  const results = dispatch(action, this.template);

  facet.Settings[settingName] = value;

  manageCFResources.updateParameterValues(currentValue, this, false);

  for (const otherSettingName in settingSchemas) {
    const otherSettingSchema = settingSchemas[otherSettingName];

    if (
      'DependsOn' in otherSettingSchema &&
      Object.keys(otherSettingSchema.DependsOn).includes(settingName)
    ) {
      for (const [dependencySetting, dependencySettingValue] of Object.entries(
        otherSettingSchema.DependsOn || {},
      )) {
        let dependencyValue = facet.Settings[dependencySetting];

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
          this.updateFacetSetting(
            resourceId,
            facetType,
            facetId,
            otherSettingName,
            otherSettingSchema.Default,
          );
          break;
        }
      }
    }
  }

  manageCFResources.updateOwnership(this, facet, results);

  manageCFResources.cleanupTemplate(this);
}
