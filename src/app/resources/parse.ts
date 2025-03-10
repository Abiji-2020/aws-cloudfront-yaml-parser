import * as definitions from './definitions';
import jp from 'jsonpath';

const WEAK_OWNERS = ['AWS::EC2::VPC'];

export default (
  template: { [key: string]: any },
  format: 'SAM' | 'Serverless',
  isDeployView: boolean,
) => {
  const resources: { [key: string]: any } = {};
  const integrations: { [key: string]: any } = {};
  const owners: { [key: string]: any } = {};
  const formatDefinitions = definitions[format];

  for (const resourceType in formatDefinitions.ResourceTypes) {
    const definition = formatDefinitions.ResourceTypes[resourceType];

    if (!('Locator' in definition)) {
      continue;
    }

    if (definition.DeployViewOnly && !isDeployView) {
      continue;
    }

    const nodes = jp.nodes(template, definition.Locator);

    for (const node of nodes) {
      let resource;
      if (definition.IsVirtualEventSource) {
        const prefix = resourceType[0].toUpperCase() + resourceType.slice(1);

        const virtualInfo: {
          VirtualEventSourceFunctionId?: any;
          VirtualEventSourceName?: any;
        } = {};

        let i = 0;
        let resourceId;
        do {
          i++;
          resourceId = i === 1 ? `${prefix}` : `${prefix}${i}`;
        } while (resourceId in resources);

        if (format === 'SAM') {
          virtualInfo.VirtualEventSourceFunctionId = node.path[2];
          virtualInfo.VirtualEventSourceName = node.path[5];
        } else {
          virtualInfo.VirtualEventSourceFunctionId = node.path[2];
          virtualInfo.VirtualEventSourceName = node.path[4].toString();
        }

        resource;
      }
    }
  }
};
