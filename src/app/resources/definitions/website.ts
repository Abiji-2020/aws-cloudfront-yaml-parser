export default {
  ResourceTypes: {
    website: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'website')]",
      PhysicalNameBinding: '@.Properties.Name',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        SourceDirectory: {
          Label: 'Source Directory',
          Description: 'Directory of website code within Git repository',
          ValueType: 'string',
          InputType: 'input',
          Default: 'src/site',
          Path: "@.Properties.Source.BuildSpec['Fn::Sub'][1].SourceDirectory",
        },
        BuildCommand: {
          Label: 'Build Command',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          Default: 'npm run build',
          Path: "@.Properties.Source.BuildSpec['Fn::Sub'][1].BuildCommand",
        },
        PublishDirectory: {
          Label: 'Publish Directory',
          Description: 'Directory of built artifacts to be published',
          ValueType: 'string',
          InputType: 'input',
          Default: 'src/site/public',
          Path: "@.Properties.Source.BuildSpec['Fn::Sub'][1].PublishDirectory",
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
          Path: '@.Properties.Environment.EnvironmentVariables',
          Transformations: ['FromNameValue'],
        },
      },
      FacetSingletons: ['destination', 'references'],
      DashboardProperties: {
        label: 'Website Builder',
        paletteLabel: 'Website Builder',
        paletteHint: 'CodeBuild Project',
        paletteResource: 'AWS::CodeBuild::Project',
        paletteInfo: 'Use this resource type to build static websites',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-codebuild-project.html',
        inputs: 1,
        outputs: 0,
        icon: 'ic-aws-code-build.svg',
        zIndex: -50,
        facetLabels: {
          destination: 'Destination Object Store',
          references: 'References',
        },
        info: 'Builds websites hosted from Object Stores',
        deploymentProperties: {
          arn: 'arn:aws:codebuild:%{region}:%{awsAccountId}:project/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/codesuite/codebuild/projects/%{physicalId}/history?region=%{region}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Source Location', value: '%{SETTING:Source}' },
          ],
          consoleLinks: [],
        },
      },
      DefaultReferences: [
        { WEBSITE_BUILDER_PROJECT_NAME: { Ref: '%{resourceId}' } },
        {
          WEBSITE_BUILDER_PROJECT_ARN: {
            'Fn::GetAtt': ['%{resourceId}', 'Arn'],
          },
        },
      ],
    },
  },
  GroupingRules: [
    {
      sourceType: 'Custom::WebsiteBuildTrigger',
      targetType: 'AWS::CodeBuild::Project',
    },
    { sourceType: 'AWS::Events::Rule', targetType: 'AWS::CodeBuild::Project' },
  ],
  IntegrationTypes: [
    {
      SourceType: 'website',
      FacetType: 'destination',
      TargetType: 'objectStore',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CodeBuild::Project' && @.Metadata && @.Metadata.Type === 'website')].Properties.Source.BuildSpec['Fn::Sub'][1].DestinationBucketName",
        Source: { Index: 2 },
        Target: { Path: '@.Ref' },
      },
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'website' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::CodeBuild::Project',
            Metadata: { Type: 'website' },
            DependsOn: '%{resourceId}Role',
            Properties: {
              Name: { 'Fn::Sub': '${AWS::StackName}-%{resourceId}' },
              Artifacts: { Type: 'NO_ARTIFACTS' },
              Environment: {
                ComputeType: 'BUILD_GENERAL1_SMALL',
                Image: 'aws/codebuild/amazonlinux2-x86_64-standard:3.0',
                Type: 'LINUX_CONTAINER',
              },
              ServiceRole: { 'Fn::GetAtt': ['%{resourceId}Role', 'Arn'] },
              Source: {
                Type: 'NO_SOURCE',
                BuildSpec: {
                  'Fn::Sub': [
                    'version: 0.2\nphases:\n  install:\n    runtime-versions:\n      nodejs: latest\n      python: latest\n      ruby: latest\n    commands:\n      - |\n        _SOURCE_LOCATION="${SourceLocation}"\n        if [ s3 != "${!_SOURCE_LOCATION%%:*}" ]; then\n          git clone "${SourceLocation}" repo\n          cd repo\n          git checkout "${SourceVersion}"\n        else\n          aws s3 cp "${SourceLocation}" repo.tgz\n          tar --strip-components 1 -xvvzf repo.tgz\n        fi\n      - cd ${SourceDirectory}\n  pre_build:\n    commands:\n      - |\n        if [ ! -f yarn.lock -a -f package.json ]; then\n          npm install --production\n        elif [ -f yarn.lock -a -f package.json ]; then\n          yarn install --production\n        elif [ -f requirements.txt ]; then\n          pip install -r requirements.txt\n        elif [ -f Gemfile ]; then\n          bundle install\n        fi\n  build:\n    commands:\n      - ${BuildCommand}\n  post_build:\n    commands:\n      - if [ $CODEBUILD_BUILD_SUCCEEDING == 0 ]; then exit 1; fi\n      - |\n        _SOURCE_LOCATION=${SourceLocation}\n        if [ s3 != "${!_SOURCE_LOCATION%%:*}" ]; then\n          cd "${!CODEBUILD_SRC_DIR}/repo"\n        else\n          cd "${!CODEBUILD_SRC_DIR}"\n        fi\n      - aws s3 sync \'${PublishDirectory}\' \'s3://${DestinationBucketName}\' --acl public-read --cache-control \'max-age=0, must-revalidate, public\' --no-progress --delete',
                    {
                      PublishDirectory: '%{SETTING:PublishDirectory}',
                      BuildCommand: '%{SETTING:BuildCommand}',
                      SourceDirectory: '%{SETTING:SourceDirectory}',
                    },
                  ],
                },
              },
              Tags: [{ Key: ' Project Type', Value: 'Website Builder' }],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Events',
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
                  'project-name': [{ Ref: '%{resourceId}' }],
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
          Path: '$.Resources.%{resourceId}EventsPermission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            DependsOn: '%{resourceId}Events',
            Properties: {
              Action: 'lambda:InvokeFunction',
              FunctionName: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              Principal: 'events.amazonaws.com',
              SourceArn: { 'Fn::GetAtt': ['%{resourceId}Events', 'Arn'] },
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
                  PolicyName: 'UploadToDestinationObjectStore',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          's3:DeleteObject',
                          's3:GetBucketLocation',
                          's3:GetObject',
                          's3:ListBucket',
                          's3:PutObject',
                          's3:PutObjectAcl',
                        ],
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
            Type: 'Custom::WebsiteBuildTrigger',
            DependsOn: '%{resourceId}Events',
            Properties: {
              ServiceToken: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              Type: 'website',
              ProjectName: { Ref: '%{resourceId}' },
              SourceVersion: { Ref: 'SourceVersion' },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'website', Setting: 'SourceDirectory' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Source.BuildSpec['Fn::Sub'][1].SourceDirectory",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'website', Setting: 'BuildCommand' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Source.BuildSpec['Fn::Sub'][1].BuildCommand",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'website', Setting: 'PublishDirectory' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Source.BuildSpec['Fn::Sub'][1].PublishDirectory",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'website', Setting: 'Environment' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Environment.EnvironmentVariables',
          Transformations: ['ToNameValue'],
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'website',
        FacetType: 'destination',
        TargetType: 'objectStore',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{sourceId}.Properties.Source.BuildSpec['Fn::Sub'][1].DestinationBucketName",
          Template: { Ref: '%{targetId}' },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{sourceId}Role.Properties.Policies[?(@.PolicyName === 'UploadToDestinationObjectStore')].PolicyDocument.Statement[0].Resource",
          Template: [
            { 'Fn::Sub': '${%{targetId}.Arn}/*' },
            { 'Fn::Sub': '${%{targetId}.Arn}' },
          ],
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'website',
        FacetType: 'destination',
        TargetType: 'objectStore',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.Source.BuildSpec['Fn::Sub'][1].DestinationBucketName",
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}Role.Properties.Policies[?(@.PolicyName === 'UploadToDestinationObjectStore')].PolicyDocument.Statement[0].Resource",
        },
      ],
    },
  ],
};
