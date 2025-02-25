const WEAK_OWNERS = ['AWS::EC2::VPC'];

export default (
  template: { [key: string]: any },
  format: 'SAM' | 'Serverless',
) => {
  const resources: { [key: string]: any } = {};
  const integrations: { [key: string]: any } = {};
  const owners: { [key: string]: any } = {};
};
