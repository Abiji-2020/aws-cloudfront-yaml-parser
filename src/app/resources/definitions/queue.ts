export default {
  ResourceTypes: {
    queue: {
      Locator: "$.Resources[?(@.Type === 'AWS::SQS::Queue')]",
      PhysicalNameBinding: '@.Properties.QueueName',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Fifo: {
          Label: 'FIFO Queue',
          Description:
            'Create a FIFO queue, where messages are delivered in the same order they are received',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.FifoQueue',
          Transformations: ['Boolean'],
        },
        MessageRetentionPeriod: {
          Label: 'Message Retention Period',
          Description:
            'Number of seconds messages are retained before being expiring',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Default: 345600,
          AwsDefault: 345600,
          Min: 60,
          Max: 1209600,
          Path: '@.Properties.MessageRetentionPeriod',
        },
        UseExistingResource: {
          Label: 'Use Existing SQS Queue',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'SQS Queue ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default: 'arn:aws:sqs:<Region>:<AWS Account ID>:<Queue Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      FacetSettings: {
        subscription: {
          BatchSize: {
            Label: 'Batch Size',
            Description:
              'Maximum number of messages to include when invoking the function',
            ValueType: 'number',
            InputType: 'input',
            IsConfigurable: true,
            Min: 1,
            Max: 10,
            Default: 1,
            Path: {
              Format: {
                SAM: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'SQS' && @.Properties.Queue['Fn::GetAtt'][0] === '%{resourceId}')].Properties.BatchSize",
                serverless:
                  "$.functions[?(@.events.sqs.arn['Fn::GetAtt'][0] === '%{resourceId}')].events.sqs.batchSize",
              },
            },
          },
        },
        dlq: {
          MaxAttempts: {
            Label: 'Maximum Attempts',
            Description:
              'Maximum attempts to deliver message before sending to DLQ',
            ValueType: 'number',
            InputType: 'input',
            IsConfigurable: true,
            Min: 1,
            Default: 5,
            Path: '$.Resources.%{resourceId}.Properties.RedrivePolicy.maxReceiveCount',
          },
        },
      },
      FacetSingletons: ['subscription', 'dlq'],
      Metrics: {
        namespace: 'AWS/SQS',
        metrics: [
          { type: 'ApproximateAgeOfOldestMessage', statistics: ['Maximum'] },
          {
            type: 'ApproximateNumberOfMessagesVisible',
            statistics: ['Maximum'],
          },
          { type: 'NumberOfMessagesSent', statistics: ['Sum'] },
          { type: 'NumberOfMessagesReceived', statistics: ['Sum'] },
        ],
        dimensions: [
          { name: 'QueueName', value: '%{physicalId|NameFromSQSPhysicalId}' },
        ],
      },
      DashboardProperties: {
        label: 'Job Queue',
        paletteLabel: 'Job Queue',
        paletteHint: 'SQS Queue',
        paletteResource: 'AWS::SQS::Queue',
        paletteInfo:
          'Use this resource to hold messages to perform background jobs.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-sqs-queue.html',
        inputs: 1,
        outputs: 0,
        icon: 'job-queue.svg',
        zIndex: -50,
        facetLabels: { subscription: 'Subscription', dlq: 'DLQ' },
        info: 'Holds messages to perform background jobs',
        deploymentProperties: {
          arn: 'arn:aws:sqs:%{region}:%{awsAccountId}:%{physicalId|NameFromSQSPhysicalId}',
          arnLink:
            'https://console.aws.amazon.com/sqs/home?region=%{region}#queue-browser:selected=%{physicalId}',
          name: '%{PROPERTY:Name}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'FIFO Queue', value: '%{SETTING:Fifo|ToString}' },
            {
              label: 'Message Retention Period (s)',
              value: '%{SETTING:MessageRetentionPeriod|Default(345600)}',
            },
            { label: 'Queue URL', value: '%{physicalId}' },
          ],
          consoleLinks: [
            {
              label: 'Age Of Oldest Message',
              type: 'cloudwatchChartLink',
              title:
                "Age Of Oldest Message For Queue '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/SQS',
              dimensions: ['QueueName'],
              metrics: [
                {
                  label: 'Age Of Oldest Message',
                  namespace: 'AWS/SQS',
                  name: 'ApproximateAgeOfOldestMessage',
                  statistic: 'Maximum',
                  dimensions: {
                    QueueName: '%{physicalId|NameFromSQSPhysicalId}',
                  },
                },
              ],
            },
            {
              label: 'Queue Length',
              type: 'cloudwatchChartLink',
              title:
                "Queue Length For Queue '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/SQS',
              dimensions: ['QueueName'],
              metrics: [
                {
                  label: 'Total Messages',
                  expression: 'SUM(METRICS())',
                  statistic: 'Maximum',
                },
                {
                  label: 'Visible Messages',
                  namespace: 'AWS/SQS',
                  name: 'ApproximateNumberOfMessagesVisible',
                  statistic: 'Maximum',
                  dimensions: {
                    QueueName: '%{physicalId|NameFromSQSPhysicalId}',
                  },
                },
                {
                  label: 'Not Visible Messages',
                  namespace: 'AWS/SQS',
                  name: 'ApproximateNumberOfMessagesNotVisible',
                  statistic: 'Maximum',
                  dimensions: {
                    QueueName: '%{physicalId|NameFromSQSPhysicalId}',
                  },
                },
                {
                  label: 'Delayed Messages',
                  namespace: 'AWS/SQS',
                  name: 'ApproximateNumberOfMessagesDelayed',
                  statistic: 'Maximum',
                  dimensions: {
                    QueueName: '%{physicalId|NameFromSQSPhysicalId}',
                  },
                },
              ],
            },
            {
              label: 'Messages Sent / Received',
              type: 'cloudwatchChartLink',
              title:
                "Messages Sent / Received For Queue '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/SQS',
              dimensions: ['QueueName'],
              metrics: [
                {
                  label: 'Messages Sent',
                  namespace: 'AWS/SQS',
                  name: 'NumberOfMessagesSent',
                  statistic: 'Sum',
                  dimensions: {
                    QueueName: '%{physicalId|NameFromSQSPhysicalId}',
                  },
                },
                {
                  label: 'Messages Received',
                  namespace: 'AWS/SQS',
                  name: 'NumberOfMessagesReceived',
                  statistic: 'Sum',
                  dimensions: {
                    QueueName: '%{physicalId|NameFromSQSPhysicalId}',
                  },
                },
              ],
            },
          ],
        },
      },
      DefaultReferences: [
        { QUEUE_NAME: { 'Fn::GetAtt': ['%{resourceId}', 'QueueName'] } },
        { QUEUE_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
        { QUEUE_URL: { Ref: '%{resourceId}' } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'SQSSendMessagePolicy' }],
        IAMCapable: [{ Actions: ['sqs:SendMessage*'] }],
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'queue',
      TargetType: 'function',
      FacetType: 'subscription',
      Locator: {
        Format: {
          SAM: {
            Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'SQS')]",
            Source: { Path: '@.Properties.Queue' },
            Target: { Index: 2 },
          },
          serverless: {
            Path: '$.functions[*].events[?(@.sqs)]',
            Source: {
              Path: '@.sqs',
              Transformations: ['ServerlessSqsQueueResourceId'],
            },
            Target: { Index: 2 },
          },
        },
      },
    },
    {
      SourceType: 'queue',
      TargetType: 'queue',
      FacetType: 'dlq',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::SQS::Queue')].Properties.RedrivePolicy.deadLetterTargetArn",
        Source: { Index: 2 },
        Target: { Path: "@['Fn::GetAtt'][0]" },
      },
    },
  ],
  PermissionTypes: {
    queue: {
      SAM: {
        SQSSendMessagePolicy: {
          QueueName: {
            WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'QueueName'] },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          'sqs:AddPermission',
          'sqs:ChangeMessageVisibility',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes',
          'sqs:GetQueueUrl',
          'sqs:ListDeadLetterSourceQueues',
          'sqs:ListQueueTags',
          'sqs:PurgeQueue',
          'sqs:ReceiveMessage',
          'sqs:RemovePermission',
          'sqs:SendMessage',
          'sqs:SetQueueAttributes',
          'sqs:TagQueue',
          'sqs:UntagQueue',
        ],
        Resources: {
          WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
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
      Conditions: { ResourceType: 'queue' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::SQS::Queue',
            Properties: { KmsMasterKeyId: 'alias/aws/sqs' },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'queue', Setting: 'Fifo', Value: true },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.FifoQueue',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ContentBasedDeduplication',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'queue', Setting: 'Fifo', Value: false },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.FifoQueue',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.ContentBasedDeduplication',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'queue', Setting: 'MessageRetentionPeriod' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.MessageRetentionPeriod',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'queue', Setting: 'ExistingResourceData' },
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
        SourceType: 'queue',
        TargetType: 'function',
        FacetType: 'subscription',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'SQS',
            Properties: {
              Queue: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
              BatchSize: '%{FACETSETTING:BatchSize}',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'queue',
        TargetType: 'function',
        FacetType: 'subscription',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            sqs: {
              arn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
              batchSize: '%{FACETSETTING:BatchSize}',
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'queue',
        FacetType: 'subscription',
        Setting: 'BatchSize',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: [
                "$.Resources[?(@.Type === 'AWS::Serverless::Function' && @.Properties.Events)]",
                "$.Resources.%{keys[0]}.Properties.Events[?(@.Type === 'SQS' && @.Properties.Queue['Fn::GetAtt'][0] === '%{resourceId}')]",
                '$.Resources.%{keys[0]}.Properties.Events.%{keys[1]}.Properties.BatchSize',
              ],
              serverless: [
                "$.functions[?(@.events.sqs.arn['Fn::GetAtt'][0] === '%{resourceId}')]",
                '$.functions.%{keys[0]}.events.sqs.batchSize',
              ],
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'queue',
        TargetType: 'function',
        FacetType: 'subscription',
      },
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
      Conditions: {
        SourceType: 'queue',
        TargetType: 'queue',
        FacetType: 'dlq',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.RedrivePolicy',
          Template: {
            deadLetterTargetArn: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
            maxReceiveCount: '%{FACETSETTING:MaxAttempts}',
          },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'queue',
        FacetType: 'dlq',
        Setting: 'MaxAttempts',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.RedrivePolicy',
            '$.Resources.%{resourceId}.Properties.RedrivePolicy.maxReceiveCount',
          ],
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'queue',
        TargetType: 'queue',
        FacetType: 'dlq',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.RedrivePolicy',
        },
      ],
    },
  ],
};
