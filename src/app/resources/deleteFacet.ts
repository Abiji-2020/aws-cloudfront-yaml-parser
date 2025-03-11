export default function deleteFacet(
  state: any,
  resourceId: any,
  facetType: any,
  facetId: any,
) {
  const resource = state.resources[resourceId];
  const facets = resource.Facets[facetType];
  const facet = facets.find((facet: any) => facet.Id === facetId);

  /* This is a work- around for an issue where, if you have a stateMachine Task state with an integration,
   * and then update the definition to change the name of the task state, we do updateResourceSetting to
   * set the new definition. It sees that there's an integration associated with the deleted facet, and
   * deletes the integration. deleteIntegration is currently set up to reparse the template, since if
   * someone clicks on an integration and hits DEL, we want the state machine definition setting to be
   * updated. Then when updateResourceSetting goes to delete the facet, it no longer exists.  Here we
   * ignore its non-existence. */
  if (!facet) {
    return;
  }

  for (const resourceId of facet.TemplatePartial.Resources) {
    delete state.cfTemplate().Resources[resourceId];
  }

  for (const conditionId of facet.TemplatePartial.Conditions) {
    delete state.cfTemplate().Conditions[conditionId];
  }

  resource.Facets[facetType] = resource.Facets[facetType].filter(
    (facet: any) => facet.Id !== facetId,
  );
}
