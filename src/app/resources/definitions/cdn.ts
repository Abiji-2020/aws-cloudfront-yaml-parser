export default {
  ResourceTypes: {
    cdn: {
      Locator: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        UseCustomDomain: {
          Label: 'Use Custom Domain',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.DistributionConfig.Aliases',
          Transformations: ['Boolean'],
        },
        CustomDomain: {
          Label: 'Domain',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseCustomDomain: true },
          Default: null,
          Path: "@.Properties.DistributionConfig.Aliases['Fn::If'][1][0]",
        },
        CustomDomainValidationDomain: {
          Label: 'Validation Domain',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseCustomDomain: true },
          Default: null,
          Path: "$.Resources[?(@.Type === 'Custom::UsEast1SSLCertificate' && @.Properties.DomainName === '%{SETTING:CustomDomain}')].Properties.DomainValidationOptions[?(@.DomainName === '%{SETTING:CustomDomain}')].ValidationDomain",
        },
      },
      FacetSingletons: {
        Format: {
          SAM: [
            'origin',
            'viewerRequests',
            'originRequests',
            'originResponses',
            'viewerResponses',
          ],
          serverless: ['origin'],
        },
      },
      SubResourceLocators: [{ Path: '$.Conditions.%{resourceId}CustomDomain' }],
      MaximumFromSource: 1,
      DashboardProperties: {
        label: 'CDN',
        paletteLabel: 'CDN',
        paletteHint: 'CloudFront Distribution',
        paletteResource: 'AWS::CloudFront::Distribution',
        paletteInfo:
          'Use this resource type to speed up the distribution of your static and dynamic web content.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudfront-distribution.html',
        icon: 'cdn.svg',
        zIndex: -50,
        facetLabels: {
          origin: 'Origin',
          viewerRequests: 'Viewer Requests',
          originRequests: 'Origin Requests',
          originResponses: 'Origin Responses',
          viewerResponses: 'Viewer Responses',
        },
        info: 'Provisions a Content Distribution Network',
        deploymentProperties: {
          arn: 'arn:aws:cloudfront::%{awsAccountId}:distribution/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/cloudfront/home?region=%{region}#distribution-settings:%{physicalId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Custom Domain', value: '%{SETTING:CustomDomain}' },
            {
              label: 'Distribution DNS Name',
              title: '%{INFO:domain}',
              type: 'link',
              href: 'https://%{INFO:domain}',
            },
          ],
        },
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::S3::BucketPolicy',
      targetIsIntegration: true,
      integrationSourceType: 'AWS::CloudFront::Distribution',
      integrationTargetType: 'AWS::S3::Bucket',
    },
    {
      sourceType: 'AWS::CloudFront::Distribution',
      targetType: 'Custom::UsEast1SSLCertificate',
    },
  ],
  IntegrationTypes: [
    {
      SourceType: 'cdn',
      TargetType: 'objectStore',
      FacetType: 'origin',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.Origins && @.Properties.DistributionConfig.Origins.length > 0 && @.Properties.DistributionConfig.Origins[0].DomainName['Fn::GetAtt'] && @.Properties.DistributionConfig.Origins[0].DomainName['Fn::GetAtt'][1].endsWith('DomainName'))].Properties.DistributionConfig.Origins",
        Source: { Index: 2 },
        Target: { Path: '@[0][?(@)]' },
      },
      SubResourceLocators: [
        {
          Path: [
            "$.Resources.%{sourceId}.Properties.DistributionConfig.Origins[0].S3OriginConfig.OriginAccessIdentity['Fn::Sub'][1].OriginAccessIdentity.Ref",
            '$.Resources.%{value}',
          ],
        },
      ],
    },
    {
      SourceType: 'cdn',
      TargetType: 'edgeFunction',
      FacetType: 'viewerRequests',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations)].Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations[?(@.EventType === 'viewer-request')]",
        Source: { Index: 2 },
        Target: { Path: '@.LambdaFunctionARN' },
      },
    },
    {
      SourceType: 'cdn',
      TargetType: 'edgeFunction',
      FacetType: 'originRequests',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations)].Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations[?(@.EventType === 'origin-request')]",
        Source: { Index: 2 },
        Target: { Path: '@.LambdaFunctionARN' },
      },
    },
    {
      SourceType: 'cdn',
      TargetType: 'edgeFunction',
      FacetType: 'originResponses',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations)].Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations[?(@.EventType === 'origin-response')]",
        Source: { Index: 2 },
        Target: { Path: '@.LambdaFunctionARN' },
      },
    },
    {
      SourceType: 'cdn',
      TargetType: 'edgeFunction',
      FacetType: 'viewerResponses',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations)].Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations[?(@.EventType === 'viewer-response')]",
        Source: { Index: 2 },
        Target: { Path: '@.LambdaFunctionARN' },
      },
    },
    {
      SourceType: 'cdn',
      TargetType: 'cdnFunction',
      FacetType: 'viewerRequests',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations)].Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations[?(@.EventType === 'viewer-request')]",
        Source: { Index: 2 },
        Target: { Path: '@.FunctionARN' },
      },
    },
    {
      SourceType: 'cdn',
      TargetType: 'cdnFunction',
      FacetType: 'viewerResponses',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::CloudFront::Distribution' && @.Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations)].Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations[?(@.EventType === 'viewer-response')]",
        Source: { Index: 2 },
        Target: { Path: '@.FunctionARN' },
      },
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'cdn' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::CloudFront::Distribution',
            Properties: {
              DistributionConfig: {
                DefaultCacheBehavior: {
                  CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
                  Compress: true,
                  TargetOriginId: 'CDN',
                  ViewerProtocolPolicy: 'redirect-to-https',
                },
                Enabled: true,
                DefaultRootObject: 'index.html',
                PriceClass: 'PriceClass_100',
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'cdn',
        Setting: 'UseCustomDomain',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Conditions.%{resourceId}CustomDomain',
          Template: {
            'Fn::Not': [
              {
                'Fn::Equals': [
                  'false',
                  '%{SETTING:CustomDomain|ParameterToRef|NullToEmptyString}',
                ],
              },
            ],
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.DistributionConfig.Aliases',
          Template: {
            'Fn::If': [
              '%{resourceId}CustomDomain',
              ['%{SETTING:CustomDomain|ParameterToRef}'],
              { Ref: 'AWS::NoValue' },
            ],
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.DistributionConfig.ViewerCertificate',
          Template: {
            'Fn::If': [
              '%{resourceId}CustomDomain',
              {
                AcmCertificateArn: { Ref: '%{resourceId}SSLCertificate' },
                SslSupportMethod: 'sni-only',
              },
              { Ref: 'AWS::NoValue' },
            ],
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}SSLCertificate',
          Template: {
            Type: 'Custom::UsEast1SSLCertificate',
            Properties: {
              ServiceToken: {
                'Fn::Sub':
                  'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:cfn-agent-commander',
              },
              DomainName: '%{SETTING:CustomDomain|ParameterToRef}',
              DomainValidationOptions: [
                {
                  DomainName: '%{SETTING:CustomDomain|ParameterToRef}',
                  ValidationDomain:
                    '%{SETTING:CustomDomainValidationDomain|ParameterToRef}',
                },
              ],
            },
            Condition: '%{resourceId}CustomDomain',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'cdn',
        Setting: 'UseCustomDomain',
        Value: false,
      },
      Reactions: [
        { Type: 'Delete', Path: '$.Conditions.%{resourceId}CustomDomain' },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.DistributionConfig.Aliases',
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources.%{resourceId}.Properties.DistributionConfig.ViewerCertificate['Fn::If'][1].AcmCertificateArn.Ref",
            '$.Resources.%{value}',
          ],
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.DistributionConfig.ViewerCertificate',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'cdn', Setting: 'CustomDomain' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.DistributionConfig.Aliases['Fn::If'][1][0]",
          Transformations: ['ParameterToRef'],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'Custom::UsEast1SSLCertificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{currentValue}' || @.Properties.DomainName.Ref === %{currentValue|ParameterToParameterId}) :(@.Properties.DomainName === %{currentValue|JSONStringify})))].Properties.DomainValidationOptions[0].DomainName",
          Transformations: ['ParameterToRef'],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'Custom::UsEast1SSLCertificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{currentValue}' || @.Properties.DomainName.Ref === %{currentValue|ParameterToParameterId}) :(@.Properties.DomainName === %{currentValue|JSONStringify})))].Properties.DomainName",
          Transformations: ['ParameterToRef'],
        },
        {
          Type: 'Upsert',
          Path: "$.Conditions.%{resourceId}CustomDomain['Fn::Not'][0]['Fn::Equals'][1]",
          Transformations: ['ParameterToRef'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'cdn',
        Setting: 'CustomDomainValidationDomain',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'Custom::UsEast1SSLCertificate' &&  (@.Properties.DomainName ?(@.Properties.DomainName === '%{SETTING:CustomDomain}' || @.Properties.DomainName.Ref === %{SETTING:CustomDomain|ParameterToParameterId}) :(@.Properties.DomainName === '%{SETTING:CustomDomain}')))].Properties.DomainValidationOptions[?(@.DomainName === '%{SETTING:CustomDomain}')].ValidationDomain",
          Transformations: ['ParameterToRef'],
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'objectStore',
        FacetType: 'origin',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.Origins',
          Template: [
            {
              DomainName: {
                'Fn::GetAtt': ['%{targetId}', 'RegionalDomainName'],
              },
              Id: 'CDN',
              S3OriginConfig: {
                OriginAccessIdentity: {
                  'Fn::Sub': [
                    'origin-access-identity/cloudfront/${OriginAccessIdentity}',
                    {
                      OriginAccessIdentity: {
                        Ref: '%{sourceId}OriginAccessIdentity',
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}OriginAccessIdentity',
          Template: {
            Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
            Properties: {
              CloudFrontOriginAccessIdentityConfig: {
                Comment: 'CloudFormation Template',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}BucketPolicy',
          Template: {
            Type: 'AWS::S3::BucketPolicy',
            Properties: {
              Bucket: { Ref: '%{targetId}' },
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: {
                      AWS: {
                        'Fn::Sub':
                          'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${%{sourceId}OriginAccessIdentity}',
                      },
                    },
                    Action: 's3:GetObject',
                    Resource: {
                      'Fn::Sub': [
                        '${BucketArn}/*',
                        { BucketArn: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] } },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'objectStore',
        FacetType: 'origin',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.Origins',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'edgeFunction',
        FacetType: 'viewerRequests',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations',
          Template: {
            EventType: 'viewer-request',
            LambdaFunctionARN: { 'Fn::GetAtt': ['%{targetId}', 'VersionArn'] },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'edgeFunction',
        FacetType: 'originRequests',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations',
          Template: {
            EventType: 'origin-request',
            LambdaFunctionARN: { 'Fn::GetAtt': ['%{targetId}', 'VersionArn'] },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'edgeFunction',
        FacetType: 'originResponses',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations',
          Template: {
            EventType: 'origin-response',
            LambdaFunctionARN: { 'Fn::GetAtt': ['%{targetId}', 'VersionArn'] },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'edgeFunction',
        FacetType: 'viewerResponses',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations',
          Template: {
            EventType: 'viewer-response',
            LambdaFunctionARN: { 'Fn::GetAtt': ['%{targetId}', 'VersionArn'] },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'cdn', TargetType: 'edgeFunction' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations[%{integrationId}]',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'cdnFunction',
        FacetType: 'viewerRequests',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations',
          Template: {
            EventType: 'viewer-request',
            FunctionARN: {
              'Fn::GetAtt': ['%{targetId}', 'FunctionMetadata.FunctionARN'],
            },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'cdn',
        TargetType: 'cdnFunction',
        FacetType: 'viewerResponses',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations',
          Template: {
            EventType: 'viewer-response',
            FunctionARN: {
              'Fn::GetAtt': ['%{targetId}', 'FunctionMetadata.FunctionARN'],
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'cdn', TargetType: 'cdnFunction' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.DistributionConfig.DefaultCacheBehavior.FunctionAssociations[%{integrationId}]',
        },
      ],
    },
  ],
};
