import cloneDeep from 'clone-deep';
import * as definitions from './definitions';
import Resource, { serverlessCFId } from './resource';
import * as manageCFResources from './manageCFResources';
import { parsePermissionsFromFunctionOrStateMachine } from './permission.js';
import * as query from './query';
import dispatch, { AddResourceAction } from './dispatch';

const newId = () =>
  Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .toUpperCase();

export default function addResource(this: any, type: any, resourceId: any) {
  if (
    !(type in definitions[this.format as 'SAM' | 'serverless'].ResourceTypes)
  ) {
    throw new Error(
      `Failed to add new resource of type ${type}: Resource type definition not found`,
    );
  }

  const definition =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[type];
  let serverlessFunctionName;

  if (!resourceId && definition.SingletonId) {
    resourceId = definition.SingletonId;
  }

  if (!resourceId) {
    if (this.format === 'serverless' && type === 'function') {
      let i = 0;
      do {
        i++;
        const suffix = i === 1 ? '' : i;
        serverlessFunctionName = `Function${suffix}`;
        resourceId = serverlessCFId('function', serverlessFunctionName);
      } while (resourceId in this.resources);
    } else {
      if (definition.IDConstraint) {
        // TODO: We will need to enhance how IDConstraint works to be able to correctly generate IDs for serverless
        resourceId = definition.IDConstraint.replace('.+', newId()).replace(
          /[\^$]/g,
          '',
        );
        if (this.format === 'serverless' && type === 'objectStore') {
          let i = 0;
          do {
            i++;
            resourceId = `S3Bucket${i}`;
          } while (resourceId in this.resources);
        }
      } else {
        let i = 0;
        do {
          i++;
          const suffix = i === 1 ? '' : i;
          // First of each resource type just displays its type
          if (definition.IDConstraint) {
            resourceId = definition.IDConstraint.replace('.+', suffix).replace(
              /[\^$]/g,
              '',
            );
          } else {
            let typeName;
            if (type === 'custom') {
              typeName = 'MyResource';
            } else if (type === 'objectStore') {
              typeName = 'Bucket';
            } else {
              typeName = type[0].toUpperCase() + type.slice(1);
            }

            resourceId = `${typeName}${suffix}`;

            // Increase suffix index if SourcePath || SchemaLocation are used by an existing resource so initialization of LogicalId and paths are sync'd
            if (
              type === 'function' ||
              type === 'edgeFunction' ||
              type === 'graphql'
            ) {
              let isPathUnique = true;
              for (let resourceKey in this.resources) {
                if (resourceKey === resourceId) {
                  continue;
                }
                if (
                  this.resources[resourceKey].Settings.SourcePath ===
                    `src/${resourceId}` ||
                  this.resources[resourceKey].Settings.ImageDockerContext ===
                    `src/${resourceId}` ||
                  this.resources[resourceKey].Settings.SchemaLocation ===
                    `${resourceId}/schema.graphql`
                ) {
                  isPathUnique = false;
                  break;
                }
              }
              if (!isPathUnique) {
                resourceId = `${typeName}${i + 1}`;
              }
            }
          }
        } while (resourceId in this.resources);
      }
    }
  }

  if (definition.SingletonId && resourceId !== definition.SingletonId) {
    throw new Error(
      `Failed to add new resource of type ${type}: Resource ID must be ${definition.SingletonId} as it is a singleton`,
    );
  }

  if (resourceId in this.resources) {
    const originalResourceType = this.resources[resourceId].Type;
    const originalDefinition =
      definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[
        originalResourceType
      ];

    // Allow upconverting from implicit to explicit resource types
    if (type !== originalDefinition.ExplicitType) {
      throw new Error(
        `Failed to add new resource of type ${type}: Resource ${resourceId} already exists`,
      );
    }
  }

  const context: any = {
    resourceId,
  };

  const settingSchemas =
    definitions[this.format as 'SAM' | 'serverless'].ResourceTypes[type]
      .Settings;

  for (const settingName in settingSchemas) {
    const defaultValue = manageCFResources.injectContext(
      cloneDeep(settingSchemas[settingName].Default),
      context,
    );
    context[`SETTING:${settingName}`] = defaultValue;
  }

  if (this.format === 'serverless' && type === 'function') {
    context[`SETTING:Name`] = serverlessFunctionName;
  }

  let resource;

  if (definition.IsVirtualEventSource || definition.IsVirtualEventTarget) {
    resource = new Resource(
      this.format,
      type,
      this.template,
      resourceId,
      {},
      null,
    );
  } else if (type === 'custom') {
    resource = new Resource(
      this.format,
      'custom',
      this.template,
      resourceId,
      {},
      null,
    );
  } else {
    const action = new AddResourceAction(this.format, type, resourceId, {
      serverlessFunctionName,
    });

    dispatch(action, this.template);

    let primaryPath;
    if (this.format === 'SAM') {
      primaryPath = `$.Resources.${resourceId}`;
    } else if (type === 'function') {
      primaryPath = `$.functions['${serverlessFunctionName}']`;
    } else {
      primaryPath = `$.resources.Resources.${resourceId}`;
    }

    const primaryNode = query.nodes(primaryPath, this.template, null, {})[0];

    // If upconverting from implicit to explicit type, keep physical name
    if (
      resourceId in this.resources &&
      this.resources[resourceId].PhysicalName
    ) {
      const physicalName = this.resources[resourceId].PhysicalName;

      query.update(
        definition.PhysicalNameBinding,
        this.template,
        primaryNode.value,
        physicalName,
      );
    }

    resource = new Resource(
      this.format,
      type,
      this.template,
      primaryNode && primaryNode.path,
      primaryNode && primaryNode.value,
      null,
    );
  }

  this.resources[resourceId] = resource;

  manageCFResources.updateOwnership(this, resource, null);
  manageCFResources.updateDefaultParameters(this.template);

  if (resource.Type === 'function') {
    const permissions =
      this.format === 'SAM'
        ? parsePermissionsFromFunctionOrStateMachine(
            this.template.Resources[resourceId],
            this.template,
            this.resources,
          )
        : parsePermissionsFromFunctionOrStateMachine(
            this.template.functions[resource.ServerlessFunctionName],
            this.template,
            this.resources,
          );

    if (permissions) {
      this.permissions[resourceId] = permissions;
    }
  }

  manageCFResources.cleanupTemplate(this);

  return resourceId;
}
