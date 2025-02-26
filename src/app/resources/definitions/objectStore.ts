export default {
  ResourceTypes: {
    implicitObjectStore: {
      OnlyFormats: ['serverless'],
      IsImplicit: true,
      ExplicitType: 'objectStore',
      Locator: '$.functions[*].events[?(@.s3)]',
      IDBinding: { Path: '@.s3', Transformations: ['ServerlessS3EventName'] },
      PhysicalNameBinding: {
        Path: '@.s3',
        Transformations: ['ServerlessS3EventName'],
      },
      Settings: {},
      Metrics: {
        namespace: 'AWS/S3',
        metrics: [
          {
            type: 'AllRequests',
            label: 'Requests',
            unit: 'Count',
            factors: { a: '4XXError', b: '5XXError' },
          },
          {
            type: '4XXError',
            label: '4XX Errors',
            unit: 'Count',
            factors: { a: 'AllRequests' },
          },
          {
            type: '5XXError',
            label: '5XX Errors',
            unit: 'Count',
            factors: { a: 'AllRequests' },
          },
        ],
        dimensions: [
          { name: 'BucketName', value: '%{physicalId}' },
          { name: 'FilterId', value: 'EntireBucket' },
        ],
      },
      DashboardProperties: {
        hideFromPalette: true,
        label: 'Object Store',
        paletteLabel: 'Object Store',
        paletteHint: 'S3 Bucket',
        paletteResource: 'AWS::S3::Bucket',
        paletteInfo:
          'Use this resource type to store and retrieve any amount of data at any time from your Amazon Simple Storage Service (Amazon S3) buckets.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-s3-bucket.html',
        inputs: 1,
        outputs: 1,
        icon: 'object-store.svg',
        info: 'Stores file data',
        deploymentProperties: {
          arn: 'arn:aws:s3:::%{physicalId}',
          arnLink:
            'https://s3.console.aws.amazon.com/s3/buckets/%{physicalId}/?region=%{region}',
          settings: [{ label: 'Logical ID', value: '%{resourceId}' }],
        },
      },
      DefaultReferences: [
        { BUCKET_NAME: { Ref: '%{resourceId}' } },
        { BUCKET_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'S3CrudPolicy' }],
        IAMCapable: [
          {
            Actions: [
              's3:GetObject',
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:PutObjectAcl',
              's3:GetLifecycleConfiguration',
              's3:PutLifecycleConfiguration',
            ],
          },
        ],
      },
    },
    objectStore: {
      Locator: "$.Resources[?(@.Type === 'AWS::S3::Bucket')]",
      IDConstraint: { Format: { SAM: null, serverless: '^S3Bucket.+$' } },
      PhysicalNameBinding: '@.Properties.BucketName',
      Settings: {
        LogicalId: {
          Label: 'CloudFormation Logical ID',
          ValueType: {
            Format: { SAM: 'logicalId', serverless: 'slsS3BucketLogicalId' },
          },
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        EnableWebsiteHosting: {
          Label: 'Enable Website Hosting',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.WebsiteConfiguration.IndexDocument',
          Transformations: ['Boolean'],
        },
        IndexDocument: {
          Label: 'Index Document',
          ValueType: 'string',
          InputType: 'input',
          DependsOn: { EnableWebsiteHosting: true },
          Default: 'index.html',
          Path: '@.Properties.WebsiteConfiguration.IndexDocument',
        },
        BlockPublicAccess: {
          Label: 'Block Public Access',
          Description:
            'Ignore Object ACLs and Bucket Policies Granting Public Access',
          ValueType: 'boolean',
          InputType: 'checkbox',
          DependsOn: { EnableWebsiteHosting: false },
          Default: true,
          Path: '@.Properties[?(@.IgnorePublicAcls === true && @.RestrictPublicBuckets === true)]',
          Transformations: ['Boolean'],
        },
      },
      Metrics: {
        namespace: 'AWS/S3',
        metrics: [
          {
            type: 'AllRequests',
            label: 'Requests',
            unit: 'Count',
            factors: { a: '4XXError', b: '5XXError' },
          },
          {
            type: '4XXError',
            label: '4XX Errors',
            unit: 'Count',
            factors: { a: 'AllRequests' },
          },
          {
            type: '5XXError',
            label: '5XX Errors',
            unit: 'Count',
            factors: { a: 'AllRequests' },
          },
        ],
        dimensions: [
          { name: 'BucketName', value: '%{physicalId}' },
          { name: 'FilterId', value: 'EntireBucket' },
        ],
      },
      MaximumFromSource: 1,
      DashboardProperties: {
        label: 'Object Store',
        paletteLabel: 'Object Store',
        paletteHint: 'S3 Bucket',
        paletteResource: 'AWS::S3::Bucket',
        paletteInfo:
          'Use this resource type to store and retrieve any amount of data at any time from your Amazon Simple Storage Service (Amazon S3) buckets.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-s3-bucket.html',
        inputs: 1,
        outputs: 1,
        icon: 'object-store.svg',
        info: 'Stores file data',
        deploymentProperties: {
          arn: 'arn:aws:s3:::%{physicalId}',
          arnLink:
            'https://s3.console.aws.amazon.com/s3/buckets/%{physicalId}/?region=%{region}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'Website Hosting Address',
              type: 'link',
              href: 'http://%{physicalId}.s3-website%{region|BucketWebsiteEndpoint}.amazonaws.com',
            },
          ],
        },
      },
      DefaultReferences: [
        { BUCKET_NAME: { Ref: '%{resourceId}' } },
        { BUCKET_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'S3CrudPolicy' }],
        IAMCapable: [
          {
            Actions: [
              's3:GetObject',
              's3:ListBucket',
              's3:GetBucketLocation',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:PutObjectAcl',
              's3:GetLifecycleConfiguration',
              's3:PutLifecycleConfiguration',
            ],
          },
        ],
      },
    },
  },
  GroupingRules: [
    { sourceType: 'AWS::S3::BucketPolicy', targetType: 'AWS::S3::Bucket' },
    {
      sourceType: 'AWS::SNS::TopicPolicy',
      targetIsIntegration: true,
      integrationSourceType: 'AWS::S3::Bucket',
      integrationTargetType: 'AWS::SNS::Topic',
    },
    {
      sourceType: 'AWS::SQS::QueuePolicy',
      targetIsIntegration: true,
      integrationSourceType: 'AWS::S3::Bucket',
      integrationTargetType: 'AWS::SQS::Queue',
    },
  ],
  IntegrationTypes: [
    {
      SourceType: 'objectStore',
      TargetType: 'function',
      Locator: {
        Format: {
          SAM: {
            Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'S3')]",
            Source: { Path: '@.Properties.Bucket' },
            Target: { Index: 2 },
          },
          serverless: {
            Path: '$.functions[*].events[?(@.s3)]',
            Source: {
              Path: '@.s3',
              Transformations: ['ServerlessS3EventName'],
            },
            Target: { Index: 2 },
          },
        },
      },
    },
    {
      SourceType: 'objectStore',
      TargetType: 'topic',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::S3::Bucket')].Properties.NotificationConfiguration.TopicConfigurations",
        Source: { Index: 2 },
        Target: { Path: '@[0].Topic' },
      },
    },
    {
      SourceType: 'objectStore',
      TargetType: 'queue',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::S3::Bucket')].Properties.NotificationConfiguration.QueueConfigurations",
        Source: { Index: 2 },
        Target: { Path: '@[0].Queue' },
      },
    },
    {
      SourceType: 'implicitObjectStore',
      TargetType: 'function',
      Locator: {
        Path: '$.functions[*].events[?(@.s3)]',
        Source: {
          Path: '@.s3',
          Transformations: ['ServerlessS3EventName', 'UppercaseFirstLetter'],
        },
        Target: { Index: 2 },
      },
    },
  ],
  PermissionTypes: {
    objectStore: {
      SAM: {
        S3ReadPolicy: {
          BucketName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
        S3CrudPolicy: {
          BucketName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          's3:AbortMultipartUpload',
          's3:DeleteBucket',
          's3:DeleteObject',
          's3:DeleteObjectTagging',
          's3:DeleteObjectVersion',
          's3:DeleteObjectVersionTagging',
          's3:GetObject',
          's3:GetObjectAcl',
          's3:GetObjectTagging',
          's3:GetObjectTorrent',
          's3:GetObjectVersion',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
          's3:GetObjectVersionTorrent',
          's3:ListBucket',
          's3:ListBucketVersions',
          's3:ListBucketMultipartUploads',
          's3:ListMultipartUploadParts',
          's3:PutObject',
          's3:PutObjectAcl',
          's3:PutObjectTagging',
          's3:PutObjectVersionAcl',
          's3:PutObjectVersionTagging',
          's3:RestoreObject',
        ],
        Resources: {
          WithDependency: [
            { 'Fn::Sub': 'arn:${AWS::Partition}:s3:::${%{resourceId}}' },
            { 'Fn::Sub': 'arn:${AWS::Partition}:s3:::${%{resourceId}}/*' },
          ],
          WithoutDependency: [
            {
              'Fn::Sub': [
                'arn:${AWS::Partition}:s3:::${BucketName}',
                { BucketName: '%{physicalName}' },
              ],
            },
            {
              'Fn::Sub': [
                'arn:${AWS::Partition}:s3:::${BucketName}/*',
                { BucketName: '%{physicalName}' },
              ],
            },
          ],
        },
      },
    },
    implicitObjectStore: {
      SAM: {
        S3ReadPolicy: {
          BucketName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
        S3CrudPolicy: {
          BucketName: {
            WithDependency: { Ref: '%{resourceId}' },
            WithoutDependency: '%{physicalName}',
          },
        },
      },
      Custom: {
        Actions: [
          's3:AbortMultipartUpload',
          's3:DeleteBucket',
          's3:DeleteObject',
          's3:DeleteObjectTagging',
          's3:DeleteObjectVersion',
          's3:DeleteObjectVersionTagging',
          's3:GetObject',
          's3:GetObjectAcl',
          's3:GetObjectTagging',
          's3:GetObjectTorrent',
          's3:GetObjectVersion',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
          's3:GetObjectVersionTorrent',
          's3:ListBucket',
          's3:ListBucketVersions',
          's3:ListBucketMultipartUploads',
          's3:ListMultipartUploadParts',
          's3:PutObject',
          's3:PutObjectAcl',
          's3:PutObjectTagging',
          's3:PutObjectVersionAcl',
          's3:PutObjectVersionTagging',
          's3:RestoreObject',
        ],
        Resources: {
          WithDependency: [
            { 'Fn::Sub': 'arn:${AWS::Partition}:s3:::${%{resourceId}}' },
            { 'Fn::Sub': 'arn:${AWS::Partition}:s3:::${%{resourceId}}/*' },
          ],
          WithoutDependency: [
            {
              'Fn::Sub': [
                'arn:${AWS::Partition}:s3:::${BucketName}',
                { BucketName: '%{physicalName}' },
              ],
            },
            {
              'Fn::Sub': [
                'arn:${AWS::Partition}:s3:::${BucketName}/*',
                { BucketName: '%{physicalName}' },
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
      Conditions: { ResourceType: 'objectStore' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: {
                Format: {
                  SAM: {
                    'Fn::Sub':
                      '${AWS::StackName}-%{resourceId|Lowercase|MaxLength(9)}-${AWS::AccountId}',
                  },
                  serverless: {
                    'Fn::Sub':
                      '${AWS::StackName}-%{resourceId|ServerlessEventSourceName|Lowercase|MaxLength(9)}-${AWS::AccountId}',
                  },
                },
              },
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [
                  {
                    ServerSideEncryptionByDefault: {
                      SSEAlgorithm: 'aws:kms',
                      KMSMasterKeyID: 'alias/aws/s3',
                    },
                  },
                ],
              },
              PublicAccessBlockConfiguration: {
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}BucketPolicy',
          Template: {
            Type: 'AWS::S3::BucketPolicy',
            Properties: {
              Bucket: { Ref: '%{resourceId}' },
              PolicyDocument: {
                Id: 'RequireEncryptionInTransit',
                Version: '2012-10-17',
                Statement: [
                  {
                    Principal: '*',
                    Action: '*',
                    Effect: 'Deny',
                    Resource: [
                      { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
                      { 'Fn::Sub': '${%{resourceId}.Arn}/*' },
                    ],
                    Condition: { Bool: { 'aws:SecureTransport': 'false' } },
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
      Conditions: {
        ResourceType: 'objectStore',
        Setting: 'EnableWebsiteHosting',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.WebsiteConfiguration.IndexDocument',
          Template: '%{SETTING:IndexDocument}',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.BucketEncryption',
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Properties.Bucket.Ref === '%{resourceId}')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'objectStore',
        Setting: 'EnableWebsiteHosting',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.WebsiteConfiguration',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'objectStore',
        Setting: 'EnableWebsiteHosting',
        Value: false,
        CurrentValue: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.BucketEncryption',
          Template: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                  KMSMasterKeyID: 'alias/aws/s3',
                },
              },
            ],
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}BucketPolicy',
          Template: {
            Type: 'AWS::S3::BucketPolicy',
            Properties: {
              Bucket: { Ref: '%{resourceId}' },
              PolicyDocument: {
                Id: 'RequireEncryptionInTransit',
                Version: '2012-10-17',
                Statement: [
                  {
                    Principal: '*',
                    Action: '*',
                    Effect: 'Deny',
                    Resource: [
                      { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
                      { 'Fn::Sub': '${%{resourceId}.Arn}/*' },
                    ],
                    Condition: { Bool: { 'aws:SecureTransport': 'false' } },
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
      Conditions: {
        ResourceType: 'objectStore',
        Setting: 'EnableWebsiteHosting',
        Value: false,
        ResourceSettingValues: { BlockPublicAccess: true },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls',
          Template: true,
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets',
          Template: true,
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'objectStore', Setting: 'IndexDocument' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.WebsiteConfiguration.IndexDocument',
          Template: '%{SETTING:IndexDocument}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'objectStore',
        Setting: 'BlockPublicAccess',
        Value: true,
        CurrentValue: false,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'objectStore',
        Setting: 'BlockPublicAccess',
        Value: false,
        CurrentValue: true,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'objectStore',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}',
          Template: {
            Type: 'S3',
            Properties: {
              Bucket: { Ref: '%{sourceId}' },
              Events: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'],
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'objectStore',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: { s3: { bucket: '%{sourceId|ServerlessEventSourceName}' } },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 's3.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: {
                'Fn::Sub': 'arn:${AWS::Partition}:s3:::%{sourcePhysicalName}',
              },
            },
          },
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.DependsOn',
          Template: '%{sourceId}To%{targetId}Permission',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'objectStore',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{targetId}.Properties.Events.%{integrationId}',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'objectStore',
        TargetType: 'function',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.functions["%{serverlessFunctionId}"].events[%{integrationId}]',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.DependsOn[?(@ === '%{sourceId}To%{targetId}Permission')]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'implicitObjectStore', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: { s3: { bucket: '%{sourceId|ServerlessEventSourceName}' } },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 's3.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: {
                'Fn::Sub': 'arn:${AWS::Partition}:s3:::%{sourcePhysicalName}',
              },
            },
          },
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.DependsOn',
          Template: '%{sourceId}To%{targetId}Permission',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'implicitObjectStore', TargetType: 'function' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.functions["%{serverlessFunctionId}"].events[%{integrationId}]',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'objectStore', TargetType: 'topic' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.NotificationConfiguration.TopicConfigurations',
          Template: [
            { Event: 's3:ObjectCreated:*', Topic: { Ref: '%{targetId}' } },
            { Event: 's3:ObjectRemoved:*', Topic: { Ref: '%{targetId}' } },
          ],
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.DependsOn',
          Template: '%{sourceId}To%{targetId}Permission',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::SNS::TopicPolicy',
            Properties: {
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: { Service: 's3.amazonaws.com' },
                    Action: 'sns:Publish',
                    Resource: { Ref: '%{targetId}' },
                    Condition: {
                      ArnEquals: {
                        'aws:SourceArn': {
                          'Fn::Sub':
                            'arn:${AWS::Partition}:s3:::%{sourcePhysicalName}',
                        },
                      },
                    },
                  },
                ],
              },
              Topics: [{ Ref: '%{targetId}' }],
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'objectStore', TargetType: 'topic' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.NotificationConfiguration.TopicConfigurations',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.DependsOn[?(@ === '%{sourceId}To%{targetId}Permission')]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'objectStore', TargetType: 'queue' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.NotificationConfiguration.QueueConfigurations',
          Template: [
            {
              Event: 's3:ObjectCreated:*',
              Queue: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
            },
            {
              Event: 's3:ObjectRemoved:*',
              Queue: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
            },
          ],
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::SQS::QueuePolicy',
            Properties: {
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: { Service: 's3.amazonaws.com' },
                    Action: 'sqs:SendMessage',
                    Resource: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
                    Condition: {
                      ArnEquals: {
                        'aws:SourceArn': {
                          'Fn::Sub':
                            'arn:${AWS::Partition}:s3:::%{sourcePhysicalName}',
                        },
                      },
                    },
                  },
                ],
              },
              Queues: [{ Ref: '%{targetId}' }],
            },
          },
        },
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.DependsOn',
          Template: '%{sourceId}To%{targetId}Permission',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'objectStore', TargetType: 'queue' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.NotificationConfiguration.QueueConfigurations',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.DependsOn[?(@ === '%{sourceId}To%{targetId}Permission')]",
        },
      ],
    },
  ],
};
