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
        const createdFrom = invoiceRec.getValue({
            fieldId: 'createdfrom',
          }) || 0;
        log.debug('created', createdFrom);
        if (createdFrom == 0) { return; }
        const SO = record.load({
    type: record.Type.SALES_ORDER,
    id: createdFrom
});
        const lines = invoiceRec.getLineCount({
          sublistId: 'item'
        });
        for (let i = 0; i < lines; i += 1) {
          const invoiceQty = invoiceRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_hls_invoice_qty',
            line: i
          }) || 0;
          const item = invoiceRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i
          }) || 0;
                  log.debug('item', item);

            const SOline = SO.findSublistLineWithValue({
    sublistId: 'item',
    fieldId: 'item',
    value: item
});
                            log.debug('SOline', SOline);

         const SOinvoiceQty = SO.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcolcustcol_hls_invoice_qty',
            line: SOline
          }) || 0; 
          const SOqty = SO.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: SOline
          }) || 0; 
          const SOqtyBilled = SO.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantitybilled',
            line: SOline
          }) || 0; 
           log.debug('SOinvoiceQty', SOinvoiceQty);
          SO.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcolcustcol_hls_invoice_qty',
            line: SOline,
            value: 0
          });
          log.debug('SO qty:' + Number(SOqty) + ' SO inv qty: ' + Number(SOinvoiceQty) , Number(SOqty) - Number(SOinvoiceQty));
          SO.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_hls_mhi_qtyrem_stored',
            line: SOline,
            value: Number(SOqty) - Number(SOinvoiceQty)
          }); // SOinvoiceQty instead of SOqtyBilled?
          invoiceRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i,
            value: SOinvoiceQty
          });
          
        }
        SO.save();
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
