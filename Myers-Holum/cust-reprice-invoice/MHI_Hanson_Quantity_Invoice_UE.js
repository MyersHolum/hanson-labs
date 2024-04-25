/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record'], (search, record) => {
  const beforeSubmit = (context) => {
    try {
      log.debug('context', context);
      log.debug('context type', context.type);

      if (context.type == 'create' || context.type == 'edit') { // change to create only
        const invoiceRec = context.newRecord;
        const lines = invoiceRec.getLineCount({
          sublistId: 'item'
        });
        for (let i = 0; i < lines; i += 1) {
          const invoiceQty = invoiceRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_hls_invoice_qty',
            line: i
          }) || 0;
          invoiceRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i,
            value: invoiceQty
          });
        }
      }
    } catch (e) {
      log.error('Rendering error', e);
      throw e;
    }
  };

  return {
    beforeSubmit
  };
});
