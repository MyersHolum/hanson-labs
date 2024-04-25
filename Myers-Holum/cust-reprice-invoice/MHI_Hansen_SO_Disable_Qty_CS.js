/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/ui/dialog', 'N/runtime', 'N/ui/message'], (
  record,
  search,
  dialog,
  runtime,
  message
) => {
  function disableSublistField(rec, field, sublist) {
    const stringField = field + '';
    const stringSublistField = sublist + '';
    const lines = rec.getLineCount({
      sublistId: stringSublistField
    });
    for (let i = 0; i < lines; i += 1) {
      const fieldCheck = rec.getSublistField({
        sublistId: stringSublistField,
        fieldId: stringField,
        line: i
      });
      if (fieldCheck) {
        const subField = rec.getSublistField({
          sublistId: stringSublistField,
          fieldId: stringField,
          line: i
        });
        subField.isDisabled = true;
      }
    }
  }

  function postSourcing(context) {
    const { currentRecord } = context;
    const internalID = currentRecord.id || 0;
    console.log('internal id:', internalID);
    if (internalID) {
      const transactionSearchObj = search.create({
        type: 'transaction',
        filters:
            [
              ['type', 'anyof', 'CustInvc'],
              'AND',
              ['createdfrom', 'anyof', internalID]
            ],
        columns:
            [
              'createdfrom'
            ]
      });
      const searchResultCount = transactionSearchObj.runPaged().count;
      console.log('transactionSearchObj result count', searchResultCount);
      if (searchResultCount > 0) {
        disableSublistField(currentRecord, 'quantity', 'item');
      }
    }
  }

  return {
    postSourcing
  };
});
