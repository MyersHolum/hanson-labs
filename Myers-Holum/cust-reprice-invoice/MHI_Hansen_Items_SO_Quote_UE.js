/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/runtime', 'N/record', 'N/render', 'N/email', 'N/error'], (search, runtime, record, render, email, error) => {
  function beforeSubmit(context) {
    try {
      log.debug('context type', context.type);
      log.debug('execution context', runtime.executionContext);
      if (context.type != 'edit' && context.type != 'create') return;
      const rec = context.newRecord;

      checkItemLines(rec);
      // updateStatus(SO);
    } catch (e) {
      log.error('Error in updating so', e.toString());
    }
  }

  function checkItemLines(rec) {
    const lines = rec.getLineCount({
      sublistId: 'item'
    });
    for (let i = 0; i < lines; i += 1) {
      const item = rec.getSublistValue({
        sublistId: 'item',
        fieldId: 'item',
        line: i
      });
      const itemmame = rec.getSublistText({
        sublistId: 'item',
        fieldId: 'item',
        line: i
      });
      const averageCost = rec.getSublistValue({
        sublistId: 'item',
        fieldId: 'averagecost',
        line: i
      }) || 0;
      log.debug('average', averageCost);
      // averagecost
      if (averageCost == 0) {
        let type = '';
        let subtype = '';

        const itemSearchObj = search.create({
          type: 'item',
          filters:
            [
              ['internalid', 'anyof', item]
            ],
          columns:
            [
              'type',
              'subtype'
            ]
        });
        const searchResultCount = itemSearchObj.runPaged().count;
        log.debug('itemSearchObj result count', searchResultCount);
        itemSearchObj.run().each((result) => {
          // .run().each has a limit of 4,000 results
          type = result.getValue({
            name: 'type'
          }) || '';
          subtype = result.getValue({
            name: 'subtype'
          }) || '';
          log.debug('result', result);
          return true;
        });
        if (type !== 'Service' && subtype !== 'For Sale') {
          log.debug('update item', itemmame);
          rec.setSublistValue({
            sublistId: 'item',
            fieldId: 'costestimatetype',
            line: i,
            value: 'PURCHPRICE'
          });
        }
      }
    }
  }


  return {
    beforeSubmit
  };
});
