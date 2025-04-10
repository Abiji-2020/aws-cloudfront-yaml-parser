import cloneDeep from 'clone-deep';
import parse from './parse';
import deleteVirtualNetworkPlacement from './deleteVirtualNetworkPlacment';
import putVirtualNetworkPlacement from './putVirtualNetworkPalcements';
import deletePermission from './deletePermission';
import updatePermission from './updatePermission';
import addPermission from './addPermission';
import deleteIntegration from './deleteIntegration';
import updateIntegrationSetting from './updateIntegrationSetting';
import addIntegration from './addIntegration';
import deleteResource from './deleteResource';
import updateFacetSetting from './updateFacetSetting';
import getResourceSetting from './getResourceSetting';
import updateResourceSetting from './updateResourceSetting';
import validateResourceIntegrations from './validateResourceIntegrations';
import validateResourceSettings from './validateResourceSettings';
import deleteReference from './deleteReference';
import addReference from './addReference';
import addResource from './addResource';

export default class State {
  template: any;
  resources: any;
  integrations: any;
  virtualNetworkPlacements: any;
  customResourceReferences: any;
  permissions: any;
  parameters: any;
  reparseRequired!: boolean;
  format: 'SAM' | 'serverless' = 'SAM';
  constructor(
    template: any,
    format: 'SAM' | 'serverless',
    isDeployView = false,
  ) {
    if (!template || typeof template !== 'object') {
      template = {};
    }

    for (const section of [
      'Resources',
      'Conditions',
      'Parameters',
      'Metadata',
    ]) {
      if (
        section in template &&
        (!template[section] || typeof template[section] !== 'object')
      ) {
        delete template[section];
      }
    }
    this.parseAndSetInstanceState(template, format, isDeployView);
  }

  private reparseTemplate() {
    this.parseAndSetInstanceState(this.template, this.format);
  }

  private parseAndSetInstanceState(
    template: any,
    format: 'SAM' | 'serverless',
    isDeployView = false,
  ) {
    const parsed = parse(template, format, isDeployView);
    this.template = parsed.template;
    this.format = format;
    this.resources = parsed.resources;
    this.integrations = parsed.integrations;
    this.virtualNetworkPlacements = parsed.virtualNetworkPlacements;
    this.customResourceReferences = parsed.customResourceReferences;
    this.permissions = parsed.permissions;
    this.parameters = parsed.parameters;
    this.reparseRequired = false;
  }

  cfTemplate() {
    return this.format === 'SAM' ? this.template : {};
  }

  getTemplate(multiFileMode: any) {
    const template = cloneDeep(this.template, true);

    if (multiFileMode) {
      for (const resource of Object.values(template.Resources || {})) {
        if (
          (resource as any).Type === 'AWS::AppSync::GraphQLSchema' &&
          'DefinitionS3Location' in (resource as any).Properties
        ) {
          delete (resource as any).Properties.Definition;
        }

        if ((resource as any).Type === 'AWS::AppSync::Resolver') {
          if (
            'RequestMappingTemplateS3Location' in (resource as any).Properties
          ) {
            delete (resource as any).Properties.RequestMappingTemplate;
          }

          if (
            'ResponseMappingTemplateS3Location' in (resource as any).Properties
          ) {
            delete (resource as any).Properties.ResponseMappingTemplate;
          }
        }

        if (
          (resource as any).Type === 'AWS::Serverless::StateMachine' &&
          'DefinitionUri' in (resource as any).Properties
        ) {
          delete (resource as any).Properties.Definition;
        }
      }
    }

    return template;
  }

  addResource(type: any, generatdId: any) {
    logCall('addResource', [...arguments]);
    return addResource.apply(this, [...arguments] as [any, any]);
  }

  deleteVirtualNetworkPlacement(resourceId: any) {
    logCall('deleteVirtualNetworkPlacement', [...arguments]);
    deleteVirtualNetworkPlacement.apply(this, resourceId);
  }

  deletePermission(resourceId: any, permission: any) {
    logCall('deletePermission', [...arguments]);
    deletePermission.apply(this, [...arguments] as [any, any]);
  }

  updatePermission(resourceId: any, permissionIndex: any, options: any) {
    logCall('updatePermission', [...arguments]);
    updatePermission.apply(this, [...arguments] as [any, any, any]);
  }

  addPermission(resourceId: any, options: any) {
    logCall('addPermission', [...arguments]);

    addPermission.apply(this, [...arguments] as [any, any]);
  }

  validateResourceSettings(resourceId: any) {
    validateResourceSettings.apply(this, [...arguments] as [any]);
  }

  deleteReference(resourceId: any, targetId: any) {
    logCall('deleteReference', [...arguments]);

    deleteReference.apply(this, [...arguments] as [any, any]);
  }

  addReference(resourceId: any, targetId: any) {
    logCall('addReference', [...arguments]);

    addReference.apply(this, [...arguments] as [any, any]);
  }

  deleteIntegration(
    sourceResourceId: any,
    targetResourceId: any,
    facetType: any,
    facetId: any,
  ) {
    logCall('deleteIntegration', [...arguments]);

    deleteIntegration.apply(this, [...arguments] as [any, any, any, any]);

    if (this.reparseRequired) {
      this.reparseTemplate();
    }
  }

  updateIntegrationSetting(
    sourceResourceId: any,
    targetResourceId: any,
    settingName: any,
    value: any,
  ) {
    logCall('updateIntegrationSetting', [...arguments]);

    updateIntegrationSetting.apply(this, [...arguments] as [
      any,
      any,
      any,
      any,
    ]);
  }

  addIntegration(
    sourceResourceId: string,
    targetResourceId: string,
    facetType: string,
    facetId: any,
  ) {
    logCall('addIntegration', [...arguments]);

    addIntegration.apply(this, [...arguments] as [any, any, any, any]);

    if (this.reparseRequired) {
      this.reparseTemplate();
    }
  }
  deleteResource(resourceId: any) {
    logCall('deleteResource', [...arguments]);

    deleteResource.apply(this, [...arguments] as [any]);
  }

  updateFacetSetting(
    resourceId: any,
    facetType: any,
    facetId: any,
    settingName: any,
    value: any,
  ) {
    logCall('updateFacetSetting', [...arguments]);

    updateFacetSetting.apply(this, [...arguments] as [any, any, any, any, any]);

    if (this.reparseRequired) {
      this.reparseTemplate();
    }
  }

  getResourceSetting(
    resourceId: any,
    facetType: any,
    facetId: any,
    settingName: any,
    defaultOnly: any,
  ) {
    return getResourceSetting.apply(this, [...arguments] as [
      any,
      any,
      any,
      any,
      any,
    ]);
  }

  updateResourceSetting(resourceId: any, settingName: any, value: any) {
    logCall('updateResourceSetting', [...arguments]);

    updateResourceSetting.apply(this, [...arguments] as [any, any, any]);

    if (this.reparseRequired) {
      this.reparseTemplate();
    }
  }

  validateResourceIntegrations(resourceId: any) {
    validateResourceIntegrations.apply(this, [...arguments] as [any]);
  }

  putVirtualNetworkPlacement(resourceId: any, virtualNetworkId: any) {
    logCall('putVirtualNetworkPalcement', [...arguments]);

    putVirtualNetworkPlacement.apply(this, [...arguments] as [any, any]);
  }
}

const logCall = (name: any, args: any) => {
  if (console.debug) {
    console.debug(
      `State.${name}(${args.map((arg: any) => JSON.stringify(arg)).join(', ')})`,
    );
  }
};
