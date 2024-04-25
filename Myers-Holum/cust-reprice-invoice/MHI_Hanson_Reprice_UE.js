/* eslint-disable max-len */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
  'N/record',
  'N/runtime',
  'N/search',
  'N/currentRecord'
], (
  record,
  runtime,
  search,
  currentRecord
) => {
  function beforeLoad(context) {
    if (context.type != context.UserEventType.VIEW) return;
    if (runtime.executionContext != runtime.ContextType.USER_INTERFACE) return;

    const { newRecord, form } = context;
    form.clientScriptModulePath = 'SuiteScripts/Myers-Holum/Client-Scripts/MHI_Hanson_Reprice_CS.js';

    const { id, type } = newRecord;

    log.debug(`beforeLoad::${newRecord.id}::approve`);

    form.addButton({
      id: 'custpage_reprice',
      label: 'Reprice',
      functionName: 'reprice("' + id + '","' + type + '")'
    });
  }

  return {
    beforeLoad
  };
});
