export default {
  ResourceTypes: {
    stateMachine: {
      Locator: "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine')]",
      PhysicalNameBinding: '@.Properties.Name',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        SaveDefinitionInFile: {
          Label: 'Save Definition In File',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Path: '@.Properties.DefinitionUri',
          Transformations: ['IsLocalFile'],
        },
        DefinitionLocation: {
          Label: 'Definition File Location',
          DependsOn: { SaveDefinitionInFile: true },
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.DefinitionUri',
        },
        Definition: {
          Label: 'State Machine Definition',
          ValueType: 'object',
          InputType: 'yaml',
          FacetType: 'taskResource',
          Path: '@.Properties.Definition',
          FacetTransformations: ['TaskResourcesFromStateMachineDefinition'],
          ReparseRequired: true,
        },
      },
      FacetSettings: {
        taskResource: {
          TargetType: {
            Description: 'Integration target type',
            IsHidden: true,
            ValueType: 'string',
            InputType: 'input',
            Path: [
              '$.Resources.%{resourceId}.Properties.Definition',
              '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
            ],
            Transformations: ['TargetTypeFromResource'],
          },
          TableOperation: {
            ReparseRequired: true,
            Label: 'Table Operation',
            DependsOn: { TargetType: 'table' },
            Default: 'putItem',
            Description: 'The operation to be performed on the DynamoDB table',
            ValueType: 'string',
            InputType: 'select',
            Choices: ['deleteItem', 'getItem', 'putItem', 'updateItem'],
            Path: [
              '$.Resources.%{resourceId}.Properties.Definition',
              '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
            ],
            Transformations: ['OperationFromTaskResource'],
          },
        },
      },
      DashboardProperties: {
        UnavailableInFormats: ['serverless'],
        label: 'State Machine',
        paletteLabel: 'State Machine',
        paletteHint: 'Step Function State Machine',
        paletteResource: 'AWS::Serverless::StateMachine',
        paletteInfo:
          'Use this resource to sequence tasks as part of a long-running process.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-statemachine.html',
        inputs: 1,
        outputs: 0,
        icon: 'ic-aws-step-functions.svg',
        zIndex: -50,
        facetLabels: { taskResource: '%{FACET:StateId}' },
        info: 'Sequences tasks that compose a long-running process',
        deploymentProperties: {
          arn: '%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/states/home?region=%{region}#/statemachines/view/%{physicalId}',
          name: '%{SETTING:Name}',
          id: '%{resourceId}',
          settings: [{ label: 'Logical ID', value: '%{resourceId}' }],
          consoleLinks: [
            {
              label: 'Invocation Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Invocation Metrics For State Machine '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/States',
              dimensions: ['StateMachineArn'],
              metrics: [
                {
                  label: 'Started',
                  namespace: 'AWS/States',
                  name: 'ExecutionsStarted',
                  statistic: 'Sum',
                  dimensions: { StateMachineArn: '%{physicalId}' },
                },
                {
                  label: 'Failed',
                  namespace: 'AWS/States',
                  name: 'ExecutionsFailed',
                  statistic: 'Sum',
                  dimensions: { StateMachineArn: '%{physicalId}' },
                },
                {
                  label: 'Throttles',
                  namespace: 'AWS/States',
                  name: 'ExecutionThrottled',
                  statistic: 'Sum',
                  dimensions: { StateMachineArn: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Execution Duration',
              type: 'cloudwatchChartLink',
              title:
                "Execution Duration For State Machine '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/States',
              dimensions: ['StateMachineArn'],
              metrics: [
                {
                  label: 'Average',
                  namespace: 'AWS/States',
                  name: 'ExecutionTime',
                  dimensions: { StateMachineArn: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Logs',
              type: 'cloudwatchLogsLink',
              region: '%{region}',
              logGroup:
                '/cfn/stateMachine/%{stackName}-%{environmentName}-%{name}',
            },
            {
              label: 'X-Ray Traces',
              type: 'xrayTraceLink',
              region: '%{region}',
              serviceType: 'AWS::StepFunctions::StateMachine',
              name: '%{stackName}-%{environmentName}-%{resourceId}',
            },
          ],
        },
      },
      Metrics: {
        namespace: 'AWS/States',
        metrics: [
          {
            type: 'ExecutionsStarted',
            unit: 'Count',
            factors: { a: 'ExecutionsFailed' },
          },
          {
            type: 'ExecutionsFailed',
            unit: 'Count',
            factors: { a: 'ExecutionsStarted' },
          },
          { type: 'ExecutionTime', unit: 'Milliseconds', isHidden: true },
          {
            type: 'AverageDuration',
            label: 'Duration',
            isDerived: true,
            factors: { a: 'ExecutionTime', b: 'ExecutionsStarted' },
          },
        ],
        dimensions: [{ name: 'StateMachineArn', value: '%{physicalId}' }],
      },
      DefaultReferences: [
        { STATE_MACHINE_NAME: { 'Fn::GetAtt': ['%{resourceId}', 'Name'] } },
        { STATE_MACHINE_ARN: { Ref: '%{resourceId}' } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'StepFunctionsExecutionPolicy' }],
        IAMCapable: [{ Actions: ['states:StartExecution'] }],
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'api',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'dockerTask',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type == 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type == 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'function',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'httpApi',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'table',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'topic',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'queue',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
    {
      SourceType: 'stateMachine',
      FacetType: 'taskResource',
      TargetType: 'stateMachine',
      ReparseRequired: true,
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
          {
            Path: "$.Resources.%{key}.Properties.Definition..*[?(@.Type === 'Task')]",
            KeyTransformations: ['BuildStateIdFromPath'],
            Transformations: ['CleanResourceName'],
          },
          {
            Path: '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{value}',
            Transformations: ['ResourceFromDefinitionSubstitution'],
          },
          '$.Resources.%{keys[0]}',
        ],
        Source: { Index: 2 },
        Target: { Context: '$.Resources.%{values[2]}' },
        Facet: { StateId: { Context: '%{keys[1]}' } },
      },
    },
  ],
  PermissionTypes: {
    stateMachine: {
      SAM: {
        StepFunctionsExecutionPolicy: {
          StateMachineName: {
            WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'Name'] },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: ['states:StartExecution'],
        Resources: {
          WithDependency: [{ 'Fn::GetAtt': ['%{resourceId}', 'Arn'] }],
          WithoutDependency: [
            {
              'Fn::Sub': [
                'arn:aws:states:${AWS::Region}:${AWS::AccountId}:stateMachine:${StateMachineName}',
                { StateMachineName: '%{physicalName}' },
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
      Conditions: { ResourceType: 'stateMachine' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::Serverless::StateMachine',
            Properties: {
              Name: { 'Fn::Sub': '${AWS::StackName}-%{resourceId}' },
              DefinitionUri: '%{resourceId}.asl.yaml',
              Definition: {
                StartAt: 'Start',
                States: {
                  Start: { Type: 'Pass', Next: 'TaskState' },
                  TaskState: {
                    Comment:
                      "Template creates an attachment point for each 'Task' state",
                    Type: 'Task',
                    Next: 'Done',
                  },
                  Done: { Type: 'Pass', End: true },
                },
              },
              Logging: {
                Level: 'ALL',
                IncludeExecutionData: true,
                Destinations: [
                  {
                    CloudWatchLogsLogGroup: {
                      LogGroupArn: {
                        'Fn::GetAtt': ['%{resourceId}LogGroup', 'Arn'],
                      },
                    },
                  },
                ],
              },
              Policies: [
                'AWSXrayWriteOnlyAccess',
                {
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: [
                        'logs:CreateLogDelivery',
                        'logs:GetLogDelivery',
                        'logs:UpdateLogDelivery',
                        'logs:DeleteLogDelivery',
                        'logs:ListLogDeliveries',
                        'logs:PutResourcePolicy',
                        'logs:DescribeResourcePolicies',
                        'logs:DescribeLogGroups',
                      ],
                      Resource: '*',
                    },
                  ],
                },
              ],
              Tracing: { Enabled: true },
              Type: 'STANDARD',
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}LogGroup',
          Template: {
            Type: 'AWS::Logs::LogGroup',
            Properties: {
              LogGroupName: {
                'Fn::Sub': '/cfn/stateMachine/${AWS::StackName}-%{resourceId}',
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'stateMachine', Setting: 'Definition' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Definition',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'stateMachine',
        Setting: 'SaveDefinitionInFile',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.DefinitionUri',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'stateMachine',
        Setting: 'DefinitionLocation',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.DefinitionUri',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'api',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::apigateway:invoke',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: {
            ApiEndpoint: '${%{targetId}Endpoint}',
            Method: 'GET',
            Stage: '${%{targetId}Stage}',
            Path: '/',
            RequestBody: {},
            AuthType: 'IAM_ROLE',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Endpoint',
          Template: {
            'Fn::Sub': [
              '${ApiId}.execute-api.${AWS::Region}.amazonaws.com',
              { ApiId: { Ref: '%{targetId}' } },
            ],
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Stage',
          Template: { Ref: '%{targetId}.Stage' },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'api',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Endpoint',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Stage',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'dockerTask',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::ecs:runTask',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: {
            Cluster: 'default',
            LaunchType: 'FARGATE',
            NetworkConfiguration: {
              AwsvpcConfiguration: {
                AssignPublicIp: 'ENABLED',
                'Subnets.$': "States.StringToJson('${%{targetId}VpcSubnets}')",
              },
            },
            TaskDefinition: '${%{targetId}Arn}',
            Overrides: {
              ContainerOverrides: [
                {
                  Name: '0',
                  Environment: [{ Name: 'COMMENT', 'Value.$': '$.Comment' }],
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
          Template: { Ref: '%{targetId}' },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}VpcSubnets',
          Template:
            '%{targetVpcConfig|DefinitionSubstitutionSubnetsFromVpcConfig}',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'dockerTask',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}VpcSubnets',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::lambda:invoke',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: { FunctionName: '${%{targetId}Arn}', 'Payload.$': '$' },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}ExistingResource',
            '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
          ],
          Template: {
            'Fn::If': [
              '%{targetId}UseExistingResource',
              { 'Fn::GetAtt': ['%{targetId}ExistingResource', 'Arn'] },
              { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'httpApi',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::apigateway:invoke',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: {
            ApiEndpoint: '${%{targetId}Endpoint}',
            Method: 'GET',
            Path: '/',
            RequestBody: {},
            AuthType: 'IAM_ROLE',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Endpoint',
          Template: {
            'Fn::Sub': [
              '${ApiId}.execute-api.${AWS::Region}.amazonaws.com',
              { ApiId: { Ref: '%{targetId}' } },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'httpApi',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Endpoint',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'table',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::dynamodb:putItem',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: {
            TableName: '${%{targetId}Name}',
            Item: { id: { 'S.$': '$.id' }, content: { 'S.$': '$.content' } },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Name',
          Template: { Ref: '%{targetId}' },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}ExistingResource',
            '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Name',
          ],
          Template: {
            'Fn::If': [
              '%{targetId}UseExistingResource',
              { Ref: '%{targetId}ExistingResource' },
              { Ref: '%{targetId}' },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'table',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Name',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'topic',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::sns:publish',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: {
            TopicArn: '${%{targetId}Arn}',
            Message: { 'Input.$': '$' },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
          Template: { Ref: '%{targetId}' },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}ExistingResource',
            '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
          ],
          Template: {
            'Fn::If': [
              '%{targetId}UseExistingResource',
              { Ref: '%{targetId}ExistingResource' },
              { Ref: '%{targetId}' },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'topic',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'queue',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::sqs:sendMessage',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: {
            QueueUrl: '${%{targetId}Url}',
            MessageBody: { 'Input.$': '$' },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions',
          Template: { '%{targetId}Url': { Ref: '%{targetId}' } },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}ExistingResource',
            '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Url',
          ],
          Template: {
            'Fn::If': [
              '%{targetId}UseExistingResource',
              { Ref: '%{targetId}ExistingResource' },
              { Ref: '%{targetId}' },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'queue',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Url',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'stateMachine',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          Template: 'arn:aws:states:::states:startExecution',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
          Template: { StateMachineArn: '${%{targetId}Arn}', 'Input.$': '$' },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions',
          Template: { '%{targetId}Arn': { Ref: '%{targetId}' } },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'stateMachine',
        FacetType: 'taskResource',
        TargetType: 'stateMachine',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DefinitionSubstitutions.%{targetId}Arn',
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        FacetType: 'taskResource',
        ResourceType: 'stateMachine',
        Setting: 'TableOperation',
        Value: 'getItem',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          ],
          Template: 'arn:aws:states:::dynamodb:getItem',
        },
        {
          Type: 'Delete',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Item',
          ],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Key',
          ],
          Template: { id: { 'S.$': '$.id' } },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        FacetType: 'taskResource',
        ResourceType: 'stateMachine',
        Setting: 'TableOperation',
        Value: 'putItem',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          ],
          Template: 'arn:aws:states:::dynamodb:putItem',
        },
        {
          Type: 'Delete',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Key',
          ],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Item',
          ],
          Template: { id: { 'S.$': '$.id' }, content: { 'S.$': '$.content' } },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        FacetType: 'taskResource',
        ResourceType: 'stateMachine',
        Setting: 'TableOperation',
        Value: 'deleteItem',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          ],
          Template: 'arn:aws:states:::dynamodb:deleteItem',
        },
        {
          Type: 'Delete',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Item',
          ],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Key',
          ],
          Template: { id: { 'S.$': '$.id' } },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        FacetType: 'taskResource',
        ResourceType: 'stateMachine',
        Setting: 'TableOperation',
        Value: 'updateItem',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Resource',
          ],
          Template: 'arn:aws:states:::dynamodb:updateItem',
        },
        {
          Type: 'Delete',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Item',
          ],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.Key',
          ],
          Template: { id: { 'S.$': '$.id' } },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.UpdateExpression',
          ],
          Template: 'set content = :c',
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.Definition',
            '$.Resources.%{resourceId}.Properties.Definition.%{FACET:StateId|JsonPathFromStateId}.Parameters.ExpressionAttributeValues',
          ],
          Template: { ':c': { 'S.$': '$.content' } },
        },
      ],
    },
  ],
};
