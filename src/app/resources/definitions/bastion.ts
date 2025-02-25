export default {
  ResourceTypes: {
    bastion: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::AutoScaling::AutoScalingGroup' && @.Metadata && @.Metadata.Type === 'bastion')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        SSHKeys: {
          Label: 'SSH Keys',
          Description:
            'SSH public key signatures to grant users access to Bastion server',
          InputType: 'yaml',
          IsConfigurable: true,
          Default: {
            '<username1>': '<public key>',
            '<username2>': '<public key>',
          },
          Path: [
            '@.Properties.LaunchConfigurationName.Ref',
            "$.Resources.%{value}.Properties.UserData['Fn::Base64']['Fn::Sub'][1].SSHKeys",
          ],
          Transformations: ['JSONParse'],
        },
      },
      DashboardProperties: {
        label: 'Bastion',
        paletteLabel: 'Bastion',
        paletteHint: 'SSH Server For A Virtual Network',
        paletteResource: 'Bastion',
        paletteInfo:
          'Use this resource type to provide secure access to Linux instances located in the private and public subnets.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-autoscaling-autoscalinggroup.html',
        icon: 'bastion.svg',
        info: 'Provisions a small server to provide secure SSH access to private resources within a Virtual Network',
        deploymentProperties: {
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            { label: 'IP Address', value: '%{INFO:ipAddress}' },
          ],
        },
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::AutoScaling::LaunchConfiguration',
      targetType: 'AWS::EC2::SecurityGroup',
    },
    {
      sourceType: 'AWS::AutoScaling::AutoScalingGroup',
      targetType: 'AWS::AutoScaling::LaunchConfiguration',
    },
    {
      sourceType: 'AWS::AutoScaling::AutoScalingGroup',
      targetType: 'AWS::SSM::Association',
    },
    {
      sourceType: 'AWS::SSM::Association',
      targetType: 'AWS::AutoScaling::AutoScalingGroup',
    },
  ],
  VirtualNetworkPlacements: {
    bastion: {
      Locator:
        "$.Resources[?(@.Type === 'AWS::AutoScaling::AutoScalingGroup' && @.Metadata && @.Metadata.Type === 'bastion')]",
      ResourceIndex: 2,
      Subnets: { Path: '@.Properties.VPCZoneIdentifier' },
      DefaultSubnetTypes: 'public',
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'bastion' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::AutoScaling::AutoScalingGroup',
            Metadata: { Type: 'bastion' },
            Properties: {
              LaunchConfigurationName: {
                Ref: '%{resourceId}LaunchConfiguration',
              },
              MaxSize: 2,
              MinSize: 1,
              DesiredCapacity: 1,
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Bastion ${ResourceName} Instance',
                      { ResourceName: '%{resourceId}' },
                    ],
                  },
                  PropagateAtLaunch: true,
                },
              ],
            },
            UpdatePolicy: {
              AutoScalingRollingUpdate: { MinInstancesInService: 1 },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}IAMRole',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: { Service: 'ec2.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              },
              RoleName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(23)}',
              },
              ManagedPolicyArns: [
                'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
              Policies: [
                {
                  PolicyName: 'BastionPermissions',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'cloudwatch:PutMetricData',
                          'cloudwatch:GetMetricStatistics',
                          'cloudwatch:ListMetrics',
                          'ec2:DescribeTags',
                        ],
                        Resource: '*',
                      },
                      {
                        Effect: 'Allow',
                        Action: [
                          'logs:CreateLogGroup',
                          'logs:CreateLogStream',
                          'logs:DescribeLogStreams',
                          'logs:PutLogEvents',
                        ],
                        Resource: [
                          'arn:aws:logs:*:*:log-group:/cfn/bastion/*',
                          'arn:aws:logs:*:*:log-group:/cfn/bastion/*:log-stream:*',
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
          Path: '$.Resources.%{resourceId}IAMInstanceProfile',
          Template: {
            Type: 'AWS::IAM::InstanceProfile',
            Properties: { Roles: [{ Ref: '%{resourceId}IAMRole' }] },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}InstancesSecurityGroup',
          Template: {
            Type: 'AWS::EC2::SecurityGroup',
            Properties: {
              GroupDescription: 'Bastion Instances Security Group',
              SecurityGroupIngress: [
                {
                  CidrIp: '0.0.0.0/0',
                  IpProtocol: 'tcp',
                  FromPort: '22',
                  ToPort: '22',
                },
              ],
              SecurityGroupEgress: [{ CidrIp: '0.0.0.0/0', IpProtocol: '-1' }],
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    'Fn::Sub': [
                      'Stack ${StackTagName} Environment ${EnvironmentTagName} Bastion ${ResourceName} Instances Security Group',
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
          Path: '$.Resources.%{resourceId}LaunchConfiguration',
          Template: {
            Type: 'AWS::AutoScaling::LaunchConfiguration',
            Properties: {
              IamInstanceProfile: { Ref: '%{resourceId}IAMInstanceProfile' },
              ImageId: { Ref: 'AmazonLinux2ImageId' },
              InstanceType: 't2.nano',
              SecurityGroups: [{ Ref: '%{resourceId}InstancesSecurityGroup' }],
              UserData: {
                'Fn::Base64': {
                  'Fn::Sub': [
                    'Content-Type: multipart/mixed; boundary="==BOUNDARY=="\nMIME-Version: 1.0\n\n--==BOUNDARY==\nMIME-Version: 1.0\nContent-Type: text/x-shellscript\n\n#!/bin/bash\n# Install awslogs, the jq JSON parser, and cfn-signal stuff\nyum install -y awslogs jq\n\n# Inject the CloudWatch Logs configuration file contents\ncat > /etc/awslogs/awslogs.conf <<- EOF\n[general]\nstate_file = /var/lib/awslogs/agent-state\n\n[/var/log/dmesg]\nfile = /var/log/dmesg\nlog_group_name = /${AWS::StackName}-${ResourceId}/dmesg\nlog_stream_name = {instance_id}\n\n[/var/log/messages]\nfile = /var/log/messages\nlog_group_name = /${AWS::StackName}-${ResourceId}/messages\nlog_stream_name = {instance_id}\ndatetime_format = %b %d %H:%M:%S\n\n[/var/log/secure]\nfile = /var/log/secure\nlog_group_name = /${AWS::StackName}-${ResourceId}/secure\nlog_stream_name = {instance_id}\n\n[/var/log/auth.log]\nfile = /var/log/auth.log\nlog_group_name = /${AWS::StackName}-${ResourceId}/auth.log\nlog_stream_name = {instance_id}\n\nEOF\n\nexec 2>>/var/log/cloudwatch-logs-start.log\nset -x\n\n# Grab the instance id ARN from instance metadata\ninstance_id=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\n\n# Replace the instance ID placeholders with the actual values\nsed -i -e "s/{instance_id}/$instance_id/g" /etc/awslogs/awslogs.conf\n\nservice awslogs start\nchkconfig awslogs on\n\n########################################################################\n# Create user logins and add their ssh key\n########################################################################\necho \'${SSHKeys}\' > ~ec2-user/users.json\nfilename="user.keys"\njq -r \'to_entries[] | "\\(.key) \\(.value)"\' ~ec2-user/users.json > "$filename"\n\nwhile read -r user key\ndo\n  echo "Adding user: $user"\n  useradd -m $user\n  homedir=$( getent passwd "$user" | cut -d: -f6 )\n  cd $homedir\n  mkdir .ssh\n  chmod 700 .ssh\n  chown $user:$user .ssh\n  echo "$key" >> .ssh/authorized_keys\n  chmod 600 .ssh/authorized_keys\n  chown $user:$user .ssh/authorized_keys\n\ndone < "$filename"\n\nrm "$filename"\nrm ~ec2-user/users.json\n\n--==BOUNDARY==\nMIME-Version: 1.0\nContent-Type: text/x-shellscript\n\n#!/bin/bash\n# Set the region to send CloudWatch Logs data to (the region where the instance is located)\nregion=$(curl 169.254.169.254/latest/meta-data/placement/availability-zone | sed s\'/.$//\')\nsed -i -e "s/region = us-east-1/region = $region/g" /etc/awslogs/awscli.conf\n\n--==BOUNDARY==',
                    {
                      SSHKeys: '%{SETTING:SSHKeys|JSONStringify}',
                      ResourceId: '%{resourceId}',
                    },
                  ],
                },
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}SSMAgentAutoUpdate',
          Template: {
            Type: 'AWS::SSM::Association',
            Properties: {
              AssociationName: 'BastionSSMAgentAutoUpdate',
              Name: 'AWS-UpdateSSMAgent',
              ScheduleExpression: 'rate(1 day)',
              Targets: [
                {
                  Key: 'tag:aws:autoscaling:groupName',
                  Values: [{ Ref: '%{resourceId}' }],
                },
              ],
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'bastion', Setting: 'Name' },
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
            '$.Resources.%{resourceId}.Properties.LaunchConfigurationName.Ref',
            '$.Resources.%{value}.Properties.SecurityGroups[0].Ref',
            "$.Resources.%{value}.Properties.Tags[?(@.Key === 'Name')].Value['Fn::Sub'][1].ResourceName",
          ],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'bastion', Setting: 'SSHKeys' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{resourceId}.Properties.LaunchConfigurationName.Ref',
            "$.Resources.%{value}.Properties.UserData['Fn::Base64']['Fn::Sub'][1].SSHKeys",
          ],
          Transformations: ['JSONStringify'],
        },
      ],
    },
    {
      Action: 'PutVirtualNetworkPlacement',
      Conditions: { ResourceType: 'bastion' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}InstancesSecurityGroup.Properties.VpcId',
          Template: '%{vpcId}',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.VPCZoneIdentifier',
          Template: '%{subnetIds}',
        },
      ],
    },
    {
      Action: 'DeleteVirtualNetworkPlacement',
      Conditions: { ResourceType: 'bastion' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}InstancesSecurityGroup.Properties.VpcId',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.VPCZoneIdentifier',
        },
      ],
    },
  ],
};
