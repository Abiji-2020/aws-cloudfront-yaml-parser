export default {
  ResourceTypes: {
    eventRule: {
      IsImplicit: true,
      IsVirtualEventSource: true,
      MaximumFromSource: 1,
      Locator:
        "$.Resources[?(@.Type === 'AWS::Serverless::Function' || @.Type === 'AWS::Serverless::StateMachine')].Properties.Events[?(@.Type === 'EventBridgeRule' || @.Type === 'CloudWatchEvent')]",
      Settings: {
        Name: {
          Label: 'Display Name',
          ValueType: 'string',
          InputType: 'input',
        },
        UseDefaultEventBus: {
          Label: 'Use default Event Bus',
          Description:
            'Use the default Event Bus, or specify a different Event Bus name',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: true,
          Path: '@.Properties.EventBusName',
          Transformations: ['Boolean', 'Not'],
        },
        EventBusName: {
          Label: 'Event Bus Name',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseDefaultEventBus: false },
          Path: '@.Properties.EventBusName',
        },
        EventPattern: {
          Label: 'Event Pattern',
          Description: 'Pattern describing which events trigger the function',
          InputType: 'yaml',
          Default: { source: ['aws.health'] },
          Path: '@.Properties.Pattern',
        },
      },
      DashboardProperties: {
        label: 'Event Rule',
        paletteLabel: 'Event Rule',
        paletteHint: 'EventBridge Event Rule',
        paletteResource: 'AWS::Events::Rule',
        paletteInfo: 'Use this resource type to declare an EventBridge Rule.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-function.html',
        outputs: 1,
        icon: 'ic-aws-cloudwatch-rule.svg',
        info: 'Matches events on an Event Bus and routes them to a function for processing',
        deploymentProperties: {
          arn: 'arn:aws:events:%{region}:%{awsAccountId}:rule/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/events/home?region=%{region}#rules:name=%{physicalId}',
          settings: {},
          consoleLinks: [
            {
              label: 'Invocation Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Invocation Metrics For Rule '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Events',
              dimensions: ['RuleName'],
              metrics: [
                {
                  label: 'Invocations',
                  namespace: 'AWS/Events',
                  name: 'Invocations',
                  statistic: 'Sum',
                  dimensions: { RuleName: '%{physicalId}' },
                },
                {
                  label: 'Failures',
                  namespace: 'AWS/Events',
                  name: 'FailedInvocations',
                  statistic: 'Sum',
                  dimensions: { RuleName: '%{physicalId}' },
                },
                {
                  label: 'Throttles',
                  namespace: 'AWS/Events',
                  name: 'ThrottledRules',
                  statistic: 'Sum',
                  dimensions: { RuleName: '%{physicalId}' },
                },
              ],
            },
          ],
        },
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'eventRule',
      TargetType: 'function',
      IsVirtualEventSource: true,
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'EventBridgeRule' || @.Type === 'CloudWatchEvent')]",
        Source: { Index: 5 },
        Target: { Index: 2 },
      },
    },
    {
      SourceType: 'eventRule',
      TargetType: 'stateMachine',
      IsVirtualEventSource: true,
      Locator: {
        Path: "$.Resources[?(@.Type == 'AWS::Serverless::StateMachine')].Properties.Events[?(@.Type == 'EventBridgeRule' || @.Type == 'CloudWatchEvent')]",
        Source: { Index: 5 },
        Target: { Index: 2 },
      },
    },
  ],
  Reactions: [
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'eventRule',
        Setting: 'UseDefaultEventBus',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.EventBusName',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'eventRule', Setting: 'EventBusName' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.EventBusName',
          Template: '%{SETTING:EventBusName|ParameterToRef}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'eventRule', Setting: 'EventPattern' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.Pattern',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'eventRule', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'EventBridgeRule',
            Properties: { Pattern: { source: ['aws.health'] } },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'eventRule', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'eventRule', TargetType: 'stateMachine' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'EventBridgeRule',
            Properties: { Pattern: { source: ['aws.health'] } },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'eventRule', TargetType: 'stateMachine' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}',
        },
      ],
    },
  ],
};
