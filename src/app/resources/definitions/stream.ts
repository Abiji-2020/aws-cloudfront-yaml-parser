export default {
  ResourceTypes: {
    stream: {
      Locator: "$.Resources[?(@.Type === 'AWS::Kinesis::Stream')]",
      PhysicalNameBinding: '@.Properties.Name',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        ShardCount: {
          Label: 'Number Of Shards',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Path: '@.Properties.ShardCount',
          Default: 1,
        },
        UseExistingResource: {
          Label: 'Use Existing Kinesis Stream',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'Kinesis Stream ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default:
            'arn:aws:kinesis:<Region>:<AWS Account ID>:stream/<Table Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      Metrics: {
        namespace: 'AWS/Kinesis',
        metrics: [
          {
            type: 'IncomingRecords',
            label: 'Enqueued',
            unit: 'Count',
            factors: { a: 'GetRecords.Records' },
          },
          {
            type: 'GetRecords.Records',
            label: 'Fetches',
            unit: 'Count',
            factors: { a: 'IncomingRecords' },
          },
        ],
        dimensions: [{ name: 'StreamName', value: '%{physicalId}' }],
      },
      DashboardProperties: {
        label: 'Stream',
        paletteLabel: 'Stream',
        paletteHint: 'Kinesis Data Stream',
        paletteResource: 'AWS::Kinesis::Stream',
        paletteInfo:
          'Use this resource type to collect, process, and analyze video and data streams in real time using Amazon Kinesis.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-kinesis-stream.html',
        inputs: 1,
        outputs: 1,
        icon: 'stream.svg',
        info: 'Holdes messages in a high-throughput, ordered queue for further processing',
        deploymentProperties: {
          arn: 'arn:aws:kinesis:%{region}:%{awsAccountId}:stream/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/kinesis/home?region=%{region}#/streams/details?streamName=%{physicalId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Shard Count', value: '%{SETTING:ShardCount}' },
          ],
          consoleLinks: [
            {
              label: 'Throughput Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Throughput Metrics For Stream '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Kinesis',
              dimensions: ['StreamName'],
              metrics: [
                {
                  label: 'Enqueued',
                  namespace: 'AWS/Kinesis',
                  name: 'IncomingRecords',
                  statistic: 'Sum',
                  dimensions: { StreamName: '%{physicalId}' },
                },
                {
                  label: 'Fetched',
                  namespace: 'AWS/Kinesis',
                  name: 'GetRecords.Records',
                  statistic: 'Sum',
                  dimensions: { StreamName: '%{physicalId}' },
                },
              ],
            },
          ],
        },
      },
      DefaultReferences: [
        { STREAM_NAME: { Ref: '%{resourceId}' } },
        { STREAM_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
      DefaultPermissions: {
        SAMCapable: [
          { PolicyName: 'KinesisCrudPolicy' },
          { PolicyName: 'KinesisStreamReadPolicy' },
        ],
        IAMCapable: [
          {
            Actions: [
              'kinesis:AddTagsToStream',
              'kinesis:CreateStream',
              'kinesis:DecreaseStreamRetentionPeriod',
              'kinesis:DeleteStream',
              'kinesis:DescribeStream',
              'kinesis:GetShardIterator',
              'kinesis:IncreaseStreamRetentionPeriod',
              'kinesis:ListTagsForStream',
              'kinesis:MergeShards',
              'kinesis:PutRecord',
              'kinesis:PutRecords',
              'kinesis:SplitShard',
              'kinesis:RemoveTagsFromStream',
              'kinesis:DescribeStream',
              'kinesis:GetRecords',
            ],
          },
          {
            Actions: ['kinesis:ListStreams', 'kinesis:DescribeLimits'],
            Resources: [
              {
                'Fn::Sub':
                  'arn:${AWS::Partition}:kinesis:${AWS::Region}:${AWS::AccountId}:stream/*',
              },
            ],
          },
        ],
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'stream',
      TargetType: 'function',
      Locator: {
        Format: {
          SAM: {
            Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'Kinesis')]",
            Source: { Path: '@.Properties.Stream' },
            Target: { Index: 2 },
          },
          serverless: {
            Path: "$.functions[*].events[?(@.stream.type === 'kinesis')]",
            Source: { Path: '@.stream.arn' },
            Target: { Index: 2 },
          },
        },
      },
      Settings: {
        BatchSize: {
          Label: 'Batch Size',
          Description:
            'Maximum number of messages to include when invoking the function',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Max: 10000,
          Default: 1,
          Path: {
            Format: {
              SAM: '@.Properties.BatchSize',
              serverless: '@.stream.batchSize',
            },
          },
        },
      },
    },
  ],
  PermissionTypes: {
    stream: {
      SAM: {
        KinesisCrudPolicy: {
          StreamName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
        KinesisStreamReadPolicy: {
          StreamName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          'kinesis:AddTagsToStream',
          'kinesis:CreateStream',
          'kinesis:DecreaseStreamRetentionPeriod',
          'kinesis:DeleteStream',
          'kinesis:DescribeStream',
          'kinesis:GetShardIterator',
          'kinesis:IncreaseStreamRetentionPeriod',
          'kinesis:ListTagsForStream',
          'kinesis:MergeShards',
          'kinesis:PutRecord',
          'kinesis:PutRecords',
          'kinesis:SplitShard',
          'kinesis:RemoveTagsFromStream',
          'kinesis:ListStreams',
          'kinesis:DescribeLimits',
          'kinesis:GetRecords',
        ],
        Resources: {
          WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
          WithoutDependency:
            'arn:${AWS::Partition}:kinesis:${AWS::Region}:${AWS::Account}:stream/%{physicalName}',
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'stream' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::Kinesis::Stream',
            Properties: {
              Name: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(87)}',
              },
              ShardCount: '%{SETTING:ShardCount}',
              StreamEncryption: {
                EncryptionType: 'KMS',
                KeyId: 'alias/aws/kinesis',
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'stream', Setting: 'ShardCount' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ShardCount',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'stream', Setting: 'ExistingResourceData' },
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
        SourceType: 'stream',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'Kinesis',
            Properties: {
              Stream: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
              StartingPosition: 'TRIM_HORIZON',
              BatchSize: '%{SETTING:BatchSize}',
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'stream',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            stream: {
              arn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
              batchSize: '%{SETTING:BatchSize}',
              type: 'kinesis',
              startingPosition: 'TRIM_HORIZON',
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'stream', TargetType: 'function' },
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
  ],
};
