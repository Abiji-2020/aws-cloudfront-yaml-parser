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

    if (resource) {
      for (const section of ['Conditions', 'Resources']) {
        const partials = this.TemplatePartial[section];

        for (const logicalId of resource.TemplatePartial[section]) {
          if (!partials.includes(logicalId)) {
            partials.push(logicalId);
          }
        }
      }
    }
  }

  typeToTemplate(type: any) {
    return `${type}s`;
  }
}
