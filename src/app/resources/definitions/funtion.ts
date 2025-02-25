export default {
  ResourceTypes: {
    function: {
      Locator: {
        Format: {
          SAM: "$.Resources[?(@.Type === 'AWS::Serverless::Function')]",
          serverless: '$.functions[*]',
        },
      },
      PhysicalNameBinding: {
        Format: { SAM: '@.Properties.FunctionName', serverless: '@.name' },
      },
      Settings: {
        Name: {
          OnlyFormats: ['serverless'],
          Label: 'Display Name',
          ValueType: 'string',
          InputType: 'input',
        },
        LogicalId: {
          OnlyFormats: ['SAM'],
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is updated',
          InputType: 'input',
        },
        PackageType: {
          OnlyFormats: ['SAM'],
          Label: 'Package Type',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'Zip', Value: 'Zip' },
            { Label: 'Docker Image', Value: 'Image' },
          ],
          Default: 'Zip',
          AwsDefault: 'Zip',
          Path: '@.Properties.PackageType',
        },
        SourcePath: {
          OnlyFormats: ['SAM'],
          DependsOn: { PackageType: 'Zip' },
          Label: 'Source Path',
          Description:
            'Path to function code directory relative to SAM template',
          ValueType: 'string',
          InputType: 'input',
          Default: 'src/%{resourceId}',
          Path: '@.Properties.CodeUri',
        },
        ImageSource: {
          OnlyFormats: ['SAM'],
          Label: 'Docker Image Source',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'Stack Source Code', Value: 'SourceCode' },
            { Label: 'Repository Image', Value: 'RepositoryImage' },
          ],
          DependsOn: { PackageType: 'Image' },
          Path: '@.Metadata.Dockerfile',
          Transformations: ['DockerImageSource'],
          Default: 'SourceCode',
        },
        ImageDockerContext: {
          OnlyFormats: ['SAM'],
          DependsOn: { PackageType: 'Image', ImageSource: 'SourceCode' },
          Label: 'Docker Build Context',
          Description: 'Path to Docker build context relative to SAM template',
          ValueType: 'string',
          InputType: 'input',
          Default: 'src/%{resourceId}',
          Path: '@.Metadata.DockerContext',
        },
        ImageDockerfile: {
          OnlyFormats: ['SAM'],
          DependsOn: { PackageType: 'Image', ImageSource: 'SourceCode' },
          Label: 'Dockerfile',
          Description:
            'Path to Dockerfile relative to the Docker Build Context',
          ValueType: 'string',
          InputType: 'input',
          Default: 'Dockerfile',
          Path: '@.Metadata.Dockerfile',
          Transformations: ['DockerfileContextFixup'],
        },
        Image: {
          OnlyFormats: ['SAM'],
          DependsOn: { ImageSource: 'RepositoryImage' },
          Label: 'Image',
          Description: 'Docker image including tag name or ID',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.ImageUri',
          IsConfigurable: true,
        },
        Runtime: {
          Label: 'Runtime',
          Description: 'The language and version of the function',
          DependsOn: { OnlyFormats: ['SAM'], PackageType: 'Zip' },
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
            'dotnetcore3.1',
            'dotnetcore2.1',
            'ruby2.7',
            'ruby2.5',
            'go1.x',
            'provided.al2',
            'provided',
          ],
          Path: { Format: { SAM: '@', serverless: '@' } },
          Transformations: ['FunctionRuntime'],
          GlobalPath: {
            Format: {
              SAM: '$.Globals.Function.Runtime',
              serverless: '$.provider.runtime',
            },
          },
          Default: { Format: { SAM: 'nodejs14.x', serverless: null } },
        },
        HandlerNode14: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'nodejs14.x' },
              serverless: { Runtime: 'nodejs14.x' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'index.handler',
        },
        HandlerNode14Typescript: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'nodejs14.x (typescript)' },
              serverless: { Runtime: 'nodejs14.x (typescript)' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'index.handler',
        },
        HandlerNode12: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'nodejs12.x' },
              serverless: { Runtime: 'nodejs12.x' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'index.handler',
        },
        HandlerNode12Typescript: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'nodejs12.x (typescript)' },
              serverless: { Runtime: 'nodejs12.x (typescript)' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'index.handler',
        },
        HandlerNode10: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'nodejs10.x' },
              serverless: { Runtime: 'nodejs10.x' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'index.handler',
        },
        HandlerNode10Typescript: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'nodejs10.x (typescript)' },
              serverless: { Runtime: 'nodejs10.x (typescript)' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'index.handler',
        },
        HandlerPython38: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'python3.8' },
              serverless: { Runtime: 'python3.8' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'handler.handler',
        },
        HandlerPython37: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'python3.7' },
              serverless: { Runtime: 'python3.7' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'handler.handler',
        },
        HandlerPython36: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'python3.6' },
              serverless: { Runtime: 'python3.6' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'handler.handler',
        },
        HandlerPython27: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'python2.7' },
              serverless: { Runtime: 'python2.7' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'handler.handler',
        },
        HandlerJava11: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'java11' },
              serverless: { Runtime: 'java11' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'Handler::handler',
        },
        HandlerJava8: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'java8' },
              serverless: { Runtime: 'java8' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'Handler::handler',
        },
        HandlerDotNet21: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'dotnetcore2.1' },
              serverless: { Runtime: 'dotnetcore2.1' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'Function::Function.Handler::handler',
        },
        HandlerDotNet31: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'dotnetcore3.1' },
              serverless: { Runtime: 'dotnetcore3.1' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'Function::Function.Function::FunctionHandler',
        },
        HandlerRuby25: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'ruby2.5' },
              serverless: { Runtime: 'ruby2.5' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'function.handler',
        },
        HandlerRuby27: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'ruby2.7' },
              serverless: { Runtime: 'ruby2.7' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'function.handler',
        },
        HandlerGolang: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'go1.x' },
              serverless: { Runtime: 'go1.x' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: 'main',
        },
        HandlerProvided: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'provided' },
              serverless: { Runtime: 'provided' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: null,
        },
        HandlerProvidedAL2: {
          DependsOn: {
            Format: {
              SAM: { PackageType: 'Zip', Runtime: 'provided.al2' },
              serverless: { Runtime: 'provided.al2' },
            },
          },
          Label: 'Handler',
          Description: 'The method executed when function is invoked',
          ValueType: 'string',
          InputType: 'input',
          Path: {
            Format: { SAM: '@.Properties.Handler', serverless: '@.handler' },
          },
          Default: null,
        },
        UseCustomMakefile: {
          DependsOn: { OnlyFormats: ['SAM'], PackageType: 'Zip' },
          Label: 'Use Custom Makefile',
          Description:
            'Customize function build by running `make build-<Logical ID>`',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Path: '@.Metadata.BuildMethod',
          Transformations: ['Boolean'],
          Default: false,
          AwsDefault: false,
        },
        Layers: {
          OnlyFormats: ['SAM'],
          DependsOn: { PackageType: 'Zip' },
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
          Description: 'Amount of memory (in MB) allocated to function',
          ValueType: 'number',
          InputType: 'input',
          Min: 128,
          Max: 10240,
          IsConfigurable: true,
          Path: {
            Format: {
              SAM: '@.Properties.MemorySize',
              serverless: '@.memorySize',
            },
          },
          GlobalPath: {
            Format: {
              SAM: '$.Globals.Function.MemorySize',
              serverless: '$.provider.memorySize',
            },
          },
          Default: 3008,
          AwsDefault: { Format: { SAM: 128, serverless: 1024 } },
        },
        Timeout: {
          Label: 'Timeout',
          Description: 'Maximum amount of time function is allowed to run',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Max: 900,
          Path: {
            Format: { SAM: '@.Properties.Timeout', serverless: '@.timeout' },
          },
          GlobalPath: {
            Format: {
              SAM: '$.Globals.Function.Timeout',
              serverless: '$.provider.timeout',
            },
          },
          Default: 30,
          AwsDefault: { Format: { SAM: 3, serverless: 6 } },
        },
        TriggerOnFirstDeploy: {
          Label: 'Trigger On First Deploy',
          Description:
            'Function must respond to CloudFormation Custom Resource events',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "$.Resources[?(@.Type.startsWith('Custom::') && @.Properties.ServiceToken['Fn::GetAtt'][0] === '%{resourceId}')]",
          Transformations: ['Boolean'],
        },
        TriggerOnEveryDeploy: {
          Label: 'Trigger On Every Deploy',
          Description:
            'Function must respond to CloudFormation Custom Resource events',
          DependsOn: { TriggerOnFirstDeploy: true },
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "$.Resources[?(@.Type.startsWith('Custom::') && @.Properties.ServiceToken['Fn::GetAtt'][0] === '%{resourceId}')].Properties[?(@.Ref === 'DeploymentTimestamp')]",
          Transformations: ['Boolean'],
        },
        ProvisionConcurrency: {
          Label: 'Provision Concurrency',
          DependsOn: { OnlyFormats: ['SAM'], PackageType: 'Zip' },
          Description: 'Pre-provision concurrent invocations based on demand',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: {
            Format: {
              SAM: "$.Resources[?(@.Type === 'AWS::ApplicationAutoScaling::ScalableTarget' && @.DependsOn === '%{resourceId}Aliaslive')]",
              serverless: '@.provisionedConcurrency',
            },
          },
          Transformations: ['Boolean'],
        },
        AutoscaleMinCapacity: {
          OnlyFormats: ['SAM'],
          Label: 'Minimum number of pre-provisioned concurrent invocations',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 0,
          Default: 1,
          Path: '$.Resources.%{resourceId}ScalableTarget.Properties.MinCapacity',
          DependsOn: { ProvisionConcurrency: true },
        },
        AutoscaleMaxCapacity: {
          OnlyFormats: ['SAM'],
          Label: 'Maximum number of pre-provisioned concurrent invocations',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Default: 10,
          Path: '$.Resources.%{resourceId}ScalableTarget.Properties.MaxCapacity',
          DependsOn: { ProvisionConcurrency: true },
        },
        AutoscaleConcurrencyUtilizationTarget: {
          OnlyFormats: ['SAM'],
          Label: 'Autoscale Concurrency Utilization',
          Description: 'Target Utilization Percent',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Min: 1,
          Max: 100,
          DependsOn: { ProvisionConcurrency: true },
          Default: 70,
          Path: '$.Resources.%{resourceId}ScalingPolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue',
          Transformations: ['ToPercent'],
        },
        ReserveConcurrency: {
          Label: 'Reserve Concurrency',
          Description:
            'Reserve a bounded number of concurrent function executions',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: {
            Format: {
              SAM: '@.Properties.ReservedConcurrentExecutions',
              serverless: '@.reservedConcurrency',
            },
          },
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
        ServerlessPerRolePermissions: {
          OnlyFormats: ['serverless'],
          Label: 'Create Separate IAM Role For Function',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: true,
          Path: '@.iamRoleStatements',
          Transformations: ['Boolean'],
        },
        Permissions: {
          Label: 'Permissions',
          Description: {
            Format: {
              SAM: 'SAM/IAM permission policies',
              serverless: 'IAM Statements',
            },
          },
          DependsOn: {
            OnlyFormats: ['serverless'],
            ServerlessPerRolePermissions: true,
          },
          ValueType: 'object',
          InputType: 'yaml',
          Default: {
            Format: {
              SAM: ['AWSXrayWriteOnlyAccess'],
              serverless: [
                {
                  Effect: 'Allow',
                  Action: [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'xray:GetSamplingRules',
                    'xray:GetSamplingTargets',
                    'xray:GetSamplingStatisticSummaries',
                  ],
                  Resource: '*',
                },
              ],
            },
          },
          Path: {
            Format: {
              SAM: '@.Properties.Policies',
              serverless: '@.iamRoleStatements',
            },
          },
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
          Path: {
            Format: {
              SAM: '@.Properties.Environment.Variables',
              serverless: '@.environment',
            },
          },
          GlobalPath: {
            Format: {
              SAM: '$.Globals.Function.Environment.Variables',
              serverless: '$.provider.environment',
            },
          },
        },
        UseExistingResource: {
          Label: 'Use Existing Lambda Function',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'Lambda Function ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default:
            'arn:aws:lambda:<Region>:<AWS Account ID>:function:<Function Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      DashboardProperties: {
        label: 'Function',
        paletteLabel: 'Function',
        paletteHint: 'Lambda Function',
        paletteResource: {
          Format: {
            SAM: 'AWS::Serverless::Function',
            serverless: 'AWS::Lambda::Function',
          },
        },
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
    { sourceType: 'Custom::.*', targetType: 'AWS::Serverless::Function' },
    {
      sourceType: 'AWS::Lambda::Permission',
      targetIsIntegration: true,
      integrationSourceType: '.*',
      integrationTargetType: 'AWS::Serverless::Function',
    },
    {
      sourceType: 'AWS::Lambda::EventSourceMapping',
      targetType: 'AWS::Lambda::Function',
    },
    {
      sourceType: 'AWS::ApplicationAutoScaling::ScalableTarget',
      targetType: 'AWS::Serverless::Function',
    },
    {
      sourceType: 'AWS::ApplicationAutoScaling::ScalingPolicy',
      targetType: 'AWS::ApplicationAutoScaling::ScalableTarget',
    },
    {
      sourceType: 'Custom::DockerImageBuildTrigger',
      targetType: 'AWS::CodeBuild::Project',
    },
    {
      sourceType: 'AWS::CodeBuild::Project',
      targetType: 'AWS::Serverless::Function',
    },
    {
      sourceType: 'AWS::Serverless::Function',
      targetType: 'AWS::ECR::Repository',
    },
  ],
  PermissionTypes: {
    function: {
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
    function: {
      Format: {
        SAM: {
          Locator:
            "$.Resources[?(@.Type === 'AWS::Serverless::Function' && @.Properties.VpcConfig)]",
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
        serverless: {
          Locator: '$.functions[?(@.vpc)]',
          ResourceIndex: 2,
          Subnets: { Path: '@.vpc.subnetIds' },
          SecurityGroups: { Path: '@.vpc.securityGroupIds' },
          DefaultSubnetTypes: 'private',
          Permissions: [
            {
              PermissionType: 'iamPolicy',
              PolicyName:
                'arn:aws:iam::aws:policy/service-role/AWSLambdaENIManagementAccess',
            },
          ],
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'function' },
      Reactions: [
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: '$.Transform',
          Template: {
            Format: { SAM: 'AWS::Serverless-2016-10-31', serverless: null },
          },
        },
        {
          OnlyFormats: ['serverless'],
          Type: 'Append',
          Path: '$.plugins',
          IfNotExists: true,
          Template: 'serverless-iam-roles-per-function',
        },
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}',
              serverless: "$.functions['%{SETTING:Name}']",
            },
          },
          Template: {
            Format: {
              SAM: {
                Type: 'AWS::Serverless::Function',
                Properties: {
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
                  Handler: '%{SETTING:HandlerNode14}',
                  Runtime: '%{SETTING:Runtime}',
                  MemorySize: '%{SETTING:MemorySize}',
                  Timeout: '%{SETTING:Timeout}',
                  Tracing: 'Active',
                  Policies: '%{SETTING:Permissions}',
                },
              },
              serverless: {
                handler: '%{SETTING:HandlerNode14}',
                description: {
                  'Fn::Sub': [
                    'Stack ${StackTagName} Environment ${EnvironmentTagName} Function ${ResourceName}',
                    { ResourceName: '%{SETTING:Name}' },
                  ],
                },
                runtime: 'nodejs14.x',
                tracing: 'Active',
                iamRoleStatements: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'xray:PutTraceSegments',
                      'xray:PutTelemetryRecords',
                      'xray:GetSamplingRules',
                      'xray:GetSamplingTargets',
                      'xray:GetSamplingStatisticSummaries',
                    ],
                    Resource: '*',
                  },
                ],
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'Name' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: {
            Format: {
              SAM: "$.Resources.%{resourceId}.Properties.Description['Fn::Sub'][1].ResourceName",
              serverless:
                "$.functions['%{SETTING:Name}'].description['Fn::Sub'][1].ResourceName",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'Runtime' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Runtime',
              serverless: "$.functions['%{SETTING:Name}'].runtime",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'Runtime',
        Value: 'nodejs14.x (typescript)',
      },
      Reactions: [
        {
          OnlyFormats: ['serverless'],
          Type: 'Append',
          Path: '$.plugins',
          IfNotExists: true,
          Template: 'serverless-plugin-typescript',
        },
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
        {
          Type: 'Upsert',
          Template: 'nodejs14.x',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Runtime',
              serverless: "$.functions['%{SETTING:Name}'].runtime",
            },
          },
        },
        {
          Type: 'Upsert',
          Template: 'typescript',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'Runtime',
        Value: 'nodejs12.x (typescript)',
      },
      Reactions: [
        {
          OnlyFormats: ['serverless'],
          Type: 'Append',
          Path: '$.plugins',
          IfNotExists: true,
          Template: 'serverless-plugin-typescript',
        },
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
        {
          Type: 'Upsert',
          Template: 'nodejs12.x',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Runtime',
              serverless: "$.functions['%{SETTING:Name}'].runtime",
            },
          },
        },
        {
          Type: 'Upsert',
          Template: 'typescript',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'Runtime',
        Value: 'nodejs10.x (typescript)',
      },
      Reactions: [
        {
          OnlyFormats: ['serverless'],
          Type: 'Append',
          Path: '$.plugins',
          IfNotExists: true,
          Template: 'serverless-plugin-typescript',
        },
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
        {
          Type: 'Upsert',
          Template: 'nodejs10.x',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Runtime',
              serverless: "$.functions['%{SETTING:Name}'].runtime",
            },
          },
        },
        {
          Type: 'Upsert',
          Template: 'typescript',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'SourcePath' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CodeUri',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerNode14' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'HandlerNode14Typescript',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerNode12' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'HandlerNode12Typescript',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerNode10' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'HandlerNode10Typescript',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerPython38' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerPython37' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerPython36' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerPython27' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerJava11' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerJava8' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerDotNet21' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerDotNet31' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerRuby25' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerRuby27' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerGolang' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerProvided' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'HandlerProvidedAL2' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Handler',
              serverless: "$.functions['%{SETTING:Name}'].handler",
            },
          },
        },
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Metadata.RuntimeOption',
              serverless: "$.functions['%{SETTING:Name}'].tags.runtimeOption",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'PackageType',
        Value: 'Zip',
        CurrentValue: 'Image',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            '$.Resources.%{values[0]}',
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
            "$.Resources[?(@.Type === 'AWS::Events::Rule' && @.Properties.EventPattern.detail['project-name'][0].Ref === '%{keys[2]}')]",
            "$.Resources[?(@.Type === 'AWS::Lambda::Permission' && @.Properties.FunctionName['Fn::Sub'] === 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander' && @.Properties.SourceArn['Fn::GetAtt'][0] === '%{keys[3]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
            "$.Resources[?(@.Type === 'AWS::Events::Rule' && @.Properties.EventPattern.detail['project-name'][0].Ref === '%{keys[2]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')].Properties.ServiceRole['Fn::GetAtt'][0]",
            '$.Resources.%{values[2]}',
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
            "$.Resources[?(@.Type === 'Custom::DockerImageBuildTrigger' && @.Properties.ProjectName.Ref === '%{keys[2]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.Dockerfile',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.DockerContext',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.DockerTag',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.DependsOn[?(@ === '%{resourceId}BuildTrigger')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'PackageType',
        Value: 'Zip',
        CurrentValue: 'Image',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.PackageType',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.ImageUri',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'PackageType',
        Value: 'Image',
        CurrentValue: 'Zip',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CodeUri',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.Runtime',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.Handler',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.BuildMethod',
        },
        { Type: 'Delete', Path: '$.Resources.%{resourceId}.Properties.Layers' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'PackageType',
        Value: 'Image',
        CurrentValue: 'Zip',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PackageType',
          Template: 'Image',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ImageUri',
          Template: {
            'Fn::Sub':
              '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${%{resourceId}Repository}:${SourceVersion}',
          },
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CodeUri',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.DockerTag',
          Template: 'development',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Repository',
          Template: {
            Type: 'AWS::ECR::Repository',
            Properties: {
              ImageScanningConfiguration: { ScanOnPush: true },
              LifecyclePolicy: {
                LifecyclePolicyText:
                  '{\n  "rules": [\n    {\n      "rulePriority": 1,\n      "description": "Expire old images (keep a few for rollbacks)",\n      "selection": {\n        "tagStatus": "any",\n        "countType": "imageCountMoreThan",\n        "countNumber": 5\n      },\n      "action": {\n        "type": "expire"\n      }\n    }\n  ]\n}',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilder',
          Template: {
            Type: 'AWS::CodeBuild::Project',
            Metadata: { Type: 'docker' },
            Properties: {
              Name: { 'Fn::Sub': '${AWS::StackName}-%{resourceId}' },
              Artifacts: { Type: 'NO_ARTIFACTS' },
              Environment: {
                ComputeType: 'BUILD_GENERAL1_SMALL',
                Image: 'aws/codebuild/amazonlinux2-x86_64-standard:3.0',
                Type: 'LINUX_CONTAINER',
                PrivilegedMode: true,
              },
              ServiceRole: {
                'Fn::GetAtt': ['%{resourceId}ImageBuilderRole', 'Arn'],
              },
              Source: {
                Type: 'NO_SOURCE',
                BuildSpec: {
                  'Fn::Sub': [
                    'version: 0.2\nphases:\n  install:\n    commands:\n      - |\n        _SOURCE_LOCATION="${SourceLocation}"\n        if [ s3 != "${!_SOURCE_LOCATION%%:*}" ]; then\n          git clone "${SourceLocation}" repo\n          cd repo\n          git checkout "${SourceVersion}"\n        else\n          aws s3 cp "${SourceLocation}" repo.tgz\n          tar --strip-components 1 -xvvzf repo.tgz\n        fi\n  pre_build:\n    commands:\n      # https://docs.aws.amazon.com/AmazonECR/latest/userguide/Registries.html#registry_auth\n      - aws ecr get-login-password --region ${AWS::Region} | docker login --username AWS --password-stdin ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com\n  build:\n    commands:\n      - docker build -f "${Dockerfile}" -t "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepositoryName}:${SourceVersion}" "${DockerContext}"\n  post_build:\n    commands:\n      - if [ $CODEBUILD_BUILD_SUCCEEDING == 0 ]; then exit 1; fi\n      - docker push "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepositoryName}:${SourceVersion}"',
                    { ECRRepositoryName: { Ref: '%{resourceId}Repository' } },
                  ],
                },
              },
              Tags: [
                { Key: 'CFN Project Type', Value: 'Docker Image Builder' },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilderEvents',
          Template: {
            Type: 'AWS::Events::Rule',
            Properties: {
              EventPattern: {
                source: ['aws.codebuild'],
                'detail-type': ['CodeBuild Build State Change'],
                detail: {
                  'build-status': [
                    'SUCCEEDED',
                    'FAILED',
                    'FAULT',
                    'STOPPPED',
                    'TIMED_OUT',
                  ],
                  'project-name': [{ Ref: '%{resourceId}ImageBuilder' }],
                },
              },
              Targets: [
                {
                  Arn: {
                    'Fn::Sub':
                      'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
                  },
                  Id: 'AgentCommander',
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilderEventsPermission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              Action: 'lambda:InvokeFunction',
              FunctionName: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              Principal: 'events.amazonaws.com',
              SourceArn: {
                'Fn::GetAtt': ['%{resourceId}ImageBuilderEvents', 'Arn'],
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilderRole',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              RoleName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(22)}',
              },
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: { Service: 'codebuild.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              },
              Policies: [
                {
                  PolicyName: 'Logs',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'logs:CreateLogGroup',
                          'logs:CreateLogStream',
                          'logs:PutLogEvents',
                        ],
                        Resource: [
                          {
                            'Fn::Sub':
                              'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/${AWS::StackName}-%{resourceId}:log-stream:*',
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  PolicyName: 'DownloadSourceFromAssetsBucket',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: 's3:GetObject',
                        Resource: 'arn:aws:s3:::cfn-assetsbucket-*/*',
                      },
                    ],
                  },
                },
                {
                  PolicyName: 'UploadToECRDockerRepository',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'ecr:BatchCheckLayerAvailability',
                          'ecr:CompleteLayerUpload',
                          'ecr:InitiateLayerUpload',
                          'ecr:PutImage',
                          'ecr:UploadLayerPart',
                        ],
                        Resource: {
                          'Fn::GetAtt': ['%{resourceId}Repository', 'Arn'],
                        },
                      },
                      {
                        Effect: 'Allow',
                        Action: 'ecr:GetAuthorizationToken',
                        Resource: '*',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}BuildTrigger',
          Template: {
            Type: 'Custom::DockerImageBuildTrigger',
            DependsOn: '%{resourceId}ImageBuilderEventsPermission',
            Properties: {
              ServiceToken: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              Type: 'docker',
              ProjectName: { Ref: '%{resourceId}ImageBuilder' },
              SourceVersion: { Ref: 'SourceVersion' },
            },
          },
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{resourceId}.DependsOn',
          Template: '%{resourceId}BuildTrigger',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ImageSource',
        Value: 'SourceCode',
        CurrentValue: 'RepositoryImage',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PackageType',
          Template: 'Image',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ImageUri',
          Template: {
            'Fn::Sub':
              '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${%{resourceId}Repository}:${SourceVersion}',
          },
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CodeUri',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.DockerTag',
          Template: 'development',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Repository',
          Template: {
            Type: 'AWS::ECR::Repository',
            Properties: {
              ImageScanningConfiguration: { ScanOnPush: true },
              LifecyclePolicy: {
                LifecyclePolicyText:
                  '{\n  "rules": [\n    {\n      "rulePriority": 1,\n      "description": "Expire old images (keep a few for rollbacks)",\n      "selection": {\n        "tagStatus": "any",\n        "countType": "imageCountMoreThan",\n        "countNumber": 5\n      },\n      "action": {\n        "type": "expire"\n      }\n    }\n  ]\n}',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilder',
          Template: {
            Type: 'AWS::CodeBuild::Project',
            Metadata: { Type: 'docker' },
            Properties: {
              Name: { 'Fn::Sub': '${AWS::StackName}-%{resourceId}' },
              Artifacts: { Type: 'NO_ARTIFACTS' },
              Environment: {
                ComputeType: 'BUILD_GENERAL1_SMALL',
                Image: 'aws/codebuild/amazonlinux2-x86_64-standard:3.0',
                Type: 'LINUX_CONTAINER',
                PrivilegedMode: true,
              },
              ServiceRole: {
                'Fn::GetAtt': ['%{resourceId}ImageBuilderRole', 'Arn'],
              },
              Source: {
                Type: 'NO_SOURCE',
                BuildSpec: {
                  'Fn::Sub': [
                    'version: 0.2\nphases:\n  install:\n    commands:\n      - |\n        _SOURCE_LOCATION="${SourceLocation}"\n        if [ s3 != "${!_SOURCE_LOCATION%%:*}" ]; then\n          git clone "${SourceLocation}" repo\n          cd repo\n          git checkout "${SourceVersion}"\n        else\n          aws s3 cp "${SourceLocation}" repo.tgz\n          tar --strip-components 1 -xvvzf repo.tgz\n        fi\n  pre_build:\n    commands:\n      # https://docs.aws.amazon.com/AmazonECR/latest/userguide/Registries.html#registry_auth\n      - aws ecr get-login-password --region ${AWS::Region} | docker login --username AWS --password-stdin ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com\n  build:\n    commands:\n      - docker build -f "${Dockerfile}" -t "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepositoryName}:${SourceVersion}" "${DockerContext}"\n  post_build:\n    commands:\n      - if [ $CODEBUILD_BUILD_SUCCEEDING == 0 ]; then exit 1; fi\n      - docker push "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepositoryName}:${SourceVersion}"',
                    { ECRRepositoryName: { Ref: '%{resourceId}Repository' } },
                  ],
                },
              },
              Tags: [
                { Key: 'CFN Project Type', Value: 'Docker Image Builder' },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilderEvents',
          Template: {
            Type: 'AWS::Events::Rule',
            Properties: {
              EventPattern: {
                source: ['aws.codebuild'],
                'detail-type': ['CodeBuild Build State Change'],
                detail: {
                  'build-status': [
                    'SUCCEEDED',
                    'FAILED',
                    'FAULT',
                    'STOPPPED',
                    'TIMED_OUT',
                  ],
                  'project-name': [{ Ref: '%{resourceId}ImageBuilder' }],
                },
              },
              Targets: [
                {
                  Arn: {
                    'Fn::Sub':
                      'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
                  },
                  Id: 'AgentCommander',
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilderEventsPermission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              Action: 'lambda:InvokeFunction',
              FunctionName: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              Principal: 'events.amazonaws.com',
              SourceArn: {
                'Fn::GetAtt': ['%{resourceId}ImageBuilderEvents', 'Arn'],
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ImageBuilderRole',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              RoleName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(22)}',
              },
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: { Service: 'codebuild.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              },
              Policies: [
                {
                  PolicyName: 'Logs',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'logs:CreateLogGroup',
                          'logs:CreateLogStream',
                          'logs:PutLogEvents',
                        ],
                        Resource: [
                          {
                            'Fn::Sub':
                              'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/${AWS::StackName}-%{resourceId}:log-stream:*',
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  PolicyName: 'DownloadSourceFromAssetsBucket',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: 's3:GetObject',
                        Resource: 'arn:aws:s3:::cfn-assetsbucket-*/*',
                      },
                    ],
                  },
                },
                {
                  PolicyName: 'UploadToECRDockerRepository',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'ecr:BatchCheckLayerAvailability',
                          'ecr:CompleteLayerUpload',
                          'ecr:InitiateLayerUpload',
                          'ecr:PutImage',
                          'ecr:UploadLayerPart',
                        ],
                        Resource: {
                          'Fn::GetAtt': ['%{resourceId}Repository', 'Arn'],
                        },
                      },
                      {
                        Effect: 'Allow',
                        Action: 'ecr:GetAuthorizationToken',
                        Resource: '*',
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}BuildTrigger',
          Template: {
            Type: 'Custom::DockerImageBuildTrigger',
            DependsOn: '%{resourceId}ImageBuilderEventsPermission',
            Properties: {
              ServiceToken: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              Type: 'docker',
              ProjectName: { Ref: '%{resourceId}ImageBuilder' },
              SourceVersion: { Ref: 'SourceVersion' },
            },
          },
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{resourceId}.DependsOn',
          Template: '%{resourceId}BuildTrigger',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'ImageDockerfile' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.Dockerfile',
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')].Properties.Source.BuildSpec['Fn::Sub'][1].Dockerfile",
          ],
          Template: '%{SETTING:ImageDockerContext}/%{SETTING:ImageDockerfile}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'ImageDockerContext' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.DockerContext',
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')].Properties.Source.BuildSpec['Fn::Sub'][1].DockerContext",
          ],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ImageSource',
        Value: 'RepositoryImage',
        CurrentValue: 'SourceCode',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            '$.Resources.%{values[0]}',
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
            "$.Resources[?(@.Type === 'AWS::Events::Rule' && @.Properties.EventPattern.detail['project-name'][0].Ref === '%{keys[2]}')]",
            "$.Resources[?(@.Type === 'AWS::Lambda::Permission' && @.Properties.FunctionName['Fn::Sub'] === 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander' && @.Properties.SourceArn['Fn::GetAtt'][0] === '%{keys[3]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
            "$.Resources[?(@.Type === 'AWS::Events::Rule' && @.Properties.EventPattern.detail['project-name'][0].Ref === '%{keys[2]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')].Properties.ServiceRole['Fn::GetAtt'][0]",
            '$.Resources.%{values[2]}',
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
            "$.Resources[?(@.Type === 'Custom::DockerImageBuildTrigger' && @.Properties.ProjectName.Ref === '%{keys[2]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker')].Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref",
            "$.Resources.%{resourceId}.Properties[?(@['Fn::Sub'].includes('${%{values[0]}}'))]",
            "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'docker' && @.Properties.Source.BuildSpec['Fn::Sub'][1].ECRRepositoryName.Ref === '%{values[0]}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.Dockerfile',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.DockerContext',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.DockerTag',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.DependsOn[?(@ === '%{resourceId}BuildTrigger')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'Image' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ImageUri',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'UseCustomMakefile',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.BuildMethod',
          Template: 'makefile',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'UseCustomMakefile',
        Value: false,
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
      Conditions: { ResourceType: 'function', Setting: 'Layers' },
      Reactions: [
        { Type: 'Upsert', Path: '$.Resources.%{resourceId}.Properties.Layers' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'MemorySize' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.MemorySize',
              serverless: "$.functions['%{SETTING:Name}'].memorySize",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'Timeout' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Timeout',
              serverless: "$.functions['%{SETTING:Name}'].timeout",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'TriggerOnFirstDeploy',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}DeployTrigger',
          Template: {
            Type: 'Custom::FunctionDeployTrigger',
            Properties: {
              ServiceToken: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'TriggerOnFirstDeploy',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type.startsWith('Custom::') && @.Properties.ServiceToken['Fn::GetAtt'][0] === '%{resourceId}')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'TriggerOnEveryDeploy',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type.startsWith('Custom::') && @.Properties.ServiceToken['Fn::GetAtt'][0] === '%{resourceId}')].Properties.DeploymentTimestamp",
          Template: { Ref: 'DeploymentTimestamp' },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'TriggerOnEveryDeploy',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type.startsWith('Custom::') && @.Properties.ServiceToken['Fn::GetAtt'][0] === '%{resourceId}')].Properties[?(@.Ref === 'DeploymentTimestamp')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ReserveConcurrency',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.ReservedConcurrentExecutions',
              serverless: "$.functions['%{SETTING:Name}'].reservedConcurrency",
            },
          },
          Template: '%{SETTING:ReservedConcurrency}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ReserveConcurrency',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.ReservedConcurrentExecutions',
              serverless: "$.functions['%{SETTING:Name}'].reservedConcurrency",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ProvisionConcurrency',
        Value: true,
      },
      Reactions: [
        {
          OnlyFormats: ['serverless'],
          Type: 'Upsert',
          Path: "$.functions['%SETTING:Name}'].provisionedConcurrenty",
          Template: 1,
        },
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.AutoPublishAlias',
            },
          },
          Template: 'live',
        },
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.DeploymentPreference',
            },
          },
          Template: { Type: 'AllAtOnce' },
        },
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ScalableTarget',
          Template: {
            Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
            Properties: {
              MinCapacity: '%{SETTING:AutoscaleMinCapacity}',
              MaxCapacity: '%{SETTING:AutoscaleMaxCapacity}',
              ResourceId: { 'Fn::Sub': 'function:${%{resourceId}}:live' },
              RoleARN: {
                'Fn::Sub':
                  'arn:aws:iam::${AWS::AccountId}:role/aws-service-role/lambda.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_LambdaConcurrency',
              },
              ScalableDimension: 'lambda:function:ProvisionedConcurrency',
              ServiceNamespace: 'lambda',
            },
            DependsOn: '%{resourceId}Aliaslive',
          },
        },
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ScalingPolicy',
          Template: {
            Type: 'AWS::ApplicationAutoScaling::ScalingPolicy',
            Properties: {
              PolicyName: 'utilization',
              PolicyType: 'TargetTrackingScaling',
              ScalingTargetId: { Ref: '%{resourceId}ScalableTarget' },
              TargetTrackingScalingPolicyConfiguration: {
                TargetValue: '%{SETTING:AutoscaleConcurrencyUtilizationTarget}',
                PredefinedMetricSpecification: {
                  PredefinedMetricType:
                    'LambdaProvisionedConcurrencyUtilization',
                },
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ProvisionConcurrency',
        Value: false,
      },
      Reactions: [
        {
          OnlyFormats: ['serverless'],
          Type: 'Delete',
          Path: "$.functions['%{SETTING:Name}'].provisionedConcurrency",
        },
        {
          OnlyFormats: ['SAM'],
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}ScalableTarget',
        },
        {
          OnlyFormats: ['SAM'],
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}ScalingPolicy',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'ReservedConcurrency' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.ReservedConcurrentExecutions',
              serverless: "$.functions['%{SETTING:Name}'].reservedConcurrency",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'AutoscaleConcurrencyUtilizationTarget',
      },
      Reactions: [
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ScalingPolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue',
          Transformations: ['FromPercent'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'AutoscaleMinCapacity' },
      Reactions: [
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ScalableTarget.Properties.MinCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'AutoscaleMaxCapacity' },
      Reactions: [
        {
          OnlyFormats: ['SAM'],
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ScalableTarget.Properties.MaxCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ServerlessPerRolePermissions',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Append',
          IfNotExists: true,
          Path: '$.plugins',
          Template: 'serverless-iam-roles-per-function',
        },
        {
          Type: 'Upsert',
          Path: "$.functions['%{SETTING:Name}'].iamRoleStatements",
          Template: [],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'ServerlessPerRolePermissions',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.functions['%{SETTING:Name}'].iamRoleStatements",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'Permissions' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Policies',
              serverless: "$.functions['%{SETTING:Name}'].iamRoleStatements",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'Environment' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.Environment.Variables',
              serverless: "$.functions['%{SETTING:Name}'].environment",
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'UseExistingResource',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.Events[?(@.Type === 'Api')].Properties",
            '$.Resources.%{resourceId}ExistingResource%{value.RestApiId.Ref}%{value.Method}%{value.Path|LogicalId}Permission',
          ],
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              Action: 'lambda:InvokeFunction',
              Principal: 'apigateway.amazonaws.com',
              FunctionName: { Ref: '%{resourceId}ExistingResource' },
              SourceArn: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{values[0].RestApiId.Ref}}/*/%{values[0].Method}%{values[0].Path}',
              },
            },
            Condition: '%{resourceId}UseExistingResource',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'function',
        Setting: 'UseExistingResource',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::Lambda::Permission' && @.Properties.FunctionName.Ref === '%{resourceId}ExistingResource')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'function', Setting: 'ExistingResourceData' },
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
      Action: 'PutVirtualNetworkPlacement',
      Conditions: { ResourceType: 'function' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.VpcConfig.SecurityGroupIds',
              serverless: "$.functions['%{SETTING:Name}'].vpc.securityGroupIds",
            },
          },
          Template: ['%{defaultSecurityGroupId}'],
        },
        {
          Type: 'Upsert',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.VpcConfig.SubnetIds',
              serverless: "$.functions['%{SETTING:Name}'].vpc.subnetIds",
            },
          },
          Template: '%{subnetIds}',
        },
      ],
    },
    {
      Action: 'DeleteVirtualNetworkPlacement',
      Conditions: { ResourceType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: {
            Format: {
              SAM: '$.Resources.%{resourceId}.Properties.VpcConfig',
              serverless: "$.functions['%{SETTING:Name}'].vpc",
            },
          },
        },
      ],
    },
  ],
};
