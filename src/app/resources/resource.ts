import cloneDeep from 'clone-deep';
import * as query from './query';
import transformations from './transformations';
import resolveBinding from './resolveBinding';
import resolveSubBindings from './resolveSubBindings';
import * as definitions from './definitions';
import Facet from './facet';
import AbstractResource from './abstractResource';
import resolveSetting from './resolveSetting';
import { ERROR_CODES, injectContext } from './manageCFResources';

export default class Resource extends AbstractResource {
  Type: any;
  Id: any;
  [key: string]: any;
  Settings: any;
  ServerlessFunctionName?: any;
  PhysicalName?: any;
  Facets?: any;
  constructor(
    format: 'SAM' | 'serverless',
    type: any,
    template: any,
    pathOrLogicalId: any,
    object: any,
    virtualInfo: any,
  ) {
    super();
    const cfTemplate = format === 'SAM' ? template : template.resources || {};
    if (type) {
      this.Type = type;

      const definition = definitions[format].ResourceTypes[type];

      if (definition.SingletoId) {
        this.Id = definition.SingletoId;
      } else if (
        definition.IsVirtualEventSource ||
        definition.IsVirtualEventTarget
      ) {
        this.Id = pathOrLogicalId;
        for (const key in virtualInfo || {}) {
          this[key] = virtualInfo[key];
        }
      } else if (definition.IDBinding) {
        this.Id = resolveBinding(definition.IDBinding, template, object, {});
      } else if (type === 'custom') {
        this.Id = pathOrLogicalId;
      } else {
        this.Id = pathOrLogicalId[pathOrLogicalId.length - 1];
      }

      this.Settings = {};

      if ('Settings' in definition && 'Name' in definition.Settings) {
        if (object && 'Metadata' in object && 'Name' in object.Metadata) {
          this.Settings.Name = object.Metadata.Name;
        } else if (format === 'serverless' && this.Type === 'function') {
          this.Settings.Name = this.Id;
        } else {
          this.Settings.Name = null;
        }
      }

      if ('Settings' in definition && 'LogicalId' in definition.Settings) {
        this.Settings.LogicalId = this.Id;
      }

      if (format === 'serverless') {
        if (this.Type === 'function' || definition.IsImplicit) {
          this.ServerlessFunctionName = this.Id;
          this.Id = serverlessCFId(this.Type, this.Id);
        }
      }

      if (definition.PhysicalNameBinding) {
        this.PhysicalName = resolveBinding(
          definition.PhysicalNameBinding,
          template,
          object,
          {},
        );
      }

      if (format === 'serverless' && !this.PhysicalName) {
        this.PhysicalName = serverlessPhysicalName(this);
      }

      if (!this.PhysicalName) {
        delete this.PhysicalName;
      }

      if ('FacetSingletons' in definition) {
        this.Facets = {};

        for (const facetType of definition.FacetSingletons) {
          this.Facets[facetType] = [
            new Facet(format, this, facetType, template),
          ];
        }
      }

      const context = { resourceId: this.Id };
      if (object) {
        for (const settingName in definition.Settings) {
          if (settingName === 'Name' || settingName === 'LogicalId') {
            continue;
          }

          const settingSchema = definition.Settings[settingName];

          if (settingSchema.Type === 'vpc') {
            this.getVpcSetting(settingName, settingSchema, template, object);
          } else if (settingSchema.FacetTransformations) {
            let value;
            try {
              value = resolveSetting(
                `resource type ${this.Type}`,
                settingName,
                settingSchema,
                template,
                object,
                context,
              );
            } catch (err: any) {
              if (err.code !== ERROR_CODES.UNDEFINED_CONTEXT_KEY) {
                throw err;
              }
            }

            this.Settings[settingName] = value;
            (context as any)[`SETTING:${settingName}`] = value;

            let facetsInfos = cloneDeep(value);

            for (const transformation of settingSchema.FacetTransformations) {
              if (!(transformation in transformations)) {
                throw new Error(
                  `Invalid facet transformation '${transformation}'`,
                );
              }
              facetsInfos = (transformations as any)[transformation](
                facetsInfos,
              );
            }

            const facets = facetsInfos.map((info: any) => {
              const facet = new Facet(
                format,
                this,
                settingSchema.FacetType,
                template,
                info.props,
              );

              if (info.resourceId) {
                facet.addCFResource(template, info.resourceId, 'Resource', {});
              }

              return facet;
            });

            this.Facets = {
              ...(this.Facets || {}),

              [settingSchema.FacetType]: facets,
            };
          } else if (settingSchema.Type === 'FacetResources') {
            const facets = query
              .nodes(settingSchema.FacetLocator, template, object, context)
              .map((node) => {
                const properties = {};

                for (const prop in settingSchema.FacetPropertyBindings) {
                  (properties as any)[prop] = resolveBinding(
                    settingSchema.FacetPropertyBindings[prop],
                    template,
                    node.value,
                    context,
                  );
                }

                const facet = new Facet(
                  format,
                  this,
                  settingSchema.FacetType,
                  template,
                  properties,
                );

                const logicalId = node.path.pop();
                facet.addCFResource(cfTemplate, logicalId, 'Resource', {});

                return facet;
              });

            this.Settings[settingName] = facets.map(
              (facet) => facet.Properties,
            );

            this.Facets = {
              ...(this.Facets || {}),

              [settingSchema.FacetType]: facets,
            };
          } else if (settingSchema.FacetType) {
            const { finalBinding, contexts } = resolveSubBindings(
              template,
              object,
              settingSchema,
              context,
            );

            let facetsInfos: any = [];
            for (const context of contexts) {
              const nodes = query.nodes(
                finalBinding.Path,
                template,
                object,
                context,
              );

              let facetInfos = nodes.map((node) => {
                const info = {
                  props: cloneDeep(node.value),
                };

                for (const transformation of settingSchema.Transformations ||
                  []) {
                  if (!(transformation in transformations)) {
                    throw new Error(
                      `Invalid transformation '${transformation}'`,
                    );
                  }

                  info.props = (transformations as any)[transformation](
                    info.props,
                  );
                }

                if (node.path.length === 3 && node.path[1] === 'Resources') {
                  (info as any).resourceId = node.path[2];
                }

                return info;
              });

              /* A FacetType setting can have a path that locates multiple
               * objects in a template, creating a facet for each object. Or,
               * it could define a path that locates one object in a template
               * that is itself an array, creating a facet for each element.
               * This logic looks for the latter case, and then transforms the
               * single location record into the same format as a multi-location
               * record. */
              if (
                facetInfos.length === 1 &&
                Array.isArray(facetInfos[0].props)
              ) {
                facetInfos = facetInfos[0].props.map((props) => ({
                  props,
                  resourceId: (facetInfos[0] as any).resourceId,
                }));
              }

              Array.prototype.push.apply(facetsInfos, facetInfos);
            }

            if ('FacetPropertyBindings' in settingSchema) {
              facetsInfos = facetsInfos.map((info: any) => {
                const realProps = {};

                for (const prop in settingSchema.FacetPropertyBindings) {
                  (realProps as any)[prop] = resolveBinding(
                    settingSchema.FacetPropertyBindings[prop],
                    template,
                    info.props,
                    context,
                  );
                }

                info.props = realProps;

                return info;
              });
            }

            const facets = facetsInfos.map((info: any) => {
              const facet = new Facet(
                format,
                this,
                settingSchema.FacetType,
                template,
                info.props,
              );

              if (info.resourceId) {
                facet.addCFResource(template, info.resourceId, 'Resource', {});
              }

              return facet;
            });

            this.Facets = {
              ...(this.Facets || {}),

              [settingSchema.FacetType]: facets,
            };

            this.Settings[settingName] = facetsInfos.map(
              (info: any) => info.props,
            );
            (context as any)[`SETTING:${settingName}`] =
              this.Settings[settingName];
          } else {
            let value;

            try {
              value = resolveSetting(
                `resource type ${this.Type}`,
                settingName,
                settingSchema,
                template,
                object,
                context,
              );
            } catch (err: any) {
              if (err.code !== ERROR_CODES.UNDEFINED_CONTEXT_KEY) {
                throw err;
              }
            }

            if (value === undefined && 'Default' in settingSchema) {
              value = injectContext(cloneDeep(settingSchema.Default), context);
            }

            this.Settings[settingName] = value;
            (context as any)[`SETTING:${settingName}`] = value;

            if (settingSchema.GlobalPath) {
              const globalValue = resolveSetting(
                `resource type ${this.Type} global`,
                settingName,
                settingSchema.GlobalPath,
                template,
                object,
                context,
              );
              definition.Settings[settingName].GlobalDefault = globalValue;
            }
          }
        }
      } else {
        for (const settingName in definition.Settings) {
          if (settingName === 'Name') {
            continue;
          }

          const settingSchema = definition.Settings[settingName];

          this.Settings[settingName] = injectContext(
            cloneDeep(settingSchema.Default),
            context,
          );

          if (settingSchema.FacetType) {
            let facets = this.Settings[settingName];

            facets = facets.map(
              (facet: any) =>
                new Facet(
                  format,
                  this,
                  settingSchema.FacetType,
                  this['template'],
                  facet,
                ),
            );

            this.Facets = {
              ...(this.Facets || {}),

              [settingSchema.FacetType]: facets,
            };
          }
        }
      }

      /* Check for dependent settings where dependency is unmet. Set values to
       * Default in this case. */
      for (const settingName in definition.Settings) {
        const settingSchema = definition.Settings[settingName];

        if ('DependsOn' in settingSchema) {
          const dependencyNames = Object.keys(settingSchema.DependsOn);

          for (const dependencyName of dependencyNames) {
            const dependencySchema = definition.Settings[dependencyName];
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
              this.Settings[settingName] = injectContext(
                cloneDeep(definition.Settings[settingName].Default),
                context,
              );
              break;
            }
          }
        }
      }

      // If object represents a resource, mark it as owned
      if (
        Array.isArray(pathOrLogicalId) &&
        ((format === 'SAM' &&
          pathOrLogicalId.length === 3 &&
          pathOrLogicalId[1] === 'Resources') ||
          (format === 'serverless' &&
            ((pathOrLogicalId.length === 3 &&
              pathOrLogicalId[1] === 'functions') ||
              (pathOrLogicalId.length === 4 &&
                pathOrLogicalId[2] === 'Resources'))))
      ) {
        this.addCFResource(cfTemplate, this.Id, 'Resource', {});
      }

      const useExistingResourceConditionId = `${this.Id}UseExistingResource`;
      if (useExistingResourceConditionId in (cfTemplate.Conditions || {})) {
        this.addCFResource(
          cfTemplate,
          useExistingResourceConditionId,
          'Condition',
          {},
        );
      }

      const createNewResourceConditionId = `${this.Id}CreateNewResource`;
      if (createNewResourceConditionId in (cfTemplate.Conditions || {})) {
        this.addCFResource(
          cfTemplate,
          createNewResourceConditionId,
          'Condition',
          {},
        );
      }

      const existingResourceId = `${this.Id}ExistingResource`;
      if (existingResourceId in (cfTemplate.Resources || {})) {
        this.addCFResource(cfTemplate, existingResourceId, 'Resource', {});
      }

      if ('SubResourceLocators' in definition) {
        for (const locator of definition.SubResourceLocators) {
          const nodes = query.nodes(locator.Path, template, null, {
            resourceId: this.Id,
          });

          for (const node of nodes) {
            const resourceId = node.path.pop();
            const type = node.path.pop();

            this.addCFResource(
              cfTemplate,
              resourceId,
              (type as string).replace(/s$/, ''),
              {},
            );
          }
        }
      }
    } else {
      this.Type = 'custom';
      this.Id = pathOrLogicalId;
      this.addCFResource(cfTemplate, this.Id, 'Resource', {});
    }
  }

  override addCFResource(
    template: any,
    logicalId: any,
    type: any,
    resource: any,
  ): any {
    super.addCFResource(template, logicalId, type, resource);

    if (this.Type === 'custom') {
      const typeTemplateName = `${type}s`;

      const settingResource = cloneDeep(template[typeTemplateName][logicalId]);

      this.Settings = this.Settings || {};
      this.Settings.CloudFormation = this.Settings.CloudFormation || {};
      this.Settings.CloudFormation[typeTemplateName] =
        this.Settings.CloudFormation[typeTemplateName] || {};
      this.Settings.CloudFormation[typeTemplateName][logicalId] =
        settingResource;
    }
  }

  getVpcSetting(settingName: any, setting: any, template: any, object: any) {
    this.Settings[settingName] = {};

    for (const subSettingName of ['SubnetIds', 'SecurityGroupIds']) {
      if (subSettingName in setting) {
        const subSetting = setting[subSettingName];
        const primaryBinding = subSetting;

        if (typeof primaryBinding === 'string') {
          this.Settings[settingName][subSettingName] = query.value(
            primaryBinding,
            template,
            object,
            {},
          );
        } else if ('Path' in primaryBinding) {
          this.Settings[settingName][subSettingName] = query.value(
            primaryBinding.Path,
            template,
            object,
            {},
          );
        } else {
          throw new Error(
            `Invalid binding format for resource type ${this.Type} ${settingName} subsetting ${subSettingName}: must be either a string or have a Path specification`,
          );
        }
      }
    }
  }
}
export const serverlessCFId = (type: any, id: any) => {
  switch (type) {
    case 'function':
      return serverlessFunctionName(id);

    case 'objectStore':
    case 'implicitObjectStore':
      return serverlessS3BucketName(id);

    case 'implicitTopic':
      return serverlessSNSTopicName(id);

    default:
      return id;
  }
};

export const serverlessFunctionName = (id: any) => {
  const normalized = id[0].toUpperCase() + id.slice(1);
  return (
    normalized.replace(/-/g, 'Dash').replace(/_/g, 'Underscore') +
    'LambdaFunction'
  );
};

const serverlessS3BucketName = (id: any) => {
  const normalized = id[0].toUpperCase() + id.slice(1);
  return 'S3Bucket' + normalized.replace(/[^0-9A-Za-z]/g, '');
};

const serverlessSNSTopicName = (id: any) => {
  const normalized = id[0].toUpperCase() + id.slice(1);
  return 'SNSTopic' + normalized.replace(/[^0-9A-Za-z]/g, '');
};

export const serverlessPhysicalName = (resource: any) => {
  switch (resource.Type) {
    case 'function':
      return `\${self:service}-\${opt:stage}-${resource.Settings.Name}`;

    case 'implicitApi':
      return '${opt:stage}-${self:service}'; // eslint-disable-line no-template-curly-in-string

    default:
      return undefined;
  }
};
