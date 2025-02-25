export default {
  ResourceTypes: {
    graphdb: {
      Locator: "$.Resources[?(@.Type === 'AWS::Neptune::DBCluster')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        InstanceType: {
          Label: 'Instance Type',
          Description: 'Amazon Neptune instance class',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            'db.r5.large',
            'db.r5.xlarge',
            'db.r5.2xlarge',
            'db.r5.4xlarge',
            'db.r5.12xlarge',
            'db.t3.medium',
          ],
          Default: 'db.r5.large',
          Path: "$.Resources[?(@.Type === 'AWS::Neptune::DBInstance' && @.Properties.DBClusterIdentifier.Ref === '%{resourceId}')].Properties.DBInstanceClass",
        },
        BackupRetentionPeriod: {
          Label: 'Backup Retention Period',
          Description: 'Number of days to keep automated backups for',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Default: 1,
          Path: '@.Properties.BackupRetentionPeriod',
          Transformations: ['ParseNumber'],
        },
        UseExistingResource: {
          Label: 'Use Existing Neptune Database',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'Neptune Database Cluster ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default:
            'arn:aws:rds:<Region>:<AWS Account ID>:cluster:<Cluster Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      Metrics: {
        namespace: 'AWS/Neptune',
        metrics: [
          {
            type: 'FreeStorageSpace',
            label: 'Available Storage',
            unit: 'Bytes',
            statistics: ['Average'],
          },
          {
            type: 'FreeableMemory',
            label: 'Available RAM',
            unit: 'Bytes',
            statistics: ['Average'],
          },
          {
            type: 'CPUUtilization',
            label: 'CPU Utilization',
            unit: 'Percent',
            statistics: ['Average'],
          },
        ],
        dimensions: [{ name: 'DBClusterIdentifier', value: '%{physicalId}' }],
      },
      DashboardProperties: {
        label: 'Graph Database',
        paletteLabel: 'Graph Database',
        paletteHint: 'Neptune Database',
        paletteResource: 'AWS::Neptune::DBCluster',
        paletteInfo:
          'Use this resource type to set up an Amazon Neptune Graph Database Service',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-neptune-dbcluster.html',
        inputs: 1,
        icon: 'ic-aws-neptune.svg',
        info: 'Creates a graph database',
        deploymentProperties: {
          arn: 'arn:aws:rds:%{region}:%{awsAccountId}:cluster:%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/neptune/home?region=%{region}#cluster:ids=%{physicalId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Instance Type', value: '%{SETTING:InstanceType}' },
            {
              label: 'Backup Retention Period (Days)',
              value: '%{SETTING:BackupRetentionPeriod}',
            },
            { label: 'DNS Name', value: '%{INFO:address}' },
            { label: 'Port', value: '%{INFO:port}' },
          ],
          consoleLinks: [
            {
              label: 'CPU Utilization',
              type: 'cloudwatchChartLink',
              title:
                "CPU Utilization For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: ['DBClusterIdentifier'],
              metrics: [
                {
                  label: 'CPU Utilization',
                  namespace: 'AWS/Neptune',
                  name: 'CPUUtilization',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Available Memory',
              type: 'cloudwatchChartLink',
              title:
                "Available Memory For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: [{ DBClusterIdentifier: '%{physicalId}' }],
              metrics: [
                {
                  label: 'Available Memory',
                  namespace: 'AWS/Neptune',
                  name: 'FreeableMemory',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Available Storage',
              type: 'cloudwatchChartLink',
              title:
                "Available Storage For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: ['DBClusterIdentifier'],
              metrics: [
                {
                  label: 'Available Storage',
                  namespace: 'AWS/Neptune',
                  name: 'FreeLocalStorage',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'IO Operations',
              type: 'cloudwatchChartLink',
              title:
                "IO Operations For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: ['DBClusterIdentifier'],
              metrics: [
                {
                  label: 'Read IOPS',
                  namespace: 'AWS/Neptune',
                  name: 'VolumeReadIOPs',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
                {
                  label: 'Write IOPS',
                  namespace: 'AWS/Neptune',
                  name: 'VolumeWriteIOPs',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Network IO Throughput',
              type: 'cloudwatchChartLink',
              title:
                "Network IO Throughput For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: ['DBClusterIdentifier'],
              metrics: [
                {
                  label: 'Receive Throughput',
                  namespace: 'AWS/Neptune',
                  name: 'NetworkReceiveThroughput',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
                {
                  label: 'Transmit Throughput',
                  namespace: 'AWS/Neptune',
                  name: 'NetworkTransmitThroughput',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Gremlin Requests Per Second',
              type: 'cloudwatchChartLink',
              title:
                "Gremlin Requests Per Second For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: ['DBClusterIdentifier'],
              metrics: [
                {
                  label: 'GremlinRequestsPerSec',
                  namespace: 'AWS/Neptune',
                  name: 'GremlinRequestsPerSec',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'SPARQL Requests Per Second',
              type: 'cloudwatchChartLink',
              title:
                "SPARQL Requests Per Second For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/Neptune',
              dimensions: ['DBClusterIdentifier'],
              metrics: [
                {
                  label: 'SparqlRequestsPerSec',
                  namespace: 'AWS/Neptune',
                  name: 'SparqlRequestsPerSec',
                  dimensions: { DBClusterIdentifier: '%{physicalId}' },
                },
              ],
            },
          ],
        },
      },
      DefaultReferences: [
        { DB_ADDRESS: { 'Fn::GetAtt': ['%{resourceId}', 'Endpoint'] } },
        {
          DB_ARN: {
            'Fn::Sub':
              'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}',
          },
        },
        { DB_ID: { 'Fn::GetAtt': ['%{resourceId}', 'ClusterResourceId'] } },
        { DB_PORT: { 'Fn::GetAtt': ['%{resourceId}', 'Port'] } },
      ],
      DefaultPermissions: { IAMCapable: [{ Actions: ['neptune-db:connect'] }] },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::Neptune::DBInstance',
      targetType: '(AWS::EC2::SecurityGroup|AWS::Neptune::DBSubnetGroup)',
    },
    {
      sourceType: 'AWS::Neptune::DBCluster',
      targetType: '(AWS::EC2::SecurityGroup|AWS::Neptune::DBSubnetGroup)',
    },
  ],
  PermissionTypes: {
    graphdb: {
      Custom: {
        Resources: {
          WithDependency: {
            'Fn::Sub':
              'arn:aws:neptune-db:${AWS::Region}:${AWS::AccountId}:${%{resourceId}.ClusterResourceId}/*',
          },
          WithoutDependency: {
            'Fn::Sub':
              'arn:aws:neptune-db:${AWS::Region}:${AWS::AccountId}:*/*',
          },
        },
      },
    },
  },
  VirtualNetworkPlacements: {
    graphdb: {
      Locator:
        "$.Resources[?((@.Type === 'AWS::Neptune::DBCluster') && (@.Properties.VPCSecurityGroups || @.Properties.VpcSecurityGroupIds))]",
      ResourceIndex: 2,
      UseDefaultVPCWhenNotPlaced: true,
      Subnets: {
        Path: [
          '@.Properties.DBSubnetGroupName.Ref',
          '$.Resources.%{value}.Properties.SubnetIds',
        ],
      },
      DefaultSubnetTypes: 'private',
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'graphdb' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::Neptune::DBCluster',
            Properties: {
              BackupRetentionPeriod: '%{SETTING:BackupRetentionPeriod}',
              DBSubnetGroupName: { Ref: '%{resourceId}SubnetGroup' },
              IamAuthEnabled: true,
              StorageEncrypted: true,
              KmsKeyId: 'alias/aws/rds',
              VpcSecurityGroupIds: [{ Ref: '%{resourceId}SecurityGroup' }],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Instance',
          Template: {
            Type: 'AWS::Neptune::DBInstance',
            Properties: {
              AllowMajorVersionUpgrade: false,
              AutoMinorVersionUpgrade: true,
              DBClusterIdentifier: { Ref: '%{resourceId}' },
              DBInstanceClass: '%{SETTING:InstanceType}',
              DBSubnetGroupName: { Ref: '%{resourceId}SubnetGroup' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}SubnetGroup',
          Template: {
            Type: 'AWS::Neptune::DBSubnetGroup',
            Properties: {
              DBSubnetGroupDescription: {
                'Fn::Sub': [
                  'Stack ${StackTagName} Environment ${EnvironmentTagName} Database ${ResourceName} VPC Subnets',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              SubnetIds: { Ref: 'DefaultVPCSubnets' },
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Database ${ResourceName} VPC Subnets',
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
          Path: '$.Resources.%{resourceId}SecurityGroup',
          Template: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
              GroupDescription: 'Database Security Group',
              SecurityGroupIngress: {
                CidrIp: '0.0.0.0/0',
                FromPort: 8182,
                IpProtocol: 'tcp',
                ToPort: 8182,
              },
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Database ${ResourceName} VPC Security Group',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                },
              ],
              VpcId: { Ref: 'DefaultVPCId' },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphdb', Setting: 'Name' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources.%{resourceId}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.DBSubnetGroupName.Ref',
            "$.Resources.%{value}.Properties.DBSubnetGroupDescription['Fn::Sub'][1].ResourceName",
            "$.Resources.%{value}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          ],
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            "$.Resources.%{value}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          ],
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            "$.Resources.%{value}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          ],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'graphdb',
        Setting: 'BackupRetentionPeriod',
        ResourceSettingValues: { Type: 'AWS::Neptune::DBCluster' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.BackupRetentionPeriod',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphdb', Setting: 'InstanceType' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Instance.Properties.DBInstanceClass',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphdb', Setting: 'ExistingResourceData' },
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
      Conditions: { ResourceType: 'graphdb' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.DBSubnetGroupName.Ref',
            '$.Resources.%{value}.Properties.SubnetIds',
          ],
          Template: '%{subnetIds}',
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            '$.Resources.%{value}.Properties.VpcId',
          ],
          Template: '%{vpcId}',
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            '$.Resources.%{value}.Properties.VpcId',
          ],
          Template: '%{vpcId}',
        },
      ],
    },
    {
      Action: 'DeleteVirtualNetworkPlacement',
      Conditions: { ResourceType: 'graphdb' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.DBSubnetGroupName.Ref',
            '$.Resources.%{value}.Properties.SubnetIds',
          ],
          Template: { Ref: 'DefaultVPCSubnets' },
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            '$.Resources.%{value}.Properties.VpcId',
          ],
          Template: { Ref: 'DefaultVPCId' },
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            '$.Resources.%{value}.Properties.VpcId',
          ],
          Template: { Ref: 'DefaultVPCId' },
        },
      ],
    },
  ],
};
