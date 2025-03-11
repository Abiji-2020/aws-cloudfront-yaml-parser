import cloneDeep from 'clone-deep';
import parse from './parse';
import deleteVirtualNetworkPlacement from './deleteVirtualNetworkPlacment';
import putVirtualNetworkPlacement from './putVirtualNetworkPalcements';
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

  deleteVirtualNetworkPlacement(resourceId: any) {
    logCall('deleteVirtualNetworkPlacement', [...arguments]);
    deleteVirtualNetworkPlacement.apply(this, resourceId);
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
