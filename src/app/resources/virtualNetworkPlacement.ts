import Id, { TYPES as IdTypes } from './id';
import resolveBinding from './resolveBinding';

export const ERROR_CODES = {
  DEFAULT_VPC_PLACEMENT: 'defaultVPCPlacement',
  UNKNOWN_VPC_PLACEMENT: 'unknownVPCPlacement',
};

export default class VirtualNetworkPlacement {
  SubnetIds?: any;
  SecurityGroupIds?: any;
  VirtualNetworkId?: any;

  constructor(
    format: 'SAM' | 'serverless',
    definition: any,
    template: any,
    resources: any,
    object: any,
  ) {
    const cfTemplate = format === 'SAM' ? template : template.resources || {};

    try {
      if (definition.Subnets) {
        const subnetIdProps = resolveBinding(
          definition.Subnets,
          template,
          object,
          {},
        );

        if (Array.isArray(subnetIdProps)) {
          this.SubnetIds = subnetIdProps.map(
            (subnet) => new Id(subnet, template, resources),
          );
        } else if (subnetIdProps && 'Fn::Split' in subnetIdProps) {
          const args = subnetIdProps['Fn::Split'];
          if (!Array.isArray(args) || args.length !== 2) {
            throw new Error(
              'Expected Fn::Split argument to be array of size 2',
            );
          }
          this.SubnetIds = [new Id(args[1], template, object)];
        } else if (subnetIdProps && 'Fn::If' in subnetIdProps) {
          let args = subnetIdProps['Fn::If'];
          if (!Array.isArray(args) || args.length !== 3) {
            throw new Error('Expected Fn::If argument to be array of size 3');
          }
          args = args[1]; // Use the 'true' branch of the if
          if (Array.isArray(args)) {
            this.SubnetIds = args.map(
              (subnet) => new Id(subnet, template, resources),
            );
          } else {
            this.SubnetIds = [new Id(args, template, object)];
          }
        } else if (subnetIdProps) {
          this.SubnetIds = [new Id(subnetIdProps, template, object)];
        }
      }
    } catch (err) {
      console.log('Error parsing Subnets: ', err);
    }

    if (definition.SecurityGroups) {
      this.SecurityGroupIds = resolveBinding(
        definition.SecurityGroups,
        template,
        object,
        {},
      ).map((securityGroup: any) => new Id(securityGroup, template, resources));
    }

    if (definition.VirtualNetwork) {
      this.VirtualNetworkId = new Id(
        resolveBinding(definition.VirtualNetwork, template, object, {}),
        template,
        resources,
      );
    }

    if (!this.VirtualNetworkId && this.SubnetIds && this.SubnetIds.length > 0) {
      const localSubnet = this.SubnetIds.find((subnetId: any) =>
        subnetId.isLocalResource(),
      );

      if (localSubnet && localSubnet.Type !== IdTypes.VIRTUAL) {
        const resource = cfTemplate.Resources[localSubnet.ResourceId];

        if (resource.Type === 'AWS::EC2::Subnet') {
          this.VirtualNetworkId = new Id(
            cfTemplate.Resources[localSubnet.ResourceId].Properties.VpcId,
            template,
            resources,
          );
        }
      }
    }

    if (
      !this.VirtualNetworkId &&
      this.SecurityGroupIds &&
      this.SecurityGroupIds.length > 0
    ) {
      const localSecurityGroup = this.SecurityGroupIds.find(
        (securityGroup: any) => securityGroup.isLocalResource(),
      );

      if (localSecurityGroup && localSecurityGroup.Type !== IdTypes.VIRTUAL) {
        const resource = cfTemplate.Resources[localSecurityGroup.ResourceId];

        if (resource.Type === 'AWS::EC2::SecurityGroup') {
          this.VirtualNetworkId = new Id(
            cfTemplate.Resources[
              localSecurityGroup.ResourceId
            ].Properties.VpcId,
            template,
            resources,
          );
        } else if (resource.Type === 'AWS::EC2::VPC') {
          // For default VPC security groups (e.g. !GetAtt vpc.DefaultSecurityGroup)
          this.VirtualNetworkId = new Id(
            { Ref: localSecurityGroup.ResourceId },
            template,
            resources,
          );
        }
      }
    }

    if (!this.VirtualNetworkId) {
      const err = new Error('Failed to determine VPC placement');
      (err as any).code = ERROR_CODES.UNKNOWN_VPC_PLACEMENT;
      throw err;
    }

    if (
      this.VirtualNetworkId.Type === IdTypes.PARAMETER &&
      this.VirtualNetworkId.ParameterId === 'DefaultVPCId'
    ) {
      const err = new Error('Resource placed in default VPC');
      (err as any).code = ERROR_CODES.DEFAULT_VPC_PLACEMENT;
      throw err;
    }
  }
}
