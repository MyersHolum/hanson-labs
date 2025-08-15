/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/search', 'N/record'], (search, record) => {
  const beforeSubmit = (context) => {
    try {
      log.debug('context', context);
      log.debug('context type', context.type);

      if (context.type == 'create') { // change to create only
        const invoiceRec = context.newRecord;
        const createdFrom = invoiceRec.getValue({
          fieldId: 'createdfrom'
        }) || 0;
        log.debug('created', createdFrom);
        if (createdFrom == 0) { return; }

        const SO = record.load({
          type: record.Type.SALES_ORDER,
          id: createdFrom
        });
        const related = SO.getLineCount({
          sublistId: 'links'
        });
        const lines = invoiceRec.getLineCount({
          sublistId: 'item'
        });
        for (let i = 0; i < lines; i += 1) {

          const lineQty = invoiceRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
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
          log.debug('SO qty:' + Number(SOqty) + ' SO inv qty: ' + Number(SOinvoiceQty), Number(SOqty) - Number(SOinvoiceQty));
          if (related == 0) {
            SO.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_hls_mhi_qtyrem_stored',
              line: SOline,
              value: Number(SOqty) - Number(SOinvoiceQty)
            });
          } else {
            log.debug('past invoices exist');
            const SObilled = SO.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantitybilled',
              line: SOline
            }) || 0;
            SO.setSublistValue({
              sublistId: 'item',
              fieldId: 'custcol_hls_mhi_qtyrem_stored',
              line: SOline,
              value: Number(SOqty) - Number(SObilled) - Number(SOinvoiceQty)
            });
            log.debug('SOqty', SOqty);
            log.debug('quantitybilled', SObilled);
            log.debug('SOinvoiceQty', SOinvoiceQty);

            // let totalPastInvQty = 0;
            // for (let j = 0; j < related; j += 1) {
            //   const tranid = SO.getSublistValue({
            //     sublistId: 'links',
            //     fieldId: 'tranid',
            //     line: related
            //   }) || '';
            //   if (tranid.indexOf('INV') !== -1) {
            //     const invoiceID = SO.getSublistValue({
            //       sublistId: 'links',
            //       fieldId: 'id',
            //       line: related
            //     }) || 0;
            //     const relatedInv = record.load({
            //       type: record.Type.INVOICE,
            //       id: invoiceID
            //     });
            //     const invline = relatedInv.findSublistLineWithValue({
            //       sublistId: 'item',
            //       fieldId: 'item',
            //       value: item
            //     });
            //     log.debug('invline', invline);
            //     const pastInvQty = relatedInv.getSublistValue({
            //       sublistId: 'item',
            //       fieldId: 'quantity',
            //       line: j
            //     }) || 0;
            //     totalPastInvQty += pastInvQty;
            //     log.debug('item:', item);
            //     log.debug('pastInvLine:', invline);
            //     log.debug('pastInvQty:', pastInvQty);
            //   }
            // }

            // SO.setSublistValue({
            //   sublistId: 'item',
            //   fieldId: 'custcol_hls_mhi_qtyrem_stored',
            //   line: SOline,
            //   value: Number(SOqty) - Number(totalPastInvQty)
            // });
            // log.debug('SO qty:' + Number(SOqty) + ' SO past inv qty: ' + Number(totalPastInvQty), Number(SOqty) - Number(totalPastInvQty));
          }

          // SOinvoiceQty instead of SOqtyBilled?
          // SO.setSublistValue({
          //   sublistId: 'item',
          //   fieldId: 'custcol_hls_quantityremaining',
          //   line: SOline,
          //   value: Number(SOqty) - Number(SOinvoiceQty)
          // });
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
