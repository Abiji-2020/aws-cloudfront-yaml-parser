export default {
  ResourceTypes: {
    virtualNetwork: {
      Locator: "$.Resources[?(@.Type === 'AWS::EC2::VPC')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        IPRange: {
          Label: 'IP Range',
          Description: 'CIDR block range of IP addresses',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          Path: '@.Properties.CidrBlock',
          Default: '10.0.0.0/16',
        },
        DynamoDBEndpoint: {
          Label: 'Enable DynamoDB Private Link Endpoint',
          Description:
            'Routes DynamoDB access through AWS rather than over the public internet',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "$.Resources[?(@.Type === 'AWS::EC2::VPCEndpoint' && @.Properties.VpcId.Ref === '%{resourceId}' && @.Properties.ServiceName['Fn::Sub'].endsWith('dynamodb'))]",
          Transformations: ['Boolean'],
        },
        APIGatewayEndpoint: {
          Label: 'Enable API Gateway Private Link Endpoint',
          Description: 'Enables access to private Rest Apis',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "$.Resources[?(@.Type === 'AWS::EC2::VPCEndpoint' && @.Properties.VpcId.Ref === '%{resourceId}' && @.Properties.ServiceName['Fn::Sub'].endsWith('execute-api'))]",
          Transformations: ['Boolean'],
        },
        UseExistingResource: {
          Label: 'Use Existing VPC',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'VPC Data',
          ValueType: 'string',
          InputType: 'yaml',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default: {
            VpcId: '<VPC ID>',
            DefaultPublicSubnetIds: [
              '<Public Subnet ID 1>',
              '<Public Subnet ID 2>',
            ],
            DefaultPrivateSubnetIds: [
              '<Private Subnet ID 1>',
              '<Private Subnet ID 2>',
            ],
          },
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      SubResourceLocators: [
        {
          Path: "$.Resources[?(@.Type === 'AWS::EC2::Subnet' && @.Properties.VpcId.Ref === '%{resourceId}')]",
        },
      ],
      DashboardProperties: {
        label: 'Virtual Network',
        paletteLabel: 'Virtual Network',
        paletteHint: 'EC2 VPC',
        paletteResource: 'AWS::EC2::VPC',
        paletteInfo:
          "Amazon Virtual Private Cloud (Amazon VPC) enables you to launch AWS resources into a virtual network that you've defined.",
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html',
        icon: 'virtual-network.svg',
        info: 'A Virtual network for isolating resources',
        initialWidth: 600,
        initialHeight: 400,
        outputs: 1,
        zIndex: -100,
        sizable: true,
        deploymentProperties: {
          arn: 'arn:aws:ec2:%{region}:%{awsAccountId}:vpc/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/vpc/home?region=%{region}#vpcs:filter=%{physicalId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'IP Range', value: '%{SETTING:IPRange}' },
          ],
        },
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::EC2::NatGateway',
      targetType: 'AWS::EC2::(EIP|Subnet)',
    },
    {
      sourceType: 'AWS::EC2::Route',
      targetType: 'AWS::EC2::(EIP|RouteTable|InternetGateway|NatGateway)',
    },
    {
      sourceType: 'AWS::EC2::SubnetRouteTableAssociation',
      targetType: 'AWS::EC2::(RouteTable|Subnet)',
    },
    {
      sourceType: 'AWS::EC2::VPCGatewayAttachment',
      targetType: '(AWS::EC2::InternetGateway|AWS::EC2::VPC)',
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'virtualNetwork' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: '%{SETTING:IPRange}',
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName}',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet1',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Subnet',
            Properties: {
              AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
              CidrBlock: {
                'Fn::Select': [
                  0,
                  { 'Fn::Cidr': ['%{SETTING:IPRange}', 4, 14] },
                ],
              },
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Private Subnet 1',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet2',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Subnet',
            Properties: {
              AvailabilityZone: { 'Fn::Select': [1, { 'Fn::GetAZs': '' }] },
              CidrBlock: {
                'Fn::Select': [
                  1,
                  { 'Fn::Cidr': ['%{SETTING:IPRange}', 4, 14] },
                ],
              },
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Private Subnet 2',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnet1',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Subnet',
            Properties: {
              AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
              CidrBlock: {
                'Fn::Select': [
                  2,
                  { 'Fn::Cidr': ['%{SETTING:IPRange}', 4, 14] },
                ],
              },
              MapPublicIpOnLaunch: true,
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Public Subnet 1',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnet2',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Subnet',
            Properties: {
              AvailabilityZone: { 'Fn::Select': [1, { 'Fn::GetAZs': '' }] },
              CidrBlock: {
                'Fn::Select': [
                  3,
                  { 'Fn::Cidr': ['%{SETTING:IPRange}', 4, 14] },
                ],
              },
              MapPublicIpOnLaunch: true,
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Public Subnet 2',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet1NatGatewayEIP',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::EIP',
            Properties: { Domain: 'vpc' },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet1NatGateway',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::NatGateway',
            Properties: {
              AllocationId: {
                'Fn::GetAtt': [
                  '%{resourceId}PrivateSubnet1NatGatewayEIP',
                  'AllocationId',
                ],
              },
              SubnetId: { Ref: '%{resourceId}PublicSubnet1' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet1RouteTable',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::RouteTable',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Private Subnet 1 Route Table',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet1NatGatewayRoute',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Route',
            Properties: {
              DestinationCidrBlock: '0.0.0.0/0',
              NatGatewayId: { Ref: '%{resourceId}PrivateSubnet1NatGateway' },
              RouteTableId: { Ref: '%{resourceId}PrivateSubnet1RouteTable' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet1RouteTableAssociation',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              RouteTableId: { Ref: '%{resourceId}PrivateSubnet1RouteTable' },
              SubnetId: { Ref: '%{resourceId}PrivateSubnet1' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet2NatGatewayEIP',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::EIP',
            Properties: { Domain: 'vpc' },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet2NatGateway',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::NatGateway',
            Properties: {
              AllocationId: {
                'Fn::GetAtt': [
                  '%{resourceId}PrivateSubnet2NatGatewayEIP',
                  'AllocationId',
                ],
              },
              SubnetId: { Ref: '%{resourceId}PublicSubnet2' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet2RouteTable',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::RouteTable',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Private Subnet 2 Route Table',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet2NatGatewayRoute',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Route',
            Properties: {
              DestinationCidrBlock: '0.0.0.0/0',
              NatGatewayId: { Ref: '%{resourceId}PrivateSubnet2NatGateway' },
              RouteTableId: { Ref: '%{resourceId}PrivateSubnet2RouteTable' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PrivateSubnet2RouteTableAssociation',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              RouteTableId: { Ref: '%{resourceId}PrivateSubnet2RouteTable' },
              SubnetId: { Ref: '%{resourceId}PrivateSubnet2' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnetsInternetGateway',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::InternetGateway',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Public Subnets Internet Gateway',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnetsInternetGatewayAttachment',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::VPCGatewayAttachment',
            Properties: {
              InternetGatewayId: {
                Ref: '%{resourceId}PublicSubnetsInternetGateway',
              },
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnetsRouteTable',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::RouteTable',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Public Subnets Route Table',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnetsInternetGatewayRoute',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::Route',
            Properties: {
              DestinationCidrBlock: '0.0.0.0/0',
              GatewayId: { Ref: '%{resourceId}PublicSubnetsInternetGateway' },
              RouteTableId: { Ref: '%{resourceId}PublicSubnetsRouteTable' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnet1RouteTableAssociation',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              RouteTableId: { Ref: '%{resourceId}PublicSubnetsRouteTable' },
              SubnetId: { Ref: '%{resourceId}PublicSubnet1' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}PublicSubnet2RouteTableAssociation',
          Template: {
            Metadata: { Managed: true },
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              RouteTableId: { Ref: '%{resourceId}PublicSubnetsRouteTable' },
              SubnetId: { Ref: '%{resourceId}PublicSubnet2' },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'virtualNetwork', Setting: 'Name' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          CreatePath: false,
          Transformations: ['TagEscape'],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::EC2::Subnet' && @.Properties.VpcId.Ref === '%{resourceId}')].Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          CreatePath: false,
          Transformations: ['TagEscape'],
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::EC2::VPCGatewayAttachment' && @.Properties.VpcId.Ref === '%{resourceId}')].Properties.InternetGatewayId.Ref",
            "$.Resources.%{value}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          ],
          CreatePath: false,
          Transformations: ['TagEscape'],
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::EC2::Subnet' && @.Properties.VpcId.Ref === '%{resourceId}')]",
            "$.Resources[?(@.Type === 'AWS::EC2::SubnetRouteTableAssociation' && @.Properties.SubnetId.Ref === '%{key}')].Properties.RouteTableId.Ref",
            "$.Resources.%{value}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          ],
          CreatePath: false,
          Transformations: ['TagEscape'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'virtualNetwork', Setting: 'IPRange' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CidrBlock',
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::EC2::Subnet' && @.Properties.VpcId.Ref === '%{resourceId}')].Properties.CidrBlock['Fn::Select'][1]['Fn::Cidr'][0]",
          CreatePath: false,
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'virtualNetwork',
        Setting: 'DynamoDBEndpoint',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}DynamoDBEndpoint',
          Template: {
            Type: 'AWS::EC2::VPCEndpoint',
            Properties: {
              RouteTableIds: [
                { Ref: '%{resourceId}PublicSubnetsRouteTable' },
                { Ref: '%{resourceId}PrivateSubnet1RouteTable' },
                { Ref: '%{resourceId}PrivateSubnet2RouteTable' },
              ],
              ServiceName: {
                'Fn::Sub': 'com.amazonaws.${AWS::Region}.dynamodb',
              },
              VpcEndpointType: 'Gateway',
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'virtualNetwork',
        Setting: 'APIGatewayEndpoint',
        Value: false,
      },
      Reactions: [
        { Type: 'Delete', Path: '$.Resources.%{resourceId}DynamoDBEndpoint' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'virtualNetwork',
        Setting: 'APIGatewayEndpoint',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}APIGatewayEndpoint',
          Template: {
            Type: 'AWS::EC2::VPCEndpoint',
            Properties: {
              PrivateDnsEnabled: true,
              SecurityGroupIds: [
                { Ref: '%{resourceId}APIGatewayEndpointSecurityGroup' },
              ],
              ServiceName: {
                'Fn::Sub': 'com.amazonaws.${AWS::Region}.execute-api',
              },
              SubnetIds: [
                { Ref: '%{resourceId}PrivateSubnet1' },
                { Ref: '%{resourceId}PrivateSubnet2' },
              ],
              VpcEndpointType: 'Interface',
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}APIGatewayEndpointSecurityGroup',
          Template: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
              GroupDescription: {
                'Fn::Sub': [
                  'Stack ${StackTagName} Environment ${EnvironmentTagName} Virtual Network ${ResourceName} Private API Gateway Access',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              SecurityGroupIngress: [
                {
                  CidrIp: '0.0.0.0/0',
                  Description: 'Access API Gateway From VPC',
                  FromPort: 443,
                  IpProtocol: 'tcp',
                  ToPort: 443,
                },
              ],
              VpcId: { Ref: '%{resourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EnableDnsHostnames',
          Template: true,
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'virtualNetwork',
        Setting: 'DynamoDBEndpoint',
        Value: false,
      },
      Reactions: [
        { Type: 'Delete', Path: '$.Resources.%{resourceId}APIGatewayEndpoint' },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}APIGatewayEndpointSecurityGroup',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'virtualNetwork',
        Setting: 'ExistingResourceData',
      },
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
  ],
};
