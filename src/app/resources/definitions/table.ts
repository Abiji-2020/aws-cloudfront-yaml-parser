export default {
  ResourceTypes: {
    table: {
      Locator: "$.Resources[?(@.Type === 'AWS::DynamoDB::Table')]",
      PhysicalNameBinding: '@.Properties.TableName',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        HashKeyName: {
          Label: 'Hash Key Name',
          ValueType: 'string',
          InputType: 'input',
          Default: 'id',
          Path: "@.Properties.KeySchema[?(@.KeyType === 'HASH')].AttributeName",
        },
        HashKeyType: {
          Label: 'Hash Key Type',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'String', Value: 'S' },
            { Label: 'Number', Value: 'N' },
            { Label: 'Binary', Value: 'B' },
          ],
          Default: 'S',
          Path: [
            "@.Properties.KeySchema[?(@.KeyType === 'HASH')].AttributeName",
            "@.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')].AttributeType",
          ],
        },
        RangeKey: {
          Label: 'Range Key',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "@.Properties.KeySchema[?(@.KeyType === 'RANGE')]",
          Transformations: ['Boolean'],
        },
        RangeKeyName: {
          Label: 'Range Key Name',
          ValueType: 'string',
          InputType: 'input',
          Default: 'timestamp',
          DependsOn: { RangeKey: true },
          Path: "@.Properties.KeySchema[?(@.KeyType === 'RANGE')].AttributeName",
        },
        RangeKeyType: {
          Label: 'Range Key Type',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'String', Value: 'S' },
            { Label: 'Number', Value: 'N' },
            { Label: 'Binary', Value: 'B' },
          ],
          Default: 'S',
          DependsOn: { RangeKey: true },
          Path: [
            "@.Properties.KeySchema[?(@.KeyType === 'RANGE')].AttributeName",
            "@.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')].AttributeType",
          ],
        },
        ExpirationKey: {
          Label: 'Expiration Key',
          Description:
            'Attribute whose value specifies expiration timestamp for record',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.TimeToLiveSpecification.Enabled',
          Transformations: ['Boolean'],
        },
        ExpirationKeyName: {
          Label: 'Expiration Key Name',
          ValueType: 'string',
          InputType: 'input',
          Default: 'expiration',
          DependsOn: { ExpirationKey: true },
          Path: '@.Properties.TimeToLiveSpecification.AttributeName',
        },
        UseExistingResource: {
          Label: 'Use Existing DynamoDB Table',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'DynamoDB Table ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default:
            'arn:aws:dynamodb:<Region>:<AWS Account ID>:table/<Table Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      DashboardProperties: {
        label: 'Table',
        paletteLabel: 'Table',
        paletteHint: 'DynamoDB Table',
        paletteResource: 'AWS::DynamoDB::Table',
        paletteInfo:
          'Use this resource type to create an Amazon DynamoDB table.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html',
        inputs: 1,
        outputs: 1,
        icon: 'table.svg',
        info: 'A key-value store table',
        deploymentProperties: {
          arn: 'arn:aws:dynamodb:%{region}:%{awsAccountId}:table/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/dynamodb/home?region=%{region}#tables:selected=%{physicalId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Hash Key', value: '%{SETTING:HashKeyName}' },
            {
              label: 'Hash Key Type',
              value: '%{SETTING:HashKeyType|DynamoDBKeyTypeToString}',
            },
            { label: 'Range Key', value: '%{SETTING:RangeKeyName}' },
            {
              label: 'Range Key Type',
              value: '%{SETTING:RangeKeyType|DynamoDBKeyTypeToString}',
            },
            { label: 'Expiration Key', value: '%{SETTING:ExpirationKey}' },
          ],
          consoleLinks: [
            {
              label: 'Request Latency',
              type: 'cloudwatchChartLink',
              title:
                "Successful Request Latency For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/DynamoDB',
              dimensions: ['TableName'],
              metrics: [
                {
                  label: 'Average Latency',
                  namespace: 'AWS/DynamoDB',
                  name: 'SuccessfulRequestLatency',
                  dimensions: { TableName: '%{physicalId}' },
                },
                {
                  label: 'Minimum Latency',
                  namespace: 'AWS/DynamoDB',
                  name: 'SuccessfulRequestLatency',
                  statistic: 'Minimum',
                  dimensions: { TableName: '%{physicalId}' },
                },
                {
                  label: 'Maximum Latency',
                  namespace: 'AWS/DynamoDB',
                  name: 'SuccessfulRequestLatency',
                  statistic: 'Maximum',
                  dimensions: { TableName: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Error Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Errors For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/DynamoDB',
              dimensions: ['TableName'],
              metrics: [
                {
                  label: 'Usage Errors',
                  namespace: 'AWS/DynamoDB',
                  name: 'UserErrors',
                  statistic: 'Sum',
                  dimensions: { TableName: '%{physicalId}' },
                },
                {
                  label: 'Service Errors',
                  namespace: 'AWS/DynamoDB',
                  name: 'SystemErrors',
                  statistic: 'Sum',
                  dimensions: { TableName: '%{physicalId}' },
                },
              ],
            },
          ],
        },
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
      SourceType: 'table',
      TargetType: 'function',
      Locator: {
        Format: {
          SAM: {
            Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'DynamoDB')]",
            Source: { Path: '@.Properties.Stream' },
            Target: { Index: 2 },
          },
          serverless: {
            Path: "$.functions[*].events[?(@.stream.type === 'dynamodb')]",
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
    table: {
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
          WithDependency: [
            { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
            { 'Fn::Sub': '${%{resourceId}.Arn}/index/*' },
          ],
          WithoutDependency: [
            {
              'Fn::Sub':
                'arn:${AWS::Partition}:dynamoDB:${AWS::Region}:${AWS::AccountId}:table/%{physicalName}',
            },
            {
              'Fn::Sub':
                'arn:${AWS::Partition}:dynamoDB:${AWS::Region}:${AWS::AccountId}:table/%{physicalName}/index/*',
            },
          ],
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'table' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
              AttributeDefinitions: [
                {
                  AttributeName: '%{SETTING:HashKeyName}',
                  AttributeType: '%{SETTING:HashKeyType}',
                },
              ],
              BillingMode: 'PAY_PER_REQUEST',
              KeySchema: [
                { AttributeName: '%{SETTING:HashKeyName}', KeyType: 'HASH' },
              ],
              StreamSpecification: { StreamViewType: 'NEW_AND_OLD_IMAGES' },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'HashKeyName' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'HASH')].AttributeName",
            "$.Resources.%{resourceId}.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')].AttributeName",
          ],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'HASH')].AttributeName",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'HashKeyType' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'HASH')].AttributeName",
            "$.Resources.%{resourceId}.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')].AttributeType",
          ],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'RangeKey', Value: true },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{resourceId}.Properties.KeySchema',
          Template: {
            AttributeName: '%{SETTING:RangeKeyName}',
            KeyType: 'RANGE',
          },
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{resourceId}.Properties.AttributeDefinitions',
          Template: {
            AttributeName: '%{SETTING:RangeKeyName}',
            AttributeType: '%{SETTING:RangeKeyType}',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'RangeKey', Value: false },
      Reactions: [
        {
          Type: 'Delete',
          Path: [
            "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'RANGE')].AttributeName",
            "$.Resources.%{resourceId}.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'RANGE')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'RangeKeyName' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'RANGE')].AttributeName",
            "$.Resources.%{resourceId}.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')].AttributeName",
          ],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'RANGE')].AttributeName",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'RangeKeyType' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.KeySchema[?(@.KeyType === 'RANGE')].AttributeName",
            "$.Resources.%{resourceId}.Properties.AttributeDefinitions[?(@.AttributeName === '%{value}')].AttributeType",
          ],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'table',
        Setting: 'ExpirationKey',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.TimeToLiveSpecification',
          Template: {
            AttributeName: '%{SETTING:ExpirationKeyName}',
            Enabled: true,
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'table',
        Setting: 'ExpirationKey',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.TimeToLiveSpecification',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'ExpirationKeyName' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.TimeToLiveSpecification.AttributeName',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'table', Setting: 'ExistingResourceData' },
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
        SourceType: 'table',
        TargetType: 'function',
      },
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
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'table',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            stream: {
              arn: { 'Fn::GetAtt': ['%{sourceId}', 'StreamArn'] },
              batchSize: '%{SETTING:BatchSize}',
              startingPosition: 'TRIM_HORIZON',
              type: 'dynamodb',
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'table', TargetType: 'function' },
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
