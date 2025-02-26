export default {
  ResourceTypes: {
    lambda: {
      DeployViewOnly: true,
      Locator: "$.Resources[?(@.Type === 'AWS::Lambda::Function')]",
      PhysicalNameBinding: '@.Properties.FunctionName',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is updated',
          InputType: 'input',
        },
        Runtime: {
          Label: 'Runtime',
          Description: 'The language and version of the function',
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
            'python3.6',
            'python2.7',
            'java11',
            'java8',
            'dotnetcore2.1',
            'dotnetcore3.1',
            'ruby2.5',
            'go1.x',
            'provided',
          ],
          Path: '@',
          Transformations: ['FunctionRuntime'],
          Default: 'nodejs14.x',
        },
        Layers: {
          Label: 'Layers',
          Type: 'map',
          ValueType: 'array',
          Items: {
            Label: 'Name',
            ValueType: 'string',
            InputType: 'input',
            IsConfigurable: true,
            Autocomplete: 'layers',
            Maximum: 5,
          },
          Path: '@.Properties.Layers',
        },
        MemorySize: {
          Label: 'Memory',
          Description: 'Amount of memory allocated to function',
          ValueType: 'number',
          InputType: 'select',
          Choices: [
            128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896,
            960, 1024, 1088, 1152, 1216, 1280, 1344, 1408, 1472, 1536, 1600,
            1664, 1728, 1792, 1856, 1920, 1984, 2048, 2112, 2176, 2240, 2304,
            2368, 2432, 2496, 2560, 2624, 2688, 2752, 2816, 2880, 2944, 3008,
          ],
          IsConfigurable: true,
          Path: '@.Properties.MemorySize',
          Default: 3008,
          AwsDefault: 128,
        },
        Timeout: {
          Label: 'Timeout',
          Description: 'Maximum amount of time function is allowed to run',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Max: 900,
          Path: '@.Properties.Timeout',
          Default: 30,
        },
        ReserveConcurrency: {
          Label: 'Reserve Concurrency',
          Description:
            'Reserve a bounded number of concurrent function executions',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.ReservedConcurrentExecutions',
          Transformations: ['Boolean'],
        },
        ReservedConcurrency: {
          Label: 'Reserved Concurrency',
          Description: 'Number of concurrent function executions to reserve',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { ReserveConcurrency: true },
          Path: {
            Format: {
              SAM: '@.Properties.ReservedConcurrentExecutions',
              serverless: '@.reservedConcurrency',
            },
          },
        },
        Permissions: {
          Label: 'Permissions',
          Description: 'IAM Statements',
          ValueType: 'object',
          InputType: 'yaml',
          Path: '@.Properties.Policies',
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
        hideFromPalette: true,
        label: 'Function',
        paletteLabel: 'Function',
        paletteHint: 'Lambda Function',
        paletteResource: { Format: 'AWS::Lambda::Function' },
        paletteInfo:
          "Use this resource type to declare an AWS Lambda function. When doing so, you need to specify the function's handler and runtime.",
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html',
        inputs: 1,
        outputs: 1,
        icon: 'function.svg',
        info: 'Executes code for each message received',
        deploymentProperties: {
          arn: 'arn:aws:lambda:%{region}:%{awsAccountId}:function:%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/lambda/home?region=%{region}#/functions/%{physicalId}',
          name: '%{SETTING:Name}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Timeout', value: '%{SETTING:Timeout}' },
            { label: 'Memory Size', value: '%{SETTING:MemorySize}' },
            { label: 'Runtime', value: '%{SETTING:Runtime}' },
          ],
          consoleLinks: [
            {
              label: 'Invocation Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Invocation Metrics For Function '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Lambda',
              dimensions: ['FunctionName'],
              metrics: [
                {
                  label: 'Invocations',
                  namespace: 'AWS/Lambda',
                  name: 'Invocations',
                  statistic: 'Sum',
                  dimensions: { FunctionName: '%{physicalId}' },
                },
                {
                  label: 'Errors',
                  namespace: 'AWS/Lambda',
                  name: 'Errors',
                  statistic: 'Sum',
                  dimensions: { FunctionName: '%{physicalId}' },
                },
                {
                  label: 'Throttles',
                  namespace: 'AWS/Lambda',
                  name: 'Throttles',
                  statistic: 'Sum',
                  dimensions: { FunctionName: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Execution Duration',
              type: 'cloudwatchChartLink',
              title:
                "Execution Duration For Function '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Lambda',
              dimensions: ['FunctionName'],
              metrics: [
                {
                  label: 'Average',
                  namespace: 'AWS/Lambda',
                  name: 'Duration',
                  dimensions: { FunctionName: '%{physicalId}' },
                },
                {
                  label: 'Errors',
                  namespace: 'AWS/Lambda',
                  name: 'Duration',
                  dimensions: { FunctionName: '%{physicalId}' },
                },
                {
                  label: 'Throttles',
                  namespace: 'AWS/Lambda',
                  name: 'Duration',
                  dimensions: { FunctionName: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Logs',
              type: 'cloudwatchLogsLink',
              region: '%{region}',
              logGroup: '/aws/lambda/%{physicalId}',
            },
            {
              label: 'X-Ray Traces',
              type: 'xrayTraceLink',
              region: '%{region}',
              serviceType: 'AWS::Lambda::Function',
              name: '%{physicalId}',
            },
          ],
        },
      },
      Metrics: {
        namespace: 'AWS/Lambda',
        metrics: [
          { type: 'Invocations', unit: 'Count', factors: { a: 'Errors' } },
          { type: 'Errors', unit: 'Count', factors: { a: 'Invocations' } },
          { type: 'Duration', unit: 'Milliseconds', isHidden: true },
          {
            type: 'AverageDuration',
            label: 'Duration',
            isDerived: true,
            factors: { a: 'Duration', b: 'Invocations' },
          },
          {
            type: 'ErrorRate',
            label: 'Error Rate',
            isDerived: true,
            isHidden: true,
            factors: { a: 'Errors', b: 'Invocations' },
          },
        ],
        dimensions: [{ name: 'FunctionName', value: '%{physicalId}' }],
      },
      DefaultReferences: [
        { FUNCTION_NAME: { Ref: '%{resourceId}' } },
        { FUNCTION_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'LambdaInvokePolicy' }],
        IAMCapable: [{ Actions: ['lambda:InvokeFunction'] }],
      },
    },
  },
  GroupingRules: [
    { sourceType: 'AWS::Lambda::Version', targetType: 'AWS::Lambda::Function' },
    { sourceType: 'AWS::Logs::LogGroup', targetType: 'AWS::Lambda::Function' },
  ],
  PermissionTypes: {
    lambda: {
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
                'arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:${FunctionName}',
                { FunctionName: '%{physicalName}' },
              ],
            },
          ],
        },
      },
    },
  },
  VirtualNetworkPlacements: {
    lambda: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::Lambda::Function' && @.Properties.VpcConfig)]",
      ResourceIndex: 2,
      Subnets: { Path: '@.Properties.VpcConfig.SubnetIds' },
      SecurityGroups: { Path: '@.Properties.VpcConfig.SecurityGroupIds' },
      DefaultSubnetTypes: 'private',
      Permissions: [
        {
          PermissionType: 'iamPolicy',
          PolicyName: 'AWSLambdaENIManagementAccess',
        },
      ],
    },
  },
};
