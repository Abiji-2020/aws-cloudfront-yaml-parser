export default {
  ResourceTypes: {
    layer: {
      OnlyFormats: ['SAM'],
      Locator: "$.Resources[?(@.Type === 'AWS::Serverless::LayerVersion')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        SourcePath: {
          Label: 'Source Path',
          Description:
            'Path to layer content source directory relative to the SAM template',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.ContentUri',
        },
        BuildMethod: {
          Label: 'Build Method',
          ValueType: 'string',
          Description: 'The system used to build the layer',
          InputType: 'select',
          Default: 'none',
          Choices: [
            'none',
            'nodejs14.x',
            'nodejs12.x',
            'nodejs10.x',
            'python3.8',
            'python3.7',
            'python3.6',
            'python2.7',
            'java11',
            'java8',
            'dotnetcore2.1',
            'dotnetcore3.1',
            'ruby2.7',
            'ruby2.5',
            'go1.x',
            'makefile',
          ],
          Path: '@.Metadata.BuildMethod',
        },
        RetentionPolicy: {
          Label: 'Delete Previous Version',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Description: 'Delete previous layer version on update',
          Path: '@.Properties.RetentionPolicy',
          Transformations: ['LambdaLayerDeletePreviousVersion'],
        },
      },
      DashboardProperties: {
        label: 'Layer',
        paletteLabel: 'Layer',
        paletteHint: 'Layer Version',
        paletteResource: 'AWS::Serverless::LayerVersion',
        paletteInfo:
          'Use this resource type to create a layer and access it from functions',
        paletteDocsLink:
          'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-layerversion.html',
        inputs: 0,
        outputs: 1,
        icon: 'ic-aws-opsworks-layers.svg',
        info: 'Creates a layer verison',
        deploymentProperties: {
          arn: '%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/lambda/home?region=%{region}#/layers/%{physicalId|LayerLink}',
          settings: [{ label: 'Logical ID', value: '%{resourceId}' }],
        },
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'layer',
      TargetType: 'function',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Layers[?(@.Ref)]",
        Source: { Path: '@.Ref' },
        Target: { Index: 2 },
      },
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'layer' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::Serverless::LayerVersion',
            Properties: {
              Description: {
                'Fn::Sub': [
                  'Stack ${StackTagName} Environment ${EnvironmentTagName} Layer ${ResourceName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              ContentUri: 'src/%{resourceId}',
              RetentionPolicy: 'Retain',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'layer', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{targetId}.Properties.Layers',
          IfNotExists: true,
          Template: { Ref: '%{sourceId}' },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'layer', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{targetId}.Properties.Layers[?(@.Ref === '%{sourceId}')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'layer', Setting: 'SourcePath' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ContentUri',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'layer', Setting: 'BuildMethod' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.BuildMethod',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'layer',
        Setting: 'BuildMethod',
        Value: 'none',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.BuildMethod',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'layer',
        Setting: 'RetentionPolicy',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.RetentionPolicy',
          Template: 'Delete',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'layer',
        Setting: 'RetentionPolicy',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.RetentionPolicy',
          Template: 'Retain',
        },
      ],
    },
  ],
};
