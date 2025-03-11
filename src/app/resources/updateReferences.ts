import Id from './id';
import Parameter from './parameter';

export default (fnId: any, template: any, resources: any, references: any) => {
  const fn = resources[fnId];

  const fnReferences = references[fnId] || {};
  for (const [referenceName, reference] of Object.entries(fnReferences)) {
    if ((reference as any).IsVirtualReferenceResource) {
      /* Virtual resource references are allowed to persist because there
       * are no persistent environment settings to recreate them from. */
      continue;
    }
    delete references[fnId][referenceName];
    if (Object.keys(references[fnId]).length === 0) {
      delete references[fnId];
    }
  }

  if (!('Environment' in fn.Settings)) {
    return;
  }

  for (const name in fn.Settings.Environment) {
    let value = fn.Settings.Environment[name];

    if (typeof value !== 'object') {
      continue;
    }

    if (value instanceof Parameter) {
      value = value.reference();
    }

    const target = new Id(value, template, resources);

    // If the target isn't local to this stack, skip
    if (!target.isLocalResource()) {
      continue;
    }

    /* If the target isn't a CFN resource, skip. This occurs when an env
     * var of a compute node has a CF reference to a resource CFN doesn't
     * see as a top-level resource. */
    if (!(target.ResourceId in resources)) {
      continue;
    }

    /* Once the virtual reference is created, the original environment setting is
     * deleted from the resource settings. */
    if (target.IsVirtualReferenceResource) {
      delete fn.Settings.Environment[name];
      if (Object.keys(fn.Settings.Environment).length === 0) {
        delete fn.Settings.Environment;
      }
    }

    if (!(fnId in references)) {
      references[fnId] = {};
    }

    references[fnId][name] = target;
  }
};
