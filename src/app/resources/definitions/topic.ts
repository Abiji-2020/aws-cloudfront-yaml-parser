export default {
  ResourceTypes: {
    implicitTopic: {
      OnlyFormats: ['serverless'],
      IsImplicit: true,
      ExplicitType: 'topic',
      Locator:
        '$.functions[*].events[?(@.sns && (@.sns.length || @.sns.topicName))]',
      IDBinding: { Path: '@.sns', Transformations: ['ServerlessSnsTopicName'] },
      PhysicalNameBinding: {
        Path: '@.sns',
        Transformations: ['ServerlessSnsTopicName'],
      },
      Settings: {},
      DashboardProperties: {
        hideFromPalette: true,
        label: 'PubSub Topic',
        paletteLabel: 'PubSub Topic',
        paletteHint: 'SNS Topic',
        paletteResource: 'AWS::SNS::Topic',
        paletteInfo:
          'Use this resource type to enable applications, end-users, and devices to instantly send and receive notifications from the cloud using Amazon Simple Notification Service (AWS SNS).',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sns-topic.html',
        inputs: 1,
        outputs: 1,
        icon: 'topic.svg',
        info: 'Publishes messages to all connected resources',
        deploymentProperties: {
          arn: '%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/sns/v2/home?region=%{region}#/topics/%{physicalId}',
          settings: [{ label: 'Logical ID', value: '%{resourceId}' }],
        },
      },
      DefaultReferences: [
        { TOPIC_NAME: { 'Fn::GetAtt': ['%{resourceId}', 'TopicName'] } },
        { TOPIC_ARN: { Ref: '%{resourceId}' } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'SNSPublishMessagePolicy' }],
        IAMCapable: [{ Actions: ['sns:Publish'] }],
      },
    },
    topic: {
      Locator: "$.Resources[?(@.Type === 'AWS::SNS::Topic')]",
      IDConstraint: { Format: { SAM: null, serverless: '^SNSTopic.+$' } },
      PhysicalNameBinding: '@.Properties.TopicName',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        UseExistingResource: {
          Label: 'Use Existing SNS Topic',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'SNS Topic ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default: 'arn:aws:sns:<Region>:<AWS Account ID>:<Topic Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      DashboardProperties: {
        label: 'PubSub Topic',
        paletteLabel: 'PubSub Topic',
        paletteHint: 'SNS Topic',
        paletteResource: 'AWS::SNS::Topic',
        paletteInfo:
          'Use this resource type to enable applications, end-users, and devices to instantly send and receive notifications from the cloud using Amazon Simple Notification Service (AWS SNS).',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sns-topic.html',
        inputs: 1,
        outputs: 1,
        icon: 'topic.svg',
        info: 'Publishes messages to all connected resources',
        deploymentProperties: {
          arn: '%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/sns/v2/home?region=%{region}#/topics/%{physicalId}',
          settings: [{ label: 'Logical ID', value: '%{resourceId}' }],
          consoleLinks: [
            {
              label: 'Invocation Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Messages Published / Delivered For Topic '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/SNS',
              dimensions: ['TopicName'],
              metrics: [
                {
                  label: 'Messages Published',
                  namespace: 'AWS/SNS',
                  name: 'NumberOfMessagesPublished',
                  statistic: 'Sum',
                  dimensions: { TopicName: '%{physicalId|TopicNameFromArn}' },
                },
                {
                  label: 'Successful Deliveries',
                  namespace: 'AWS/SNS',
                  name: 'NumberOfNotificationsDelivered',
                  statistic: 'Sum',
                  dimensions: { TopicName: '%{physicalId|TopicNameFromArn}' },
                },
                {
                  label: 'Failed Deliveries',
                  namespace: 'AWS/SNS',
                  name: 'NumberOfNotificationsFailed',
                  statistic: 'Sum',
                  dimensions: { TopicName: '%{physicalId|TopicNameFromArn}' },
                },
              ],
            },
            {
              label: 'Message Sizes',
              type: 'cloudwatchChartLink',
              title:
                "Messages Sizes For Topic '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/SNS',
              dimensions: ['TopicName'],
              metrics: [
                {
                  label: 'Average',
                  namespace: 'AWS/SNS',
                  name: 'PublishSize',
                  statistic: 'Average',
                  dimensions: { TopicName: '%{physicalId|TopicNameFromArn}' },
                },
                {
                  label: 'Maximum',
                  namespace: 'AWS/SNS',
                  name: 'PublishSize',
                  statistic: 'Maximum',
                  dimensions: { TopicName: '%{physicalId|TopicNameFromArn}' },
                },
                {
                  label: 'Minimum',
                  namespace: 'AWS/SNS',
                  name: 'PublishSize',
                  statistic: 'Minimum',
                  dimensions: { TopicName: '%{physicalId|TopicNameFromArn}' },
                },
              ],
            },
          ],
        },
      },
      DefaultReferences: [
        { TOPIC_NAME: { 'Fn::GetAtt': ['%{resourceId}', 'TopicName'] } },
        { TOPIC_ARN: { Ref: '%{resourceId}' } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'SNSPublishMessagePolicy' }],
        IAMCapable: [{ Actions: ['sns:Publish'] }],
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::SQS::QueuePolicy',
      targetIsIntegration: true,
      integrationSourceType: 'AWS::SNS::Topic',
      integrationTargetType: 'AWS::SQS::Queue',
    },
  ],
  IntegrationTypes: [
    {
      SourceType: 'topic',
      TargetType: 'function',
      Locator: {
        Format: {
          SAM: {
            Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'SNS')]",
            Source: { Path: '@.Properties.Topic' },
            Target: { Index: 2 },
          },
          serverless: {
            Path: '$.functions[*].events[?(@.sns && (@.sns.length || @.sns.topicName))]',
            Source: {
              Path: '@.sns',
              Transformations: [
                'ServerlessSnsTopicName',
                'ServerlessSnsTopicResourceId',
              ],
            },
            Target: { Index: 2 },
          },
        },
      },
    },
    {
      SourceType: 'implicitTopic',
      TargetType: 'function',
      Locator: {
        Path: '$.functions[*].events[?(@.sns && (@.sns.length || @.sns.topicName))]',
        Source: { Path: '@.sns', Transformations: ['ServerlessSnsTopicName'] },
        Target: { Index: 2 },
      },
    },
    {
      SourceType: 'topic',
      TargetType: 'queue',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::SNS::Topic')].Properties.Subscription[?(@.Protocol === 'sqs')]",
        Source: { Index: 2 },
        Target: { Path: '@.Endpoint' },
      },
    },
  ],
  PermissionTypes: {
    topic: {
      SAM: {
        SNSPublishMessagePolicy: {
          TopicName: {
            WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'TopicName'] },
            WithoutDependency: '%{physicalName}',
          },
        },
        SNSCrudPolicy: {
          TopicName: {
            WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'TopicName'] },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          'sns:AddPermission',
          'sns:ConfirmSubscription',
          'sns:GetTopicAttributes',
          'sns:ListSubscriptionsByTopic',
          'sns:Publish',
          'sns:RemovePermission',
          'sns:SetTopicAttributes',
        ],
        Resources: {
          WithDependency: { Ref: '%{resourceId}' },
          WithoutDependency: {
            'Fn::Sub': [
              'arn:${AWS::Partition}:sns:${AWS::Region}:${AWS::AccountId}:${physicalName}',
              { physicalName: '%{physicalName}' },
            ],
          },
        },
      },
    },
    implicitTopic: {
      SAM: {
        SNSPublishMessagePolicy: {
          TopicName: {
            WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'TopicName'] },
            WithoutDependency: '%{physicalName}',
          },
        },
        SNSCrudPolicy: {
          TopicName: {
            WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'TopicName'] },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          'sns:AddPermission',
          'sns:ConfirmSubscription',
          'sns:GetTopicAttributes',
          'sns:ListSubscriptionsByTopic',
          'sns:Publish',
          'sns:RemovePermission',
          'sns:SetTopicAttributes',
        ],
        Resources: {
          WithDependency: { Ref: '%{resourceId}' },
          WithoutDependency: {
            'Fn::Sub': [
              'arn:${AWS::Partition}:sns:${AWS::Region}:${AWS::AccountId}:${physicalName}',
              { physicalName: '%{physicalName}' },
            ],
          },
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'topic' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::SNS::Topic',
            Properties: {
              TopicName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(215)}',
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'topic', Setting: 'ExistingResourceData' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
        {
          Type: 'Upsert',
          Path: "$.Conditions.%{resourceId}CreateNewResource['Fn::Equals'][1]",
          Transformations: ['Boolean', 'ToString'],
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'topic',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'SNS',
            Properties: {
              Topic: { Ref: '%{sourceId}' },
              Region: {
                'Fn::Select': [
                  3,
                  { 'Fn::Split': [':', { Ref: '%{sourceId}' }] },
                ],
              },
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'topic',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            sns: {
              topicName: '%{sourceId|ServerlessEventSourceName}',
              arn: { Ref: '%{sourceId}' },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'topic', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{targetId}.Properties.Events.%{integrationId}',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}]',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'implicitTopic', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            sns: {
              topicName: '%{sourceId|ServerlessEventSourceName}',
              arn: { Ref: '%{sourceId}' },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'implicitTopic', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{targetId}.Properties.Events.%{integrationId}',
              serverless:
                '$.functions["%{serverlessFunctionId}"].events[%{integrationId}]',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'topic', TargetType: 'queue' },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.Subscription',
          Template: {
            Endpoint: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
            Protocol: 'sqs',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::SQS::QueuePolicy',
            Properties: {
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: { Service: 'sns.amazonaws.com' },
                    Action: 'sqs:SendMessage',
                    Resource: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
                    Condition: {
                      ArnEquals: { 'aws:SourceArn': { Ref: '%{sourceId}' } },
                    },
                  },
                ],
              },
              Queues: [{ Ref: '%{targetId}' }],
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'topic', TargetType: 'queue' },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.Subscription[?(@.Protocol === 'sqs' && @.Endpoint['Fn::GetAtt'][0] === '%{targetId}')]",
        },
      ],
    },
  ],
};
