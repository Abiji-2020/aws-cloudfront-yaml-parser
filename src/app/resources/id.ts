import deepEqual from 'deep-equal';
import getStackFormat from '../utils/getStackFormat';
import { findOwnerResourceId, DEFAULT_PARAMETERS } from './manageCFResources';
import { serverlessCFId } from './resource';
import * as definitions from './definitions';

export const TYPES = {
  LOGICAL: 'logical',
  PHYSICAL: 'physical',
  PARAMETER: 'parameter',
  VIRTUAL: 'virtual',
};

export default class Id {
  Local?: any;
  Type?: any;
  ResourceId?: any;
  ParameterId?: any;
  IsVirtualReferenceResource?: any;
  ServerlessFunctionName?: any;

  constructor(
    value: any,
    template: any,
    resources: any,
    findResourceOwner = true,
  ) {
    this.Local = false;

    const resourceIds = [];
    const serverlessFunctionNames = {};
    let cfTemplate = template;

    const format = getStackFormat(template);
    if (format === 'serverless') {
      for (const fnId in template.functions || {}) {
        const resourceId = serverlessCFId('function', fnId);
        resourceIds.push(resourceId);
        (serverlessFunctionNames as any)[resourceId] = fnId;
      }

      cfTemplate = template.resources || {};
    }

    Array.prototype.push.apply(
      resourceIds,
      Object.keys(cfTemplate.Resources || {}),
    );

    if (typeof value === 'string') {
      this.Type = TYPES.PHYSICAL;

      const resource = Object.keys(resources)
        .map((resourceId) => resources[resourceId])
        .filter(
          (resource) =>
            'PhysicalName' in resource &&
            typeof resource.PhysicalName === 'string',
        )
        .find((resource) => value.includes(resource.PhysicalName));

      if (resource) {
        this.Local = true;
        this.ResourceId = resource.Id;
      }
    } else {
      if ('Ref' in value) {
        if (resourceIds.includes(value.Ref)) {
          this.Type = TYPES.LOGICAL;
          this.Local = true;
          this.ResourceId = value.Ref;
        } else if (
          value.Ref in (cfTemplate.Parameters || {}) ||
          value.Ref in DEFAULT_PARAMETERS
        ) {
          this.Type = TYPES.PARAMETER;
          this.Local = true;
          this.ParameterId = value.Ref;
        } else {
          this.Type = TYPES.VIRTUAL;
          this.Local = true;
          this.ResourceId = value.Ref;

          const virtualResource = resources[this.ResourceId];
          if (virtualResource && format && format !== 'Canvas') {
            const definition =
              definitions[format].ResourceTypes[virtualResource.Type];
            if (definition.IsVirtualReferenceResource) {
              this.IsVirtualReferenceResource = true;
            }
          }
        }
      } else if ('Fn::GetAtt' in value) {
        if (resourceIds.includes(value['Fn::GetAtt'][0])) {
          this.Type = TYPES.LOGICAL;
          this.Local = true;
          this.ResourceId = findResourceOwner
            ? findOwnerResourceId(value['Fn::GetAtt'][0], resources)
            : value['Fn::GetAtt'][0];
        } else {
          this.Type = TYPES.VIRTUAL;
          this.Local = true;
          this.ResourceId = value['Fn::GetAtt'][0];
        }
      } else if ('Fn::Sub' in value) {
        const resourceId = Object.keys(resources).find((resourceId) => {
          const logicalIdExpression = new RegExp(
            `[$#]\\{${resourceId}(\\.[^}]+)?\\}`,
          );

          return logicalIdExpression.test(value['Fn::Sub']);
        });

        if (resourceId) {
          this.Type = TYPES.LOGICAL;
          this.Local = true;
          this.ResourceId = findResourceOwner
            ? findOwnerResourceId(resourceId, resources)
            : resourceId;
        } else {
          this.Type = TYPES.PHYSICAL;

          const resource = Object.keys(resources)
            .map((resourceId) => resources[resourceId])
            .filter((resource) => 'PhysicalName' in resource)
            .find((resource) =>
              isPhysicalNameInIdObject(value, resource.PhysicalName),
            );

          if (resource) {
            this.Local = true;
            this.ResourceId = findResourceOwner
              ? findOwnerResourceId(resource.Id, resources)
              : resource.Id;
          }
        }
      } else if (
        'Fn::If' in value &&
        value['Fn::If'][0].endsWith('UseExistingResource')
      ) {
        const id = new Id(value['Fn::If'][2], template, resources);
        return id;
      } else {
        this.Type = TYPES.PHYSICAL;

        const resource = Object.keys(resources)
          .map((resourceId) => resources[resourceId])
          .filter((resource) => 'PhysicalName' in resource)
          .find((resource) =>
            isPhysicalNameInIdObject(value, resource.PhysicalName),
          );

        if (resource) {
          this.Local = true;
          this.ResourceId = findResourceOwner
            ? findOwnerResourceId(resource.Id, resources)
            : resource.Id;
        }
      }

      if (
        this.Type === TYPES.LOGICAL &&
        this.ResourceId in serverlessFunctionNames
      ) {
        this.ServerlessFunctionName = (serverlessFunctionNames as any)[
          this.ResourceId
        ];
      }
    }
  }

  isLocalResource() {
    return (
      (this.Type === TYPES.LOGICAL ||
        this.Type === TYPES.PHYSICAL ||
        this.Type === TYPES.VIRTUAL) &&
      this.Local
    );
  }

  isLogicalId(id: any) {
    return (
      (this.Type === TYPES.LOGICAL || this.Type === TYPES.VIRTUAL) &&
      this.ResourceId === id
    );
  }
}

// Recursively check Id object properties to look for a physical name match
export const isPhysicalNameInIdObject = (idObject: any, physicalName: any) => {
  /* Handle cases where reference includes a hard-coded physical name:
   *
   * Resources:
   *   Topic:
   *     Type: AWS::S3::Bucket
   *     Properties:
   *       BucketName: myBucket
   *
   *   Function:
   *     Type: AWS::Serverless::Function
   *     Properties:
   *       Policies:
   *         - Effect: Allow
   *           Action: s3:GetObject
   *           Resources: !Sub arn:${AWS::Partition}:s3:::myBucket/*
   */
  if (typeof idObject === 'string' && typeof physicalName === 'string') {
    return idObject.includes(physicalName);
  }

  /* Handle cases where reference includes a Fn::Sub constructed physical name:
   *
   * Resources:
   *   Topic:
   *     Type: AWS::S3::Bucket
   *     Properties:
   *       BucketName: !Sub ${Env}-myBucket
   *
   *   Function:
   *     Type: AWS::Serverless::Function
   *     Properties:
   *       Policies:
   *         - Effect: Allow
   *           Action: s3:GetObject
   *           Resources: !Sub arn:${AWS::Partition}:s3:::${Env}-myBucket/*
   */
  if (
    typeof idObject === 'string' &&
    typeof physicalName === 'object' &&
    'Fn::Sub' in physicalName
  ) {
    const subValue = physicalName['Fn::Sub'];

    if (typeof subValue === 'string') {
      return idObject.includes(subValue);
    } else {
      if (idObject.includes(subValue[0])) {
        return true;
      }
    }
  }

  /* Handle cases where reference is constructed with arbitrary functions:
   *
   * Resources:
   *   Topic:
   *     Type: AWS::S3::Bucket
   *     Properties:
   *       BucketName: !Join
   *         - '-'
   *         - - !Ref Env
   *           - myBucket
   *
   *   Function:
   *     Type: AWS::Serverless::Function
   *     Properties:
   *       Policies:
   *         - Effect: Allow
   *           Action: sns:Publish
   *           Resources: !Sub
   *             - arn:${AWS::Partition}:s3:::${BucketName}/*
   *             - BucketName: !Join
   *               - '-'
   *               - - !Ref Env
   *                 - myBucket
   */
  if (deepEqual(idObject, physicalName)) {
    return true;
  }

  if (typeof idObject === 'object') {
    for (const key in idObject) {
      if (isPhysicalNameInIdObject(idObject[key], physicalName)) {
        return true;
      }
    }
  }

  return false;
};
