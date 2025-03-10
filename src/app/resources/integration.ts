import * as query from './query';
import AbstractResource from './abstractResource';
import Facet from './facet';
import Id from './id';
import resolveBinding from './resolveBinding';
import resolveSubBindings from './resolveSubBindings';
import resolveSetting from './resolveSetting';
import * as definitions from './definitions';
import transformations from './transformations';
import { serverlessCFId } from './resource';
import deepEqual from 'deep-equal';
import { injectContext } from './manageCFResources';
import { PathComponent } from 'jsonpath';

export const ERROR_CODES = {
  integrationTypeInvalid: 'integrationTypeInvalid',
};

export default class Integration extends AbstractResource {
  SourceType?: any;
  TargetType?: any;
  Source?: any;
  IntegrationId?: any;
  Target?: any;
  FacetType?: any;
  FacetId?: any;
  Settings?: any;
  Id?: any;

  constructor(
    format: 'serverless' | 'SAM',
    definition: any,
    template: any,
    resources: any,
    {
      path,
      object,
      source,
      target,
      facetId,
      context,
    }: {
      path: any;
      object: any;
      source: any;
      target: any;
      facetId: any;
      context: any;
    },
  ) {
    super();

    context = context || {};

    this.SourceType = definition.SourceType;
    this.TargetType = definition.TargetType;

    if (source) {
      this.Source = { Ref: source.Id };
    } else if (definition.IsVirtualEventSource) {
      this.Source = { Ref: path[path.length - 1].toString() };
    } else if (typeof definition.Locator.Source === 'string') {
      this.Source = { Ref: definition.Locator.Source };
    } else if (!source && definition.Locator.Source.Index) {
      let index = definition.Locator.Source.Index;

      // Serverless resources are located in $.resources.Resources whereas SAM resources are located
      // in $.Resources.  Bump the serverless locator index to account for the 'resources'.
      if (format === 'serverless' && path[1] === 'resources') {
        index++;
      }

      this.Source = { Ref: path[index] };
    } else if (definition.Locator.Source.Path) {
      this.Source = resolveBinding(
        definition.Locator.Source,
        template,
        object,
        {},
      );

      if (typeof this.Source === 'string') {
        if (format === 'serverless') {
          this.Source = { Ref: serverlessCFId(this.SourceType, this.Source) };
        } else {
          this.Source = { Ref: this.Source };
        }
      }
    } else {
      throw new Error(
        `Bad integration type definition for ${definition.SourceType} to ${definition.TargetType}: Locator.Source, Locator.Source.Index, or Locator.Source.Path must be defined`,
      );
    }

    if (!this.Source) {
      throw new Error(
        `Failed to find source for integration from ${definition.SourceType} to ${definition.TargetType} for integration path ${path.join('.')}`,
      );
    }

    this.Source = new Id(this.Source, template, resources);

    if (
      definitions[format].ResourceTypes[this.SourceType].IsVirtualEventSource &&
      !source
    ) {
      if (format === 'serverless') {
        const functionId = path[definition.Locator.Target.Index];
        this.IntegrationId = Number(this.Source.ResourceId);
        this.Source.ResourceId = Object.keys(resources).find((resourceId) => {
          const resource = resources[resourceId];
          return (
            resource.VirtualEventSourceFunctionId === functionId &&
            resource.VirtualEventSourceName === this.Source.ResourceId
          );
        });
      } else {
        this.IntegrationId = this.Source.ResourceId;
        this.Source.ResourceId = Object.keys(resources).find(
          (resourceId) =>
            resources[resourceId].VirtualEventSourceName ===
            this.Source.ResourceId,
        );
      }

      if (!this.Source.ResourceId) {
        throw new Error(
          `Failed to find virtual event source for ${this.SourceType} to ${this.TargetType} Integration`,
        );
      }

      delete resources[this.Source.ResourceId].VirtualEventSourceName;
    } else if (
      this.TargetType === 'function' ||
      this.TargetType === 'edgeFunction' ||
      this.TargetType === 'cdnFunction' ||
      this.TargetType === 'api'
    ) {
      if (path) {
        this.IntegrationId = path[path.length - 1];
      } else {
        this.IntegrationId = this.Source.ResourceId;
      }
    }

    const targetLocator = definition.Locator.Target;

    if (target) {
      this.Target = { Ref: target.Id };
    } else if (typeof targetLocator === 'string') {
      this.Target = { Ref: targetLocator };

      if (format === 'serverless' && this.TargetType === 'function') {
        this.Target.Ref = serverlessCFId(this.TargetType, this.Target.Ref);
      }
    } else if (!target && targetLocator.Index) {
      let index = targetLocator.Index;
      // Serverless resources are located in $.resources.Resources whereas SAM resources are located
      // in $.Resources.  Bump the serverless locator index to account for the 'resources'.
      if (format === 'serverless' && path[1] === 'resources') {
        index++;
      }
      this.Target = { Ref: path[index] };

      if (format === 'serverless' && this.TargetType === 'function') {
        this.Target.Ref = serverlessCFId(this.TargetType, this.Target.Ref);
      }
    } else if (targetLocator.Path) {
      this.Target = resolveBinding(targetLocator, template, object, {});

      if (targetLocator.VirtualTargetType) {
        const locatorResource = this.Target;
        this.Target = undefined;
        const settings = {};

        for (const settingName in targetLocator.VirtualTargetSettings || {}) {
          (settings as any)[settingName] = resolveBinding(
            targetLocator.VirtualTargetSettings[settingName],
            template,
            locatorResource,
            {},
          );
        }

        for (const resourceId in resources) {
          const resource = resources[resourceId];

          if (deepEqual(resource.Settings, settings)) {
            this.Target = { Ref: resourceId };
            break;
          }
        }
      }

      if (typeof this.Target === 'string') {
        this.Target = { Ref: this.Target };
      }

      if (format === 'serverless' && this.TargetType === 'function') {
        this.Target.Ref = serverlessCFId(this.TargetType, this.Target.Ref);
      }
    } else if (targetLocator.Context) {
      const nodes = query.nodes(
        targetLocator.Context,
        template,
        object,
        context,
      );
      if (nodes.length !== 1) {
        const err = new Error('No target resource found by Context');
        (err as any).code = ERROR_CODES.integrationTypeInvalid;
        throw err;
      }
      const resourceId = nodes[0].path.pop();
      this.Target = { Ref: resourceId };
    } else {
      throw new Error(
        `Bad integration type definition for ${definition.SourceType} to ${definition.TargetType}: Locator.Target, Locator.Target.Index, or Locator.Target.Path must be defined`,
      );
    }

    if (!this.Target) {
      throw new Error(
        `Failed to find target for integration from ${definition.SourceType} to ${definition.TargetType} for integration path ${path.join('.')}`,
      );
    }

    this.Target = new Id(this.Target, template, resources);

    if (this.Source.isLocalResource()) {
      if (!resources[this.Source.ResourceId]) {
        const err = new Error(
          `No source resource ${this.Source.ResourceId} found`,
        );
        (err as any).code = ERROR_CODES.integrationTypeInvalid;
        throw err;
      }
      const resourceType = resources[this.Source.ResourceId].Type;

      if (resourceType !== this.SourceType) {
        const err = new Error('Integration source type mismatch');
        (err as any).code = ERROR_CODES.integrationTypeInvalid;
        throw err;
      }
    } else {
      const err = new Error('Non-local integration source unsupported');
      (err as any).code = ERROR_CODES.integrationTypeInvalid;
      throw err;
    }

    if (this.Target.isLocalResource()) {
      if (!resources[this.Target.ResourceId]) {
        const err = new Error('Integration target not found!');
        (err as any).code = ERROR_CODES.integrationTypeInvalid;
        throw err;
      }

      const resourceType = resources[this.Target.ResourceId].Type;

      if (resourceType !== this.TargetType) {
        const err = new Error('Integration target type mismatch');
        (err as any).code = ERROR_CODES.integrationTypeInvalid;
        throw err;
      }
    } else {
      const err = new Error('Non-local integration target unsupported');
      (err as any).code = ERROR_CODES.integrationTypeInvalid;
      throw err;
    }

    if ('FacetType' in definition) {
      this.FacetType = definition.FacetType;

      if (!('Facet' in definition.Locator)) {
        const sourceDefinition =
          definitions[format].ResourceTypes[this.SourceType];
        const isSingletonFacet = (
          sourceDefinition.FacetSingletons || []
        ).includes(definition.FacetType);

        if (!isSingletonFacet) {
          throw new Error(
            `Bad integration type definition for ${definition.SourceType} to ${definition.TargetType} facet ${definition.FacetType}: Locator.Facet must be defined`,
          );
        }
      }

      const source = resources[this.Source.ResourceId];

      if (facetId) {
        this.FacetId = facetId;
      } else {
        const facetProps = {};

        for (const key in definition.Locator.Facet) {
          const facetLocator = definition.Locator.Facet[key];

          if (typeof facetLocator === 'string') {
            (facetProps as any)[key] = { Ref: definition.Locator.Source };
          } else if (facetLocator.Index) {
            (facetProps as any)[key] = { Ref: path[facetLocator.Index] };
          } else if (facetLocator.Path) {
            (facetProps as any)[key] = query.value(
              facetLocator.Path,
              template,
              object,
              context,
            );
          } else if (facetLocator.Context) {
            (facetProps as any)[key] = injectContext(
              facetLocator.Context,
              context,
            );
          } else {
            throw new Error(
              `Bad integration type definition for ${definition.SourceType} to ${definition.TargetType} facet ${definition.FacetType}: Locator.Source, Locator.Source.Index, or Locator.Source.Path must be defined`,
            );
          }

          if (
            typeof facetLocator === 'object' &&
            'Transformations' in facetLocator
          ) {
            (facetProps as any)[key] = (transformations as any)[
              facetLocator.Transformations
            ]((facetProps as any)[key]);
          }
        }

        let facet = source.Facets[this.FacetType].find((facet: any) =>
          deepEqual(facet.Properties, facetProps),
        );
        if (!facet) {
          facet = new Facet(
            format,
            source,
            this.FacetType,
            template,
            facetProps,
          );
          source.Facets[this.FacetType].push(facet);
        }

        this.FacetId = facet.Id;
      }
    }

    this.Id = `${this.FacetId || this.Source.ResourceId}To${this.Target.ResourceId}`;

    this.Settings = {};

    for (const settingName in definition.Settings) {
      const settingSchema = definition.Settings[settingName];

      this.Settings[settingName] = resolveSetting(
        `integration from ${this.SourceType} to ${this.TargetType}`,
        settingName,
        settingSchema,
        template,
        object,
        {},
      );
    }

    // If object represents a resource, mark it as owned
    if (
      path &&
      path.length === 3 &&
      path[1] === 'Resources' &&
      !(
        'OwnLocatedResource' in definition.Locator ||
        definition.Locator.OwnLocatedResource
      )
    ) {
      this.addCFResource(template, path[2], 'Resource', {});
    }

    if ('SubResourceLocators' in definition) {
      context.sourceId = this.Source.ResourceId;
      context.targetId = this.Target.ResourceId;

      for (const locator of definition.SubResourceLocators) {
        const { finalBinding, contexts } = resolveSubBindings(
          template,
          object,
          locator,
          context,
        );

        for (const context of contexts) {
          const nodes = query.nodes(
            finalBinding.Path,
            template,
            object,
            context,
          );

          for (const node of nodes) {
            const resourceId = node.path.pop();
            const type = node.path.pop();

            this.addCFResource(
              template,
              resourceId,
              (type as string).replace(/s$/, ''),
              {},
            );
          }
        }
      }
    }
  }

  integrates(logicalId1: any, logicalId2: any) {
    return (
      (this.Source.isLogicalId(logicalId1) ||
        this.Source.isLogicalId(logicalId2)) &&
      (this.Target.isLogicalId(logicalId1) ||
        this.Target.isLogicalId(logicalId2))
    );
  }
}

const deleteResourcePart = (resource: any, parts: any) => {
  if (parts.length > 1) {
    deleteResourcePart(resource[parts[0]], parts.slice(1));

    // Recursively delete empty objects/arrays from leaf to root of the template
    if (Object.keys(resource[parts[0]]).length === 0) {
      delete resource[parts[0]];
    }
  } else {
    if (Array.isArray(resource)) {
      resource.splice(parts[0], 1);
    } else {
      delete resource[parts[0]];
    }
  }
};
