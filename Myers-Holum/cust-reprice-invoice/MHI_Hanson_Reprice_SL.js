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
    const totalCost = updatedRec.getValue({ fieldId: 'totalcostestimate' }) || 0;
    const totalAmount = updatedRec.getValue({ fieldId: 'custbody_mhi_hls_so_total' }) || 0;

    for (let i = 0; i < lines; i += 1) {
      updatedRec.selectLine({ sublistId: 'item', line: i });

      const isClosed = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' }); // <-- Added to skip closed lines

log.debug({
  title: 'Closed Field Value',
  details: `Line ${i + 1}: closed = ${isClosed}`
});
      
      if (isClosed === true) { continue; } // <-- Added to skip closed lines

      let extendedCost = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'costestimate' }) || 0;
      const itemID = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' }) || 0;
      let costEstType = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'costestimatetype' }) || '';
      let change = false;

      if (extendedCost == 0) {
        const itemSearchObj = search.create({
          type: 'item',
          filters: [['internalid', 'anyof', itemID]],
          columns: ['averagecost', 'cost', 'costestimate']
        });

        itemSearchObj.run().each((result) => {
          change = true;
          const avgCost = result.getValue({ name: 'averagecost' }) || 0;
          const purchPrice = result.getValue({ name: 'cost' }) || 0;
          if (avgCost > 0) {
            extendedCost = avgCost; costEstType = 'AVGCOST';
          } else if (purchPrice > 0) {
            extendedCost = purchPrice; costEstType = 'PURCHPRICE';
          } else {
            extendedCost = 0; costEstType = 'CUSTOM';
          }
          return true;
        });
      }

      if (change === true) {
        updatedRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'costestimatetype', value: costEstType });
        updatedRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'costestimaterate', value: extendedCost });
      }

      const quantity = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' }) || 0;
      const amount = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'amount' }) || 0;

      if ((quantity == 0 || totalCost == 0) || (extendedCost == 0 || totalAmount == 0)) {
        count += 1;
      }

      updatedRec.commitLine({ sublistId: 'item' });
    }

    return count;
  }

  function getTotals(updatedRec, lines) {
    let totalCost = 0;
    for (let i = 0; i < lines; i += 1) {
      updatedRec.selectLine({ sublistId: 'item', line: i });

      const isClosed = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' }); // <-- Added to skip closed lines
      if (isClosed === true) { continue; } // <-- Added to skip closed lines

      const itemType = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype' }) || '';
      if (itemType == 'Assembly' || itemType == 'InvtPart' || itemType == 'Kit') {
        const costestimate = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'costestimate' }) || 0;
        totalCost += costestimate;
      }
    }
    return totalCost;
  }

  function getNonInvTotals(updatedRec, lines) {
    let totalNonInvAmount = 0;
    for (let i = 0; i < lines; i += 1) {
      updatedRec.selectLine({ sublistId: 'item', line: i });

      const isClosed = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' }); // <-- Added to skip closed lines
      if (isClosed === true) { continue; } // <-- Added to skip closed lines

      const itemType = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype' }) || '';
      if (itemType == 'Assembly' || itemType == 'InvtPart' || itemType == 'Kit') { continue; }

      const amount = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'amount' }) || 0;
      totalNonInvAmount += amount;
    }

    return totalNonInvAmount;
  }

  function getTotalAmount(updatedRec, lines) {
    let total = 0;
    for (let i = 0; i < lines; i += 1) {
      updatedRec.selectLine({ sublistId: 'item', line: i });

      const isClosed = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' }); // <-- Added to skip closed lines
      if (isClosed === true) { continue; } // <-- Added to skip closed lines

      const itemType = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype' }) || '';
      if (itemType == 'Assembly' || itemType == 'InvtPart' || itemType == 'Kit') {
        const amount = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'amount' }) || 0;
        total += amount;
      }
    }

    return total;
  }

  function getTax(updatedRec, lines) {
    let tax = 0;
    for (let i = 0; i < lines; i += 1) {
      updatedRec.selectLine({ sublistId: 'item', line: i });

      const isClosed = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' }); // <-- Added to skip closed lines
      if (isClosed === true) { continue; } // <-- Added to skip closed lines

      let taxRate = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1' }) || 0;
      taxRate = parseFloat(taxRate / 100.0);
      if (taxRate > 0) {
        tax = taxRate;
      }
    }

    return tax;
  }

  function onRequest(context) {
    const { request } = context;
    const { recordId, buttonType, type } = request.parameters;

    if (buttonType === 'reprice') {
      const updatedRec = record.load({
        type,
        id: recordId,
        isDynamic: true
      });

      const lines = updatedRec.getLineCount({ sublistId: 'item' });
      const count = totalNull(updatedRec, lines);
      const totalAmount = updatedRec.getValue({ fieldId: 'custbody_mhi_hls_so_total' }) || 0;
      const totalNonInvAmount = getNonInvTotals(updatedRec, lines);
      const totalInvAmount = totalAmount - totalNonInvAmount;
      const taxRate = getTax(updatedRec, lines);
      const newPreTaxInvAmt = totalInvAmount - ((totalInvAmount / (1 + taxRate)) * taxRate);

      updatedRec.setValue({
        fieldId: 'custbody_mhi_hls_total_inv',
        value: newPreTaxInvAmt,
        ignoreFieldChange: true
      });

      const totalInvItemCost = getTotals(updatedRec, lines) || 0;

      if (count == 0) {
        for (let i = 0; i < lines; i += 1) {
          updatedRec.selectLine({ sublistId: 'item', line: i });

          const isClosed = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' }); // <-- Added to skip closed lines
          if (isClosed === true) { continue; } // <-- Added to skip closed lines

          const itemType = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype' }) || '';
          if (itemType != 'Assembly' && itemType != 'InvtPart' && itemType != 'Kit') { continue; }

          const extendedCost = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'costestimate' }) || 0;
          const quantity = updatedRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' }) || 0;

          const rate = (((extendedCost / totalInvItemCost) * newPreTaxInvAmt) / quantity);

          updatedRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1 });
          updatedRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: rate });
          updatedRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: rate * quantity });
          updatedRec.commitLine({ sublistId: 'item' });
        }
      }

      updatedRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
      context.response.write({ output: `SUCCESS::${updatedRec}` });
    }
  }

  return { onRequest };
});
