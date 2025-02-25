export default {
  ResourceTypes: {
    edgeFunction: {
      Locator: "$.Resources[?(@.Type === 'Custom::EdgeFunction')]",
      PhysicalNameBinding: '@.Properties.FunctionName',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Runtime: {
          Label: 'Runtime',
          Description: 'The language and version of the funciton',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            'nodejs14.x',
            'nodejs14.x (typescript)',
            'nodejs12.x',
            'nodejs12.x (typescript)',
            'nodejs10.x',
            'nodejs10.x (typescript)',
            'python3.8',
            'python3.7',
          ],
          Path: '@.Properties.Runtime',
          GlobalPath: '$.Globals.Function.Runtime',
          Default: 'nodejs14.x',
        },
        SourcePath: {
          Label: 'Source Path',
          Description: 'Path to function code directory relative to template',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.CodeUri',
        },
        HandlerNode14: {
          DependsOn: { Runtime: 'nodejs14.x' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'index.handler',
        },
        HandlerNode14Typescript: {
          DependsOn: { Runtime: 'nodejs14.x (typescript)' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'index.handler',
        },
        HandlerNode12: {
          DependsOn: { Runtime: 'nodejs12.x' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'index.handler',
        },
        HandlerNode12Typescript: {
          DependsOn: { Runtime: 'nodejs12.x (typescript)' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'index.handler',
        },
        HandlerNode10: {
          DependsOn: { Runtime: 'nodejs10.x' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'index.handler',
        },
        HandlerNode10Typescript: {
          DependsOn: { Runtime: 'nodejs10.x (typescript)' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'index.handler',
        },
        HandlerPython38: {
          DependsOn: { Runtime: 'python3.8' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'handler.handler',
        },
        HandlerPython37: {
          DependsOn: { Runtime: 'python3.7' },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.Handler',
          Default: 'handler.handler',
        },
        MemorySize: {
          Label: 'Memory',
          Description: 'Amount of memory (in MB) allocated to function',
          ValueType: 'number',
          InputType: 'input',
          Min: 128,
          Max: 10240,
          IsConfigurable: true,
          Path: '@.Properties.MemorySize',
          Default: 128,
          AwsDefault: 128,
        },
        Timeout: {
          Label: 'Timeout',
          Description: 'Maximum amount of time function is allowed to run',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Max: 30,
          Path: '@.Properties.Timeout',
          Default: 5,
          AwsDefault: 3,
        },
        Permissions: {
          Label: 'Permissions',
          Description: 'IAM permission statements',
          ValueType: 'object',
          InputType: 'yaml',
          Path: [
            "@.Properties.Role['Fn::GetAtt'][0]",
            '$.Resources.%{value}.Properties.Policies',
          ],
        },
        Environment: {
          Label: 'Environment Variables',
          ValueType: 'object',
          Type: 'map',
          ValuesType: 'string',
          Fields: [
            { Label: 'Key', ValueType: 'string', InputType: 'input' },
            {
              Label: 'Value',
              ValueType: 'string',
              InputType: 'input',
              IsConfigurable: true,
            },
          ],
          Path: '@.Properties.Environment.Variables',
        },
      },
      DashboardProperties: {
        UnavailableInFormats: ['serverless'],
        label: 'Edge Function',
        paletteLabel: 'Edge Function',
        paletteHint: 'Lambda@Edge Function',
        paletteResource: 'Lambda@Edge',
        paletteInfo:
          "Use this resource type to declare an AWS Lambda@Edge function. When doing so, you need to specify the function's handler and runtime.",
        paletteDocsLink:
          'https://aws.amazon.com/developer/application-security-performance/articles/cloudfront-edge-functions/',
        inputs: 1,
        outputs: 1,
        icon: 'function.svg',
        info: 'Executes code for each message received',
        deploymentProperties: {
          arn: 'arn:aws:lambda:us-east-1:%{awsAccountId}:function:%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/%{physicalId}',
          name: '%{SETTING:Name}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Timeout', value: '%{SETTING:Timeout}' },
            { label: 'Memory Size', value: '%{SETTING:MemorySize}' },
            { label: 'Runtime', value: '%{SETTING:Runtime}' },
          ],
        },
      },
      DefaultReferences: [
        { EDGE_FUNCTION_NAME: { Ref: '%{resourceId}' } },
        { EDGE_FUNCTION_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
        {
          EDGE_FUNCTION_VERSION: { 'Fn::GetAtt': ['%{resourceId}', 'Version'] },
        },
        {
          EDGE_FUNCTION_VERSION_ARN: {
            'Fn::GetAtt': ['%{resourceId}', 'VersionArn'],
          },
        },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'LambdaInvokePolicy' }],
        IAMCapable: [{ Actions: ['lambda:InvokeFunction'] }],
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'Custom::EdgeFunction',
      targetType: 'AWS::IAM::Role',
      stopChaining: true,
    },
  ],
  PermissionTypes: {
    edgeFunction: {
      SAM: {
        LambdaInvokePolicy: {
          FunctionName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: ['lambda:InvokeFunction'],
        Resources: {
          WithDependency: [{ 'Fn::GetAtt': ['%{resourceId}', 'Arn'] }],
          WithoutDependency: [
            {
              'Fn::Sub': [
                'arn:${AWS::Partition}:lambda:us-east-1:${AWS::AccountId}:function:${FunctionName}',
                { FunctionName: '%{physicalName}' },
              ],
            },
          ],
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'edgeFunction' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'Custom::EdgeFunction',
            Properties: {
              ServiceToken: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              FunctionName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(23)}',
              },
              Description: {
                'Fn::Sub': [
                  'Stack ${StackTagName} Environment ${EnvironmentTagName} Function ${ResourceName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              CodeUri: 'src/%{resourceId}',
              Handler: '%{SETTING:HandlerNode12}',
              Runtime: '%{SETTING:Runtime}',
              MemorySize: '%{SETTING:MemorySize}',
              Timeout: '%{SETTING:Timeout}',
              Tracing: 'Active',
              Role: { 'Fn::GetAtt': ['%{resourceId}Role', 'Arn'] },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Role',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              RoleName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(23)}',
              },
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: {
                    Service: [
                      'lambda.amazonaws.com',
                      'edgelambda.amazonaws.com',
                    ],
                  },
                  Action: 'sts:AssumeRole',
                },
              },
              ManagedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess',
              ],
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'Name' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources.%{resourceId}.Properties.Description['Fn::Sub'][1].ResourceName",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'SourcePath' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CodeUri',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'Runtime' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Runtime',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'edgeFunction',
        Setting: 'Runtime',
        Value: 'nodejs14.x (typescript)',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
        {
          Type: 'Upsert',
          Template: 'nodejs14.x',
          Path: '$.Resources.%{resourceId}.Properties.Runtime',
        },
        {
          Type: 'Upsert',
          Template: 'typescript',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'edgeFunction',
        Setting: 'Runtime',
        Value: 'nodejs12.x (typescript)',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
        {
          Type: 'Upsert',
          Template: 'nodejs12.x',
          Path: '$.Resources.%{resourceId}.Properties.Runtime',
        },
        {
          Type: 'Upsert',
          Template: 'typescript',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'edgeFunction',
        Setting: 'Runtime',
        Value: 'nodejs10.x (typescript)',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
        {
          Type: 'Upsert',
          Template: 'nodejs10.x',
          Path: '$.Resources.%{resourceId}.Properties.Runtime',
        },
        {
          Type: 'Upsert',
          Template: 'typescript',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'HandlerNode14' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'edgeFunction',
        Setting: 'HandlerNode14Typescript',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'HandlerNode12' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'edgeFunction',
        Setting: 'HandlerNode12Typescript',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'HandlerNode10' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'edgeFunction',
        Setting: 'HandlerNode10Typescript',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'HandlerPython38' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'HandlerPython37' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'MemorySize' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.MemorySize',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'Timeout' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Timeout',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'Permissions' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.Role['Fn::GetAtt'][0]",
            '$.Resources.%{value}.Properties.Policies',
          ],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'edgeFunction', Setting: 'Environment' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Environment.Variables',
        },
      ],
    },
  ],
};
