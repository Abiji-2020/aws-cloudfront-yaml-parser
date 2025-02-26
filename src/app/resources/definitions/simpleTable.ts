export default {
  ResourceTypes: {
    simpleTable: {
      Locator: "$.Resources[?(@.Type === 'AWS::Serverless::SimpleTable')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        PrimaryKey: {
          Label: 'Primary Key',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.PrimaryKey.Name',
        },
        PrimaryKeyType: {
          Label: 'Primary Key Type',
          ValueType: 'string',
          InputType: 'select',
          Choices: ['String', 'Number', 'Binary'],
          Path: '@.Properties.PrimaryKey.Type',
        },
        ReadThroughput: {
          Label: 'Provisioned Read Throughput',
          ValueType: 'Number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Path: '@.Properties.ProvisionedThroughput.ReadCapacityUnits',
        },
        WriteThroughput: {
          Label: 'Provisioned Write Throughput',
          ValueType: 'Number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Path: '@.Properties.ProvisionedThroughput.WriteCapacityUnits',
        },
      },
      DashboardProperties: {
        hideFromPalette: true,
        label: 'Table',
        paletteLabel: 'Table',
        paletteHint: 'DynamoDB Table',
        paletteResource: 'AWS::DynamoDB::Table',
        paletteInfo:
          'Use this resource type to create a simple Amazon DynamoDB table.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html',
        inputs: 1,
        outputs: 1,
        icon: 'table.svg',
        info: 'A key-value store table',
      },
      DefaultReferences: [
        { TABLE_NAME: { Ref: '%{resourceId}' } },
        { TABLE_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'DynamoDBCrudPolicy' }],
        IAMCapable: [
          {
            Actions: [
              'dynamodb:GetItem',
              'dynamodb:DeleteItem',
              'dynamodb:PutItem',
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:BatchGetItem',
            ],
          },
        ],
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'simpleTable',
      TargetType: 'function',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'DynamoDB')]",
        Source: { Path: '@.Properties.Stream' },
        Target: { Index: 2 },
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
          Path: '@.Properties.BatchSize',
        },
      },
    },
  ],
  PermissionTypes: {
    simpleTable: {
      SAM: {
        DynamoDBCrudPolicy: {
          TableName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          'dynamodb:GetItem',
          'dynamodb:DeleteItem',
          'dynamodb:PutItem',
          'dynamodb:Scan',
          'dynamodb:Query',
          'dynamodb:UpdateItem',
          'dynamodb:BatchWriteItem',
          'dynamodb:BatchGetItem',
        ],
        Resources: {
          WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
          WithoutDependency:
            'arn:${AWS::Partition}:dynamoDB:${AWS::Region}:${AWS::AccountId}:table/%{physicalName}',
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'simpleTable', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'DynamoDB',
            Properties: {
              Stream: { 'Fn::GetAtt': ['%{sourceId}', 'StreamArn'] },
              StartingPosition: 'TRIM_HORIZON',
              BatchSize: '%{SETTING:BatchSize}',
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateIntegrationSetting',
      Conditions: { SourceType: 'simpleTable', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{integrationId}.Properties.BatchSize',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'simpleTable', TargetType: 'function' },
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
