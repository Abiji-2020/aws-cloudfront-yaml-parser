export default (type: any) =>
  [
    'function',
    'edgeFunction',
    'dockerTask',
    'stateMachine',
    'website',
  ].includes(type);
