export default {
  ResourceTypes: {
    dockerTask: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::ECS::TaskDefinition' && @.Properties.RequiresCompatibilities.includes('FARGATE'))]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Image: {
          Label: 'Image',
          Description: 'Docker image name',
          ValueType: 'string',
          InputType: 'input',
          Path: '@.Properties.ContainerDefinitions[0].Image',
          Default: 'hello-world',
          IsConfigurable: true,
        },
        Cpu: {
          Label: 'CPU Units',
          Description: '1 Virtual CPU == 1024 CPU Units',
          ValueType: 'number',
          InputType: 'select',
          Choices: [256, 512, 1024, 2048, 4096],
          Path: '@.Properties.Cpu',
          Default: 1024,
        },
        Memory: {
          Label: 'Memory',
          ValueType: 'number',
          InputType: 'select',
          Choices: [
            512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192, 9216, 10240,
            11264, 12288, 13312, 14336, 15360, 16384, 17408, 18432, 19456,
            20480, 21504, 22528, 23552, 24576, 25600, 26624, 27648, 28672,
            29696, 30720,
          ],
          Path: '@.Properties.Memory',
          Default: 2048,
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
          Path: '@.Properties.ContainerDefinitions[0].Environment',
          Transformations: ['FromNameValue'],
        },
        Permissions: {
          Label: 'Permissions',
          Description: 'IAM permission statements',
          ValueType: 'object',
          InputType: 'yaml',
          Path: [
            "@.Properties.TaskRoleArn['Fn::GetAtt'][0]",
            '$.Resources.%{value}.Properties.Policies',
          ],
        },
      },
      SubResourceLocators: [
        { Path: '$.Resources.%{resourceId}ExecutionRole' },
        { Path: '$.Resources.%{resourceId}TaskRole' },
      ],
      DashboardProperties: {
        label: 'Docker Task',
        paletteLabel: 'Docker Task',
        paletteHint: 'ECS Fargate Task',
        paletteResource: 'AWS::ECS::TaskDefinition',
        paletteInfo:
          'Use this resource type to declare a task definition so you can run Docker containers on ephemeral machines.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ecs-taskdefinition.html',
        inputs: 1,
        outputs: 1,
        icon: 'docker-service.svg',
        info: 'Runs Docker tasks on ephemeral machines',
        deploymentProperties: {
          arn: '%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/ecs/home?region=%{region}#/taskDefinitions/%{physicalId|NameFromECSTaskArn}/%{physicalId|NumberFromECSTaskArn}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Image', value: '%{SETTING:Image}' },
            { label: 'Compute Units', value: '%{SETTING:Cpu}' },
            { label: 'Memory', value: '%{SETTING:Memory}' },
          ],
          consoleLinks: [
            {
              label: 'Logs',
              type: 'cloudwatchLogsLink',
              region: '%{region}',
              logGroup: '/cfn/task/%{physicalId|NameShortFromECSTaskArn}/logs',
            },
          ],
        },
      },
      DefaultReferences: [
        { DOCKER_TASK_ARN: { Ref: '%{resourceId}' } },
        { DOCKER_TASK_SUBNETS: '%{VPC:SubnetIds}' },
      ],
      DefaultPermissions: {
        IAMCapable: [
          { Actions: ['ecs:RunTask', 'ecs:DescribeTasks', 'ecs:StopTask'] },
          {
            Actions: ['iam:PassRole'],
            Resources: [
              { 'Fn::GetAtt': ['%{resourceId}ExecutionRole', 'Arn'] },
              { 'Fn::GetAtt': ['%{resourceId}TaskRole', 'Arn'] },
            ],
          },
        ],
      },
    },
  },
  PermissionTypes: {
    dockerTask: {
      Custom: {
        Actions: ['ecs:RunTask', 'ecs:DescribeTasks', 'ecs:StopTask'],
        Resources: {
          WithDependency: [
            { Ref: '%{resourceId}' },
            {
              'Fn::Sub': 'arn:aws:ecs:${AWS::Region}:${AWS::AccountId}:task/*',
            },
          ],
        },
      },
    },
  },
  VirtualNetworkPlacements: {
    dockerTask: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::ECS::TaskDefinition' && @.Metadata && @.Metadata.VirtualNetworkData)]",
      ResourceIndex: 2,
      Subnets: { Path: '@.Metadata.VirtualNetworkData.SubnetIds' },
      DefaultSubnetTypes: 'private',
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'dockerTask' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::ECS::TaskDefinition',
            Properties: {
              ContainerDefinitions: [
                {
                  Image: '%{SETTING:Image}',
                  LogConfiguration: {
                    LogDriver: 'awslogs',
                    Options: {
                      'awslogs-group': { Ref: '%{resourceId}LogGroup' },
                      'awslogs-region': { Ref: 'AWS::Region' },
                      'awslogs-stream-prefix': 'logs',
                    },
                  },
                  Name: 0,
                },
              ],
              Cpu: '%{SETTING:Cpu}',
              ExecutionRoleArn: {
                'Fn::GetAtt': ['%{resourceId}ExecutionRole', 'Arn'],
              },
              Memory: '%{SETTING:Memory}',
              NetworkMode: 'awsvpc',
              RequiresCompatibilities: ['FARGATE'],
              TaskRoleArn: { 'Fn::GetAtt': ['%{resourceId}TaskRole', 'Arn'] },
              Volumes: [],
            },
            DependsOn: '%{resourceId}LogGroup',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}LogGroup',
          Template: {
            Type: 'AWS::Logs::LogGroup',
            Properties: {
              LogGroupName: {
                'Fn::Sub': '/cfn/task/${AWS::StackName}-%{resourceId}/logs',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}ExecutionRole',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              RoleName: {
                'Fn::Sub':
                  '${AWS::StackName}-%{resourceId|MaxLength(12)}-execution',
              },
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: { Service: 'ecs-tasks.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              },
              Policies: [
                {
                  PolicyName: 'DownloadDockerImagesFromECR',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                        Resource: {
                          'Fn::Sub':
                            'arn:aws:logs:*:*:log-group:/cfn/task/${AWS::StackName}-*',
                        },
                      },
                      {
                        Effect: 'Allow',
                        Action: [
                          'ecr:GetAuthorizationToken',
                          'ecr:BatchCheckLayerAvailability',
                          'ecr:GetDownloadUrlForLayer',
                          'ecr:BatchGetImage',
                        ],
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
          Path: '$.Resources.%{resourceId}TaskRole',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              RoleName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(17)}-task',
              },
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: { Service: 'ecs-tasks.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'dockerTask', Setting: 'Image' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ContainerDefinitions[0].Image',
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.ContainerDefinitions[0].LogConfiguration.Options['awslogs-stream-prefix']",
          Template: 'logs',
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::Logs::LogGroup' && @.Properties.LogGroupName && @.Properties.LogGroupName['Fn::Sub'] && /^\\/cfn\\/task\\/[$#]\\{AWS::StackName\\}-%{resourceId}\\//.test(@.Properties.LogGroupName['Fn::Sub']))].Properties.LogGroupName",
          Template: {
            'Fn::Sub': '/cfn/task/${AWS::StackName}-%{resourceId}/logs',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'dockerTask', Setting: 'Cpu' },
      Reactions: [
        { Type: 'Upsert', Path: '$.Resources.%{resourceId}.Properties.Cpu' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'dockerTask', Setting: 'Memory' },
      Reactions: [
        { Type: 'Upsert', Path: '$.Resources.%{resourceId}.Properties.Memory' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'dockerTask', Setting: 'Environment' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ContainerDefinitions[0].Environment',
          Transformations: ['ToNameValue'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'dockerTask', Setting: 'Permissions' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources.%{resourceId}.Properties.TaskRoleArn['Fn::GetAtt'][0]",
            '$.Resources.%{value}.Properties.Policies',
          ],
        },
      ],
    },
    {
      Action: 'PutVirtualNetworkPlacement',
      Conditions: { ResourceType: 'dockerTask' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Metadata.VirtualNetworkData.SubnetIds',
          Template: '%{subnetIds}',
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type == 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
            {
              Path: '$.Resources.%{key}.Properties.Definition..*[?(@.Parameters.TaskDefinition.includes("%{resourceId}Arn"))]',
              KeyTransformations: ['BuildStateIdFromPath'],
              Transformations: ['CleanResourceName'],
            },
            '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{resourceId}VpcSubnets',
          ],
          Template: {
            'Fn::Sub': [
              '[\\"${Subnets}\\"]',
              { Subnets: { 'Fn::Join': ['\\",\\"', '%{subnetIds}'] } },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteVirtualNetworkPlacement',
      Conditions: { ResourceType: 'dockerTask' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Metadata.VirtualNetworkData.SubnetIds',
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type == 'AWS::Serverless::StateMachine' && @.Properties.Definition)]",
            {
              Path: '$.Resources.%{key}.Properties.Definition..*[?(@.Parameters.TaskDefinition.includes("%{resourceId}Arn"))]',
              KeyTransformations: ['BuildStateIdFromPath'],
              Transformations: ['CleanResourceName'],
            },
            '$.Resources.%{keys[0]}.Properties.DefinitionSubstitutions.%{resourceId}VpcSubnets',
          ],
          Template: {
            'Fn::Sub': [
              '[\\"${Subnets}\\"]',
              {
                Subnets: {
                  'Fn::Join': ['\\",\\"', { Ref: 'DefaultVPCSubnets' }],
                },
              },
            ],
          },
        },
      ],
    },
  ],
};
