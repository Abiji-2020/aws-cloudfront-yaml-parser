export default {
  ResourceTypes: {
    database: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::RDS::DBInstance' || (@.Type === 'AWS::RDS::DBCluster' && @.Properties.EngineMode === 'serverless'))]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Type: {
          Label: 'Type',
          Description: 'AWS Aurora Serverless cluster or individual instance',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            {
              Label: 'AWS Aurora Serverless Database Cluster',
              Value: 'AWS::RDS::DBCluster',
            },
            {
              Label: 'Single Database Instance',
              Value: 'AWS::RDS::DBInstance',
            },
          ],
          Default: 'AWS::RDS::DBCluster',
          Path: '@.Type',
        },
        EngineCluster: {
          Label: 'Engine',
          Description: 'Database compatibility',
          DependsOn: { Type: 'AWS::RDS::DBCluster' },
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            {
              Label: 'Amazon Aurora with MySQL 5.7 compatibility',
              Value: 'aurora-mysql',
            },
            {
              Label: 'Amazon Aurora with MySQL 5.6 compatibility',
              Value: 'aurora',
            },
            {
              Label: 'Amazon Aurora with PostgreSQL compatibility',
              Value: 'aurora-postgresql',
            },
          ],
          Default: 'aurora-mysql',
          Path: '@.Properties.Engine',
        },
        MinCapacityMySQL57: {
          Label: 'Minimum Cluster Capacity (ACUs)',
          DependsOn: {
            Type: 'AWS::RDS::DBCluster',
            EngineCluster: 'aurora-mysql',
          },
          ValueType: 'number',
          InputType: 'select',
          Choices: [1, 2, 4, 8, 16, 32, 64, 128, 256],
          AwsDefault: 2,
          Default: 2,
          IsConfigurable: true,
          Path: '@.Properties.ScalingConfiguration.MinCapacity',
        },
        MaxCapacityMySQL57: {
          Label: 'Maximum Cluster Capacity (ACUs)',
          DependsOn: {
            Type: 'AWS::RDS::DBCluster',
            EngineCluster: 'aurora-mysql',
          },
          ValueType: 'number',
          InputType: 'select',
          Choices: [1, 2, 4, 8, 16, 32, 64, 128, 256],
          AwsDefault: 256,
          Default: 256,
          IsConfigurable: true,
          Path: '@.Properties.ScalingConfiguration.MaxCapacity',
        },
        MinCapacityMySQL56: {
          Label: 'Minimum Cluster Capacity (ACUs)',
          DependsOn: { Type: 'AWS::RDS::DBCluster', EngineCluster: 'aurora' },
          ValueType: 'number',
          InputType: 'select',
          Choices: [1, 2, 4, 8, 16, 32, 64, 128, 256],
          AwsDefault: 2,
          Default: 2,
          IsConfigurable: true,
          Path: '@.Properties.ScalingConfiguration.MinCapacity',
        },
        MaxCapacityMySQL56: {
          Label: 'Maximum Cluster Capacity (ACUs)',
          DependsOn: { Type: 'AWS::RDS::DBCluster', EngineCluster: 'aurora' },
          ValueType: 'number',
          InputType: 'select',
          Choices: [1, 2, 4, 8, 16, 32, 64, 128, 256],
          AwsDefault: 256,
          Default: 256,
          IsConfigurable: true,
          Path: '@.Properties.ScalingConfiguration.MaxCapacity',
        },
        MinCapacityPostgres: {
          Label: 'Minimum Cluster Capacity (ACUs)',
          DependsOn: {
            Type: 'AWS::RDS::DBCluster',
            EngineCluster: 'aurora-postgresql',
          },
          ValueType: 'number',
          InputType: 'select',
          Choices: [2, 4, 8, 16, 32, 64, 192, 384],
          AwsDefault: 2,
          Default: 2,
          IsConfigurable: true,
          Path: '@.Properties.ScalingConfiguration.MinCapacity',
        },
        MaxCapacityPostgres: {
          Label: 'Maximum Cluster Capacity (ACUs)',
          DependsOn: {
            Type: 'AWS::RDS::DBCluster',
            EngineCluster: 'aurora-postgresql',
          },
          ValueType: 'number',
          InputType: 'select',
          Choices: [2, 4, 8, 16, 32, 64, 192, 384],
          AwsDefault: 384,
          Default: 384,
          IsConfigurable: true,
          Path: '@.Properties.ScalingConfiguration.MaxCapacity',
        },
        AutoPause: {
          Label: 'Auto-Pause',
          Description: 'Whether pausing (scaling down to 0 ACUs) is enabled',
          DependsOn: { Type: 'AWS::RDS::DBCluster' },
          ValueType: 'boolean',
          InputType: 'select',
          Choices: [
            { Label: 'Enabled', Value: true },
            { Label: 'Disabled', Value: false },
          ],
          IsConfigurable: true,
          AwsDefault: false,
          Default: false,
          Path: '@.Properties.ScalingConfiguration.AutoPause',
        },
        Engine: {
          Label: 'Engine',
          Description: 'Database type',
          DependsOn: { Type: 'AWS::RDS::DBInstance' },
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'MariaDB', Value: 'mariadb' },
            { Label: 'MySQL', Value: 'mysql' },
            { Label: 'PostgreSQL', Value: 'postgres' },
            { Label: 'MS SQL Server Express', Value: 'sqlserver-ex' },
            { Label: 'MS SQL Server Web', Value: 'sqlserver-web' },
            { Label: 'MS SQL Server Standard', Value: 'sqlserver-se' },
            { Label: 'MS SQL Server Enterprise', Value: 'sqlserver-ee' },
          ],
          Default: 'mariadb',
          Path: '@.Properties.Engine',
        },
        EngineVersionMariaDB: {
          Label: 'MariaDB Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: ['10.3', '10.2', '10.1', '10.0'],
          Default: '10.3',
          DependsOn: { Engine: 'mariadb', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        EngineVersionMySQL: {
          Label: 'MySQL Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: ['8.0', '5.7', '5.6', '5.5'],
          Default: '8.0',
          DependsOn: { Engine: 'mysql', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        EngineVersionPostgreSQL: {
          Label: 'PostgreSQL Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            '11.5',
            '11.4',
            '11.2',
            '11.1',
            '10.6',
            '10.5',
            '10.4',
            '10.3',
            '10.1',
            '9.6',
            '9.5',
            '9.4',
            '9.3',
          ],
          Default: '11.5',
          DependsOn: { Engine: 'postgres', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        EngineVersionSQLServerExpress: {
          Label: 'SQL Server Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            '15.00.4073.23.v1',
            '14.00.3356.20.v1',
            '14.00.3223.3.v1',
            '13.00.5426.0.v1',
            '12.00.6293.0.v1',
            '11.00.7462.6.v1',
          ],
          Default: '15.00.4073.23.v1',
          DependsOn: { Engine: 'sqlserver-ex', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        EngineVersionSQLServerWeb: {
          Label: 'SQL Server Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            '15.00.4073.23.v1',
            '14.00.3356.20.v1',
            '14.00.3223.3.v1',
            '13.00.5426.0.v1',
            '12.00.6293.0.v1',
            '11.00.7462.6.v1',
          ],
          Default: '15.00.4073.23.v1',
          DependsOn: { Engine: 'sqlserver-web', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        EngineVersionSQLServerStandard: {
          Label: 'SQL Server Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            '15.00.4073.23.v1',
            '14.00.3356.20.v1',
            '14.00.3223.3.v1',
            '13.00.5426.0.v1',
            '12.00.6293.0.v1',
            '11.00.7462.6.v1',
          ],
          Default: '15.00.4073.23.v1',
          DependsOn: { Engine: 'sqlserver-se', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        EngineVersionSQLServerEnterprise: {
          Label: 'SQL Server Version',
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            '15.00.4073.23.v1',
            '14.00.3356.20.v1',
            '14.00.3223.3.v1',
            '13.00.5426.0.v1',
            '12.00.6293.0.v1',
            '11.00.7462.6.v1',
          ],
          Default: '15.00.4073.23.v1',
          DependsOn: { Engine: 'sqlserver-ee', Type: 'AWS::RDS::DBInstance' },
          Path: '@.Properties.EngineVersion',
        },
        StorageSize: {
          Label: 'Storage Size',
          Description: 'Storage size in GB',
          DependsOn: { Type: 'AWS::RDS::DBInstance' },
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          Default: 5,
          Path: '@.Properties.AllocatedStorage',
          Transformations: ['ParseNumber'],
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
        InstanceType: {
          Label: 'Instance Type',
          Description: 'AWS RDS instance class',
          DependsOn: { Type: 'AWS::RDS::DBInstance' },
          ValueType: 'string',
          InputType: 'select',
          IsConfigurable: true,
          Choices: [
            'db.t2.micro',
            'db.t2.small',
            'db.t2.medium',
            'db.t2.large',
            'db.t2.xlarge',
            'db.t2.2xlarge',
            'db.t3.micro',
            'db.t3.small',
            'db.t3.medium',
            'db.t3.large',
            'db.t3.xlarge',
            'db.t3.2xlarge',
            'db.m4.large',
            'db.m4.xlarge',
            'db.m4.2xlarge',
            'db.m4.4xlarge',
            'db.m4.10xlarge',
            'db.m4.16xlarge',
            'db.m5.large',
            'db.m5.xlarge',
            'db.m5.2xlarge',
            'db.m5.4xlarge',
            'db.m5.12xlarge',
            'db.m5.24xlarge',
            'db.r4.large',
            'db.r4.xlarge',
            'db.r4.2xlarge',
            'db.r4.4xlarge',
            'db.r4.8xlarge',
            'db.r4.16xlarge',
            'db.r5.large',
            'db.r5.xlarge',
            'db.r5.2xlarge',
            'db.r5.4xlarge',
            'db.r5.12xlarge',
            'db.r5.24xlarge',
          ],
          Default: 'db.t2.micro',
          Path: '@.Properties.DBInstanceClass',
        },
        FailoverInstance: {
          Label: 'Failover Instance',
          Description:
            'Whether to provision a backup replica for faster recovery of an instance failure',
          DependsOn: { Type: 'AWS::RDS::DBInstance' },
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.MultiAZ',
          Transformations: ['Boolean'],
        },
        UseExistingResource: {
          Label: 'Use Existing RDS Database',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '$.Conditions.%{resourceId}CreateNewResource',
          Transformations: ['Boolean'],
        },
        ExistingResourceData: {
          Label: 'RDS Database ARN',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { UseExistingResource: true },
          Default: 'arn:aws:rds:<Region>:<AWS Account ID>:db:<Instance Name>',
          Path: '$.Resources.%{resourceId}ExistingResource.Properties.Data',
        },
      },
      Metrics: {
        namespace: 'AWS/RDS',
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
          {
            type: 'DatabaseConnections',
            label: 'Connections',
            statistics: ['Maximum'],
          },
        ],
        dimensions: [
          {
            name: '%{SETTING:Type|RDSMetricDimension}',
            value: '%{physicalId}',
          },
        ],
      },
      DashboardProperties: {
        label: 'Database',
        paletteLabel: 'Database',
        paletteHint: 'RDS Database',
        paletteResource: 'AWS::RDS::DBCluster',
        paletteInfo:
          'Use this resource type to set up an Amazon Relational Database Service (Amazon RDS), a web service that makes it easier to set up, operate, and scale a relational database in the cloud.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbcluster.html',
        inputs: 1,
        icon: 'database.svg',
        info: 'Creates a relational database',
        deploymentProperties: {
          arn: 'arn:aws:rds:%{region}:%{awsAccountId}:%{SETTING:Type|RDSArnType}:%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/rds/home?region=%{region}#database:id=%{physicalId};is-cluster=%{SETTING:Type|RDSIsCluster}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'Type', value: '%{SETTING:Type}' },
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
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'CPU Utilization',
                  namespace: 'AWS/RDS',
                  name: 'CPUUtilization',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'Available Memory',
              type: 'cloudwatchChartLink',
              title:
                "Available Memory For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Available Memory',
                  namespace: 'AWS/RDS',
                  name: 'FreeableMemory',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'Swap Usage',
              type: 'cloudwatchChartLink',
              title:
                "Swap Usage For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Swap Usage',
                  namespace: 'AWS/RDS',
                  name: 'SwapUsage',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'Available Storage',
              type: 'cloudwatchChartLink',
              title:
                "Available Storage For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Available Storage',
                  namespace: 'AWS/RDS',
                  name: 'FreeStorageSpace',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'IO Operations',
              type: 'cloudwatchChartLink',
              title:
                "IO Operations For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Read IOPS',
                  namespace: 'AWS/RDS',
                  name: 'ReadIOPS',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
                {
                  label: 'Write IOPS',
                  namespace: 'AWS/RDS',
                  name: 'WriteIOPS',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'IO Latency',
              type: 'cloudwatchChartLink',
              title:
                "IO Latency For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Read Latency',
                  namespace: 'AWS/RDS',
                  name: 'ReadLatency',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
                {
                  label: 'Write Latency',
                  namespace: 'AWS/RDS',
                  name: 'WriteLatency',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'IO Throughput',
              type: 'cloudwatchChartLink',
              title:
                "IO Throughput For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Read Throughput',
                  namespace: 'AWS/RDS',
                  name: 'ReadThroughput',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
                {
                  label: 'Write Throughput',
                  namespace: 'AWS/RDS',
                  name: 'WriteThroughput',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'IO Queue Length',
              type: 'cloudwatchChartLink',
              title:
                "IO Queue Length For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'IO Queue Length',
                  namespace: 'AWS/RDS',
                  name: 'DiskQueueDepth',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'Network Throughput',
              type: 'cloudwatchChartLink',
              title:
                "Network Throughput For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Receive Throughput',
                  namespace: 'AWS/RDS',
                  name: 'NetworkReceiveThroughput',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
                {
                  label: 'Transmit Throughput',
                  namespace: 'AWS/RDS',
                  name: 'NetworkTransmitThroughput',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
            {
              label: 'Database Connections',
              type: 'cloudwatchChartLink',
              title:
                "Database Connections For Database '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/RDS',
              dimensions: ['%{SETTING:Type|RDSMetricDimension}'],
              metrics: [
                {
                  label: 'Database Connections',
                  namespace: 'AWS/RDS',
                  name: 'DatabaseConnections',
                  dimensions: {
                    '%{SETTING:Type|RDSMetricDimension}': '%{physicalId}',
                  },
                },
              ],
            },
          ],
        },
      },
      DefaultReferences: [
        { DB_ID: { Ref: '%{resourceId}' } },
        { DB_ADDRESS: { 'Fn::GetAtt': ['%{resourceId}', 'Endpoint.Address'] } },
        { DB_PORT: { 'Fn::GetAtt': ['%{resourceId}', 'Endpoint.Port'] } },
        {
          DB_ARN: {
            'Fn::Sub':
              'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}',
          },
        },
        { DB_ROOT_USER_SECRET_ARN: { Ref: '%{resourceId}RootUserSecret' } },
      ],
      DefaultPermissions: {
        SAMCapable: [
          {
            PolicyName: 'AWSSecretsManagerGetSecretValuePolicy',
            Parameters: { SecretArn: { Ref: '%{resourceId}RootUserSecret' } },
          },
          {
            Actions: [
              'rds-data:BatchExecuteStatement',
              'rds-data:BeginTransaction',
              'rds-data:CommitTransaction',
              'rds-data:ExecuteStatement',
              'rds-data:RollbackTransaction',
            ],
            Resources: [
              {
                'Fn::Sub':
                  'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}',
              },
            ],
          },
        ],
        IAMCapable: [
          {
            Actions: ['secretsmanager:GetSecretValue'],
            Resources: [{ Ref: '%{resourceId}RootUserSecret' }],
          },
          {
            Actions: [
              'rds-data:BatchExecuteStatement',
              'rds-data:BeginTransaction',
              'rds-data:CommitTransaction',
              'rds-data:ExecuteStatement',
              'rds-data:RollbackTransaction',
            ],
            Resources: [
              {
                'Fn::Sub':
                  'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}',
              },
            ],
          },
        ],
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::RDS::DBInstance',
      targetType:
        '(AWS::EC2::SecurityGroup|AWS::RDS::DBSubnetGroup|AWS::SecretsManager::Secret)',
    },
    {
      sourceType: 'AWS::RDS::DBCluster',
      targetType:
        '(AWS::EC2::SecurityGroup|AWS::RDS::DBSubnetGroup|AWS::SecretsManager::Secret)',
    },
    {
      sourceType: 'AWS::SecretsManager::SecretTargetAttachment',
      targetType: '(AWS::RDS::DBCluster|AWS::RDS::DBInstance)',
    },
  ],
  PermissionTypes: {
    database: {
      SAM: {
        AWSSecretsManagerGetSecretValuePolicy: {
          SecretArn: { WithDependency: { Ref: '%{resourceId}RootUserSecret' } },
        },
      },
      Custom: {
        Actions: [
          'rds-data:BatchExecuteStatement',
          'rds-data:BeginTransaction',
          'rds-data:CommitTransaction',
          'rds-data:ExecuteStatement',
          'rds-data:RollbackTransaction',
        ],
        Resources: {
          WithDependency: [
            {
              'Fn::Sub':
                'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}',
            },
          ],
        },
      },
    },
  },
  VirtualNetworkPlacements: {
    database: {
      Locator:
        "$.Resources[?((@.Type === 'AWS::RDS::DBInstance' || @.Type === 'AWS::RDS::DBCluster') && (@.Properties.VPCSecurityGroups || @.Properties.VpcSecurityGroupIds))]",
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
      Conditions: { ResourceType: 'database' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::RDS::DBCluster',
            Properties: {
              BackupRetentionPeriod: '%{SETTING:BackupRetentionPeriod}',
              DBSubnetGroupName: { Ref: '%{resourceId}SubnetGroup' },
              Engine: '%{SETTING:EngineCluster}',
              EngineMode: 'serverless',
              MasterUsername: {
                'Fn::Sub':
                  '{{resolve:secretsmanager:${%{resourceId}RootUserSecret}:SecretString:username}}',
              },
              MasterUserPassword: {
                'Fn::Sub':
                  '{{resolve:secretsmanager:${%{resourceId}RootUserSecret}:SecretString:password}}',
              },
              EnableHttpEndpoint: true,
              ScalingConfiguration: {
                AutoPause: '%{SETTING:AutoPause}',
                MinCapacity: '%{SETTING:MinCapacityMySQL57}',
                MaxCapacity: '%{SETTING:MaxCapacityMySQL57}',
              },
              StorageEncrypted: true,
              VpcSecurityGroupIds: [{ Ref: '%{resourceId}SecurityGroup' }],
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}SubnetGroup',
          Template: {
            Type: 'AWS::RDS::DBSubnetGroup',
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
                FromPort: '%{SETTING:Engine|DatabasePort}',
                IpProtocol: 'tcp',
                ToPort: '%{SETTING:Engine|DatabasePort}',
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
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}RootUserSecret',
          Template: {
            Type: 'AWS::SecretsManager::Secret',
            Properties: {
              Description: {
                'Fn::Sub': [
                  'Root user login info for Stack ${StackTagName} Environment ${EnvironmentTagName} Database ${ResourceName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              GenerateSecretString: {
                SecretStringTemplate: '{"username": "root"}',
                GenerateStringKey: 'password',
                PasswordLength: 16,
                ExcludeCharacters: '"@/\\',
              },
              Name: {
                'Fn::Sub':
                  '/${EnvironmentTagName}/${StackTagName}/%{resourceId}/RootUser',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}RootUserSecretAttachment',
          Template: {
            Type: 'AWS::SecretsManager::SecretTargetAttachment',
            Properties: {
              SecretId: { Ref: '%{resourceId}RootUserSecret' },
              TargetId: { Ref: '%{resourceId}' },
              TargetType: 'AWS::RDS::DBCluster',
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'Name' },
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
        ResourceType: 'database',
        Setting: 'Type',
        Value: 'AWS::RDS::DBInstance',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Type',
          Template: 'AWS::RDS::DBInstance',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.AllocatedStorage',
          Template: '%{SETTING:StorageSize|ToString}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.AllowMajorVersionUpgrade',
          Template: true,
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.AutoMinorVersionUpgrade',
          Template: true,
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.BackupRetentionPeriod',
          Template: '%{SETTING:BackupRetentionPeriod|ToString}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CopyTagsToSnapshot',
          Template: true,
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.DBInstanceClass',
          Template: '%{SETTING:InstanceType}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Engine',
          Template: '%{SETTING:Engine}',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.EngineMode',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
          Template: '%{SETTING:EngineVersionMariaDB}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.MultiAZ',
          Template: '%{SETTING:FailoverInstance}',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.StorageEncrypted',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.StorageType',
          Template: 'gp2',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.PubliclyAccessible',
          Template: '%{INVPC|Not}',
        },
        {
          Type: 'RenameKey',
          Path: '$.Resources.%{resourceId}.Properties',
          FromKey: 'VpcSecurityGroupIds',
          ToKey: 'VPCSecurityGroups',
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources[*].Properties.Environment.Variables[?(@['Fn::Sub'] === 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}')]['Fn::Sub']",
          Template:
            'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${%{resourceId}}',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.EnableHttpEndpoint',
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources[?(@.Type === 'AWS::SecretsManager::SecretTargetAttachment' && @.Properties.TargetId.Ref === '%{resourceId}')].Properties.TargetType",
          Template: 'AWS::RDS::DBInstance',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Type',
        Value: 'AWS::RDS::DBCluster',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Type',
          Template: 'AWS::RDS::DBCluster',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.AllocatedStorage',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.AllowMajorVersionUpgrade',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.AutoMinorVersionUpgrade',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.BackupRetentionPeriod',
          Template: '%{SETTING:BackupRetentionPeriod}',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CopyTagsToSnapshot',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.DBInstanceClass',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Engine',
          Template: '%{SETTING:EngineCluster}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineMode',
          Template: 'serverless',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.MultiAZ',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration',
          Template: {
            AutoPause: '%{SETTING:AutoPause}',
            MinCapacity: '%{SETTING:MinCapacityMySQL57}',
            MaxCapacity: '%{SETTING:MaxCapacityMySQL57}',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.StorageEncrypted',
          Template: true,
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.StorageType',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.PubliclyAccessible',
        },
        {
          Type: 'RenameKey',
          Path: '$.Resources.%{resourceId}.Properties',
          FromKey: 'VPCSecurityGroups',
          ToKey: 'VpcSecurityGroupIds',
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources[*].Properties.Environment.Variables[?(@['Fn::Sub'] === 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${%{resourceId}}')]['Fn::Sub']",
          Template:
            'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${%{resourceId}}',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EnableHttpEndpoint',
          Template: true,
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources[?(@.Type === 'AWS::SecretsManager::SecretTargetAttachment' && @.Properties.TargetId.Ref === '%{resourceId}')].Properties.TargetType",
          Template: 'AWS::RDS::DBCluster',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'Engine' },
      Reactions: [
        { Type: 'Upsert', Path: '$.Resources.%{resourceId}.Properties.Engine' },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.FromPort',
          ],
          Transformations: ['DatabasePort'],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.ToPort',
          ],
          Transformations: ['DatabasePort'],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.FromPort',
          ],
          Transformations: ['DatabasePort'],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.ToPort',
          ],
          Transformations: ['DatabasePort'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'mariadb',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'mysql',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'postgres',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'sqlserver-ex',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
          Template: 'license-included',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'sqlserver-web',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
          Template: 'license-included',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'sqlserver-se',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
          Template: 'license-included',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'Engine',
        Value: 'sqlserver-ee',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.LicenseModel',
          Template: 'license-included',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'EngineCluster' },
      Reactions: [
        { Type: 'Upsert', Path: '$.Resources.%{resourceId}.Properties.Engine' },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.FromPort',
          ],
          Transformations: ['DatabasePort'],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VPCSecurityGroups[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.ToPort',
          ],
          Transformations: ['DatabasePort'],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.FromPort',
          ],
          Transformations: ['DatabasePort'],
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.VpcSecurityGroupIds[0].Ref',
            '$.Resources.%{value}.Properties.SecurityGroupIngress.ToPort',
          ],
          Transformations: ['DatabasePort'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineCluster',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora-mysql',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Engine',
          Template: '%{SETTING:EngineCluster}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MinCapacity',
          Template: '%{SETTING:MinCapacityMySQL57}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MaxCapacity',
          Template: '%{SETTING:MaxCapacityMySQL57}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineCluster',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Engine',
          Template: '%{SETTING:EngineCluster}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MinCapacity',
          Template: '%{SETTING:MinCapacityMySQL56}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MaxCapacity',
          Template: '%{SETTING:MaxCapacityMySQL56}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineCluster',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora-postgresql',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Engine',
          Template: '%{SETTING:EngineCluster}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MinCapacity',
          Template: '%{SETTING:MinCapacityPostgres}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MaxCapacity',
          Template: '%{SETTING:MaxCapacityPostgres}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionMariaDB',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionMySQL',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionPostgreSQL',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionSQLServerExpress',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionSQLServerWeb',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionSQLServerStandard',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'EngineVersionSQLServerEnterprise',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EngineVersion',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'MinCapacityMySQL57',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora-mysql',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MinCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'MaxCapacityMySQL57',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora-mysql',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MaxCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'MinCapacityMySQL56',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MinCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'MaxCapacityMySQL56',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MaxCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'MinCapacityPostgres',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora-postgresql',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MinCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'MaxCapacityPostgres',
        ResourceSettingValues: {
          Type: 'AWS::RDS::DBCluster',
          EngineCluster: 'aurora-postgresql',
        },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.MaxCapacity',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'AutoPause',
        ResourceSettingValues: { Type: 'AWS::RDS::DBCluster' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.ScalingConfiguration.AutoPause',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'StorageSize' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.AllocatedStorage',
          Transformations: ['ToString'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'BackupRetentionPeriod',
        ResourceSettingValues: { Type: 'AWS::RDS::DBInstance' },
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.BackupRetentionPeriod',
          Transformations: ['ToString'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'database',
        Setting: 'BackupRetentionPeriod',
        ResourceSettingValues: { Type: 'AWS::RDS::DBCluster' },
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
      Conditions: { ResourceType: 'database', Setting: 'InstanceType' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.DBInstanceClass',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'RootPassword' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.MasterUserPassword',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'FailoverInstance' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.MultiAZ',
          Transformations: ['Boolean'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'database', Setting: 'ExistingResourceData' },
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
      Conditions: { ResourceType: 'database' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: '$.Resources.%{resourceId}.Properties.PubliclyAccessible',
          Template: false,
        },
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
      Conditions: { ResourceType: 'database' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: '$.Resources.%{resourceId}.Properties.PubliclyAccessible',
          Template: true,
        },
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
