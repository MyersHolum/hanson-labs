/* eslint-disable camelcase */
/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
  'N/record', 'N/search'
], (
  record, search
) => {
  function totalNull(updatedRec, lines) {
    let count = 0;
    const totalCost = updatedRec.getValue({
      fieldId: 'totalcostestimate'
    }) || 0;
    const totalCostInv = updatedRec.getValue({
      fieldId: 'custbody_mhi_hls_total_inv_cost'
    }) || 0;
    const totalAmount = updatedRec.getValue({
      fieldId: 'custbody_mhi_hls_so_total'
    }) || 0;
    for (let i = 0; i < lines; i += 1) {
      // price -1 for custom price for field "price"
      updatedRec.selectLine({
        sublistId: 'item',
        line: i
      });
      let extendedCost = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'costestimate'
      }) || 0;
      const itemID = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'item'
      }) || 0;
      let costEstType = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'costestimatetype'
      }) || '';
      let change = false;
      log.debug('cost est type', costEstType);
      if (costEstType == 'AVGCOST' && extendedCost == 0) {
        const itemSearchObj = search.create({
          type: 'item',
          filters:
          [
            ['internalid', 'anyof', itemID]
          ],
          columns:
          [
            'averagecost',
            'cost',
            'costestimate'
          ]
        });
        const searchResultCount = itemSearchObj.runPaged().count;
        log.debug('itemSearchObj result count', searchResultCount);
        itemSearchObj.run().each((result) => {
          // .run().each has a limit of 4,000 results
          change = true;
          const purchPrice = result.getValue({ name: 'cost' }) || 0;
          const itemDefCost = result.getValue({ name: 'costestimate' }) || 0;
          if (purchPrice > 0) { extendedCost = purchPrice; costEstType = 'PURCHPRICE'; } else if (itemDefCost > 0) { extendedCost = itemDefCost; costEstType = 'ITEMDEFINED'; } else { extendedCost = 0; costEstType = 'CUSTOM'; }

          return true;
        });
      }

      log.debug('change', change);
      if (change == true) {
        updatedRec.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'costestimatetype',
          value: costEstType
        });
        updatedRec.setCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'costestimaterate',
          value: extendedCost
        });
      }

      // updatedRec.setCurrentSublistValue({
      //   sublistId: 'item',
      //   fieldId: 'costestimate',
      //   value: extendedCost
      // });
      const quantity = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'quantity'
      }) || 0;
      const amount = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'amount'
      }) || 0;
      log.debug('quantity, extended cost, total cost, total amount', 'q:' + quantity + ' ec:' + extendedCost + ' tc:' + totalCost + ' ta:' + totalAmount);

      log.debug('amount::', amount);
      if (((quantity == 0 || totalCost == 0) || (extendedCost == 0 || totalAmount == 0)) || totalCostInv == 0) {
        count += 1;
      }

      updatedRec.commitLine({ sublistId: 'item' });
    }

    return count;
  }

  function getTotals(updatedRec, lines) {
    let totalCost = 0;
    for (let i = 0; i < lines; i += 1) {
      // price -1 for custom price for field "price"
      updatedRec.selectLine({
        sublistId: 'item',
        line: i
      });
      const itemType = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'itemtype'
      }) || '';
      if ((itemType == 'Assembly' || itemType == 'InvtPart') || itemType == 'Kit') {
        const costestimate = updatedRec.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'costestimate'
        }) || 0;
        totalCost += costestimate;
      }
    }

    log.debug('totalCost', totalCost);

    return totalCost;
  }

  function getTotalAmount(updatedRec, lines) {
    let total = 0;
    for (let i = 0; i < lines; i += 1) {
      // price -1 for custom price for field "price"
      updatedRec.selectLine({
        sublistId: 'item',
        line: i
      });
      const itemType = updatedRec.getCurrentSublistValue({
        sublistId: 'item',
        fieldId: 'itemtype'
      }) || '';
      if ((itemType == 'Assembly' || itemType == 'InvtPart') || itemType == 'Kit') {
        const amount = updatedRec.getCurrentSublistValue({
          sublistId: 'item',
          fieldId: 'amount'
        }) || 0;
        total += amount;
      }
    }

    log.debug('total amount', total);

    return total;
  }

  function onRequest(context) {
    log.debug('onRequest::context', context);

    const { request } = context;
    const { parameters } = request;
    log.debug('onRequest::parameters', parameters);

    const { recordId, buttonType, type } = parameters;

    if (buttonType == 'reprice') {
      log.debug(`reprice::${recordId}`);

      const updatedRec = record.load({
        type,
        id: recordId,
        isDynamic: true
      });
      const lines = updatedRec.getLineCount({
        sublistId: 'item'
      });
      const count = totalNull(updatedRec, lines);

      log.debug('count::', count);
      const totalCost = updatedRec.getValue({
        fieldId: 'totalcostestimate'
      }) || 0;
      const totalAmount = updatedRec.getValue({
        fieldId: 'custbody_mhi_hls_so_total'
      }) || 0;
      const totalNonInvAmount = updatedRec.getValue({
        fieldId: 'custbody_mhi_hls_total_non_inv'
      }) || 0;
      // const custbody_mhi_hls_total_inv = updatedRec.getValue({
      //   fieldId: 'custbody_mhi_hls_total_inv'
      // }) || 0;
      // const totalInvAmount = getTotalAmount(updatedRec, lines) || 0;
      let totalInvAmount = updatedRec.getValue({
        fieldId: 'custbody_mhi_hls_total_inv'
      }) || 0;
      if (totalInvAmount == 0) {
        totalInvAmount = getTotalAmount(updatedRec, lines);
      }

      let taxRate = updatedRec.getValue({
        fieldId: 'custbody_mhi_tax_rate_salesorder_pdf'
      }) || 0;
      // log.debug('custbody_mhi_hls_total_inv', custbody_mhi_hls_total_inv);

      taxRate = parseFloat(taxRate / 100.0);
      log.debug('totalInvAmount', totalInvAmount);
      log.debug('taxRate', taxRate);

      const newPreTaxInvAmt = totalInvAmount - ((totalInvAmount / (1 + taxRate)) * taxRate);
      updatedRec.setValue({
        fieldId: 'custbody_mhi_hls_total_inv',
        value: newPreTaxInvAmt,
        ignoreFieldChange: true
      });
      log.debug('newPreTaxInvAmt', newPreTaxInvAmt);
      let totalInvItemCost = updatedRec.getValue({
        fieldId: 'custbody_mhi_hls_total_inv_cost'
      }) || 0;
      log.debug('custbody_mhi_hls_total_inv_cost', totalInvItemCost);

      const totalInvItemCostTesting = getTotals(updatedRec, lines) || 0;
      log.debug('totalInvItemCostTesting', totalInvItemCostTesting);

      if (totalInvItemCost == 0) {
      // const custbody_mhi_hls_total_inv_cost = updatedRec.getValue({
      //   fieldId: 'custbody_mhi_hls_total_inv_cost'
      // }) || 0;
      // log.debug('custbody_mhi_hls_total_inv_cost', custbody_mhi_hls_total_inv_cost);
        totalInvItemCost = getTotals(updatedRec, lines) || 0;
        updatedRec.setValue({
          fieldId: 'custbody_mhi_hls_total_inv_cost',
          value: totalInvItemCost
        });
      }

      const subtotal = 0;
      if (count == 0) {
        // case for no null values and all calculations take place
        for (let i = 0; i < lines; i += 1) {
          // price -1 for custom price for field "price"
          updatedRec.selectLine({
            sublistId: 'item',
            line: i
          });
          const itemType = updatedRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'itemtype'
          }) || '';
          if (itemType == 'Service' || itemType == 'Resale') { continue; }

          const extendedCost = updatedRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'costestimate'
          }) || 0;
          const quantity = updatedRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity'
          }) || 0;
          let tax = updatedRec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'taxrate1'
          }) || 0;
          tax = parseFloat(tax) / 100.0;

          log.debug('quantity, extended cost, total cost, total amount', 'q:' + quantity + ' ec:' + extendedCost + ' tc:' + totalCost + ' ta:' + totalAmount);

          // ((Total Transaction Amount - Total Non-Inventory Amount) = Total Inventory Amount
          // Total Inventory Amount - (Total Inventory Amount/ (1+ Tax Rate) X Tax Rate)) = New Pre-Tax Total Inventory Amount
          // ((Est. Extended Cost (Line) / Total Inventory Item Cost (custom field)) X NEW Pre-Tax Total Inventory Amount / Quantity = Line Item Rate
          const rate = (((extendedCost / totalInvItemCost) * newPreTaxInvAmt) / quantity);
          log.debug('rate::', rate);

          // rate = (parseInt(rate * 10000, 10) / 10000)
          log.debug('rate after parseint::', rate);
          log.debug('extendedCost::', extendedCost);
          log.debug('totalInvItemCost::', totalInvItemCost);
          log.debug('newPreTaxInvAmt for new rate::', newPreTaxInvAmt);
          log.debug('quantity::', quantity);

          updatedRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'price',
            value: -1,
            forceSyncSourcing: true
          });
          updatedRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            value: rate,
            forceSyncSourcing: true
          });
          updatedRec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            value: rate * quantity,
            forceSyncSourcing: true
          });
          updatedRec.commitLine({ sublistId: 'item' });
        }
      }

      const newTotalInvCost = updatedRec.getValue({
        fieldId: 'custbody_mhi_hls_total_inv_cost'
      });
      log.debug('newTotalInvCost', newTotalInvCost);
      const lineNum = updatedRec.getLineCount({
        sublistId: 'item'
      });
      const newTotalInvCostTest = getTotals(updatedRec, lineNum);
      log.debug('newTotalInvCostTest', newTotalInvCostTest);

      updatedRec.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });

      log.debug(`onRequest::updatedInvRecId::${buttonType}::${recordId}`, updatedRec);

      if (updatedRec) {
        context.response.write({ output: `SUCCESS::${updatedRec}` });
      }
    }
  }

  return {
    onRequest
  };
});
