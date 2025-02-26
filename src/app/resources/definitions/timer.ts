export default {
  ResourceTypes: {
    timer: {
      IsImplicit: true,
      IsVirtualEventSource: true,
      Locator: {
        Format: {
          SAM: "$.Resources[?(@.Type === 'AWS::Serverless::Function' || @.Type === 'AWS::Serverless::StateMachine')].Properties.Events[?(@.Type === 'Schedule')]",
          serverless: '$.functions[*].events[?(@.schedule)]',
        },
      },
      Settings: {
        Name: {
          OnlyFormats: ['SAM'],
          Label: 'Display Name',
          ValueType: 'string',
          InputType: 'input',
        },
        ScheduleType: {
          Label: 'Type',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            'Interval',
            'Cron Expression',
            'CloudWatch Schedule Expression',
          ],
          Default: 'Interval',
          Path: {
            Format: { SAM: '@.Properties.Schedule', serverless: '@.schedule' },
          },
          Transformations: ['IntervalTypeFromSchedule'],
        },
        IntervalValue: {
          Label: 'Value',
          ValueType: 'number',
          InputType: 'input',
          Default: 1,
          Path: {
            Format: { SAM: '@.Properties.Schedule', serverless: '@.schedule' },
          },
          Transformations: ['IntervalValueFromSchedule'],
          DependsOn: { ScheduleType: 'Interval' },
        },
        IntervalUnit: {
          Label: 'Unit',
          ValueType: 'string',
          InputType: 'select',
          Choices: ['Minutes', 'Hours', 'Days'],
          Default: 'Minutes',
          Path: {
            Format: { SAM: '@.Properties.Schedule', serverless: '@.schedule' },
          },
          Transformations: ['IntervalUnitFromSchedule'],
          DependsOn: { ScheduleType: 'Interval' },
        },
        CronExpression: {
          Label: 'Cron Expression',
          Description: 'AWS schedule expression',
          ValueType: 'string',
          InputType: 'input',
          Default: '* * * * ? *',
          Path: {
            Format: { SAM: '@.Properties.Schedule', serverless: '@.schedule' },
          },
          Transformations: ['CronExpressionFromSchedule'],
          DependsOn: { ScheduleType: 'Cron Expression' },
        },
        ScheduleExpression: {
          Label: 'CloudWatch Schedule Expression',
          ValueType: 'string',
          InputType: 'input',
          Default: 'rate(1 minute)',
          IsConfigurable: true,
          Path: {
            Format: { SAM: '@.Properties.Schedule', serverless: '@.schedule' },
          },
          DependsOn: { ScheduleType: 'CloudWatch Schedule Expression' },
        },
      },
      MaximumFromSource: 1,
      DashboardProperties: {
        label: 'Timer',
        paletteLabel: 'Timer',
        paletteHint: 'CloudWatch Event Rule',
        paletteResource: 'AWS::Events::Rule',
        paletteInfo:
          'You can create rules that self-trigger on an automated schedule in CloudWatch Events using cron or rate expressions. All scheduled events use the UTC time zone and the minimum precision of schedules is 1 minute.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-rule.html',
        outputs: 1,
        icon: 'timer.svg',
        info: 'Emits an event periodically',
        deploymentProperties: {
          arn: 'arn:aws:events:%{region}:%{awsAccountId}:rule/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/cloudwatch/home?region=%{region}#rules:name=%{physicalId}',
          settings: {},
          consoleLinks: [
            {
              label: 'Invocation Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Invocation Metrics For Timer '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
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
      SourceType: 'timer',
      TargetType: 'function',
      IsVirtualEventSource: true,
      Locator: {
        Format: {
          SAM: {
            Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'Schedule')]",
            Source: { Index: 5 },
            Target: { Index: 2 },
          },
          serverless: {
            Path: '$.functions[*].events[?(@.schedule)]',
            Source: {
              Path: '@.schedule',
              Transformations: ['ServerlessEventSourceName'],
            },
            Target: { Index: 2 },
          },
        },
      },
    },
    {
      SourceType: 'timer',
      TargetType: 'stateMachine',
      IsVirtualEventSource: true,
      Locator: {
        Path: "$.Resources[?(@.Type == 'AWS::Serverless::StateMachine')].Properties.Events[?(@.Type == 'Schedule')]",
        Source: { Index: 5 },
        Target: { Index: 2 },
      },
    },
  ],
  Reactions: [
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'timer', Setting: 'ScheduleType' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.Schedule',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}].schedule',
            },
          },
          Template: '%{SETTING:ScheduleType|ScheduleExpression}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'timer', Setting: 'IntervalValue' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.Schedule',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}].schedule',
            },
          },
          Template: '%{SETTING:ScheduleType|ScheduleExpression}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'timer', Setting: 'IntervalUnit' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.Schedule',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}].schedule',
            },
          },
          Template: '%{SETTING:ScheduleType|ScheduleExpression}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'timer', Setting: 'CronExpression' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.Schedule',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}].schedule',
            },
          },
          Template: '%{SETTING:ScheduleType|ScheduleExpression}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'timer', Setting: 'ScheduleExpression' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}.Properties.Schedule',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}].schedule',
            },
          },
          Template: '%{SETTING:ScheduleType|ScheduleExpression}',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'timer',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'Schedule',
            Properties: {
              Schedule: '%{SOURCESETTING:ScheduleType|ScheduleExpression}',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'timer',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            schedule: {
              rate: '%{SOURCESETTING:ScheduleType|ScheduleExpression}',
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'timer', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}',
              serverless:
                '$.functions["%{virtualEventSourceFunctionId}"].events[%{integrationId}]',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'timer',
        TargetType: 'stateMachine',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'Schedule',
            Properties: {
              Schedule: '%{SOURCESETTING:ScheduleType|ScheduleExpression}',
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'timer',
        TargetType: 'stateMachine',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{virtualEventSourceFunctionId}.Properties.Events.%{integrationId}',
              serverless:
                '$.functions["%{virtualEventSourceFunctionId}"].events[%{integrationId}]',
            },
          },
        },
      ],
    },
  ],
};
