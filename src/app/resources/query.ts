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

const del = (query: any, root: any, currentObject: any, context: any = {}) => {
  const data = mangleQuery(query, root, currentObject, context);

  const nodes = jp.nodes(data.object, data.query);

  for (const node of nodes) {
    node.path.shift();

    delTraverse(data.object, node.path);
  }
};
export { del as delete };

const delTraverse = (root: any, path: any) => {
  if (path.length === 1) {
    if (Array.isArray(root)) {
      root.splice(path[0], 1);
    } else {
      delete root[path[0]];
    }
  } else {
    const child = root[path[0]];
    const subpath = path.slice(1);
    delTraverse(child, subpath);

    if (
      (Array.isArray(child) ? child.length : Object.keys(child).length) === 0
    ) {
      if (Array.isArray(root)) {
        root.splice(path[0]);
      } else {
        delete root[path[0]];
      }
    }
  }
};

export const update = (
  query: any,
  root: any,
  currentObject: any,
  value: any,
  context: any = {},
) => {
  const data = mangleQuery(query, root, currentObject, context);

  const parsedQuery = jp.parse(data.query);
  const leafElement = parsedQuery.pop();

  if (leafElement.expression.type === 'filter_expression') {
    jp.value(data.object, data.query, value);
  } else {
    // Create leaf value for all possible locations
    const parentQuery = parsedQuery
      .map((part) => {
        switch (part.expression.type) {
          case 'root':
            return '$';

          case 'numeric_literal':
          case 'filter_expression':
            return `[${part.expression.value}]`;

          default:
            return `['${part.expression.value}']`;
        }
      })
      .join('');

    const nodes = jp.nodes(data.object, parentQuery);

    if (nodes.length > 0) {
      nodes.forEach((node) => {
        node.value[leafElement.expression.value] = value;
      });
    } else {
      jp.value(data.object, data.query, value);
    }
  }
};
