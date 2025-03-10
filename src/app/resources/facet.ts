import * as definitions from './definitions';
import * as query from './query';
import AbstractResource from './abstractResource';
import resolveSetting from './resolveSetting';

export default class Facet extends AbstractResource {
  Id: any;
  Properties: any;
  Settings?: any;
  constructor(
    format: 'SAM' | 'serverless',
    resource: any,
    type: any,
    template: any,
    properties = {},
  ) {
    super();

    this.Id = `${resource.Id}Facet${type}${Object.keys(properties)
      .sort()
      .map((prop: any) => `${prop}${(properties as any)[prop]}`)
      .join('')}`;
    this.Properties = properties;
    this.Settings = {};
    const context = {
      resourceId: resource.Id,
    };

    for (const key in properties) {
      (context as any)[`Facet:${key}`] = (properties as any)[key];
    }
    const resourceDefinition = definitions[format].ResourceTypes[resource.Type];
    const facetSettingsDefinitions =
      'FacetSettings' in resourceDefinition
        ? definitions[format].ResourceTypes[resource.Type].FacetSettings
        : {};
    const facetSettings = facetSettingsDefinitions[type] || {};

    for (const settingName in facetSettings) {
      const settingSchema = facetSettings[settingName];

      const value = resolveSetting(
        `facet ${this.Id}`,
        settingName,
        settingSchema,
        template,
        null,
        context,
      );

      this.Settings[settingName] = value;
    }

    /* Check for dependent settings where dependency is unmet. Set values to
     * Default in this case. */
    for (const settingName in facetSettings) {
      const settingSchema = facetSettings[settingName];

      if ('DependsOn' in settingSchema) {
        const dependencyNames = Object.keys(settingSchema.DependsOn);

        for (const dependencyName of dependencyNames) {
          const dependencySchema = facetSettings[dependencyName];
          let value = this.Settings[dependencyName];

          if (
            (value === null || value === undefined) &&
            'GlobalPath' in dependencySchema
          ) {
            value = query.value(
              dependencySchema.GlobalPath,
              template,
              undefined,
              {},
            );
          }

          if (value !== settingSchema.DependsOn[dependencyName]) {
            this.Settings[settingName] = settingSchema.Default;
            break;
          }
        }
      }
    }
  }
}
