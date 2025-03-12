export default class AbstractResource {
  TemplatePartial: any;
  constructor() {
    this.TemplatePartial = {
      Conditions: [],
      Resources: [],
    };
  }

  addCFResource(template: any, logicalId: any, type: any, resource: any) {
    const resourceSection = this.typeToTemplate(type);
    if (!this.TemplatePartial[resourceSection].includes(logicalId)) {
      this.TemplatePartial[resourceSection].push(logicalId);
    }

    if (resource && resource.TemplatePartial && this.TemplatePartial) {
      for (const section of ['Conditions', 'Resources']) {
        const partials = this.TemplatePartial[section];
        const resourcePartials = resource.TemplatePartial[section];

        // If either the target or resource section is missing, skip to the next iteration
        if (!partials || !resourcePartials) continue;

        for (const logicalId of resourcePartials) {
          if (!partials.includes(logicalId)) {
            partials.push(logicalId);
          }
        }
      }
    } else {
      console.log(
        'Either resource.TemplatePartial or this.TemplatePartial is undefined.',
      );
    }
  }

  typeToTemplate(type: any) {
    return `${type}s`;
  }
}
