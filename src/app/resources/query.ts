import jp from 'jsonpath';
import { injectContext } from './manageCFResources';

export const nodes = (
  query: any,
  root: any,
  currentObject: any,
  context: any,
) => {
  const data = mangleQuery(query, root, currentObject, context);
  return jp.nodes(data, query);
};

export const value = (
  query: any,
  root: any,
  currentObject: any,
  context: any,
) => {
  const nodeResult = nodes(query, root, currentObject, context);
  if (nodeResult.length > 0) {
    return nodeResult[0].value;
  }
};

const mangleQuery = (
  query: any,
  root: any,
  currentObject: any,
  context: any,
) => {
  const data = {
    object: root,
    query,
  };

  data.query = injectContext(data.query, context);
  if (data.query[0] === '@') {
    data.query = '$' + data.query.substr(1);
    data.object = currentObject;
  }
  return data;
};
